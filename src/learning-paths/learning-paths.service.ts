import { BadGatewayException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import Anthropic from '@anthropic-ai/sdk';
import { DataSource, Repository } from 'typeorm';
import { CoursesService } from '../courses/courses.service';
import { GenerateLearningPathsDto } from './dto/generate-learning-paths.dto';
import { LearningPath } from './entities/learning-path.entity';
import { UserAssessment } from './entities/user-assessment.entity';
import { UpdateCourseProgressDto } from './dto/update-course-progress.dto';

interface GeneratedPath { title: string; description: string; estimatedWeeks: number; totalHours: number; courses: { courseId: string; order: number; reason: string }[]; tips: string[]; }

@Injectable()
export class LearningPathsService {
  private readonly anthropic: Anthropic | null;
  constructor(
    config: ConfigService,
    private readonly coursesService: CoursesService,
    private readonly dataSource: DataSource,
    @InjectRepository(LearningPath) private readonly paths: Repository<LearningPath>,
  ) {
    const key = config.get<string>('ANTHROPIC_API_KEY');
    this.anthropic = key ? new Anthropic({ apiKey: key }) : null;
  }

  async generate(profileId: string, dto: GenerateLearningPathsDto) {
    if (!this.anthropic) throw new ServiceUnavailableException('La generación de rutas no está configurada');
    const catalog = await this.coursesService.getCatalogSummary();
    if (!catalog.length) throw new ServiceUnavailableException('No hay cursos activos para generar rutas');
    const prompt = `Genera exactamente una ruta por cada interés, en el mismo orden. Responde únicamente JSON válido con la forma {"paths":[{"title":string,"description":string,"estimatedWeeks":integer,"totalHours":integer,"courses":[{"courseId":uuid,"order":integer,"reason":string}],"tips":[string]}]}. Selecciona solo cursos del catálogo y usa sus UUID exactos. Ordena desde fundamentos a avanzado y personaliza según objetivo, nivel, horas semanales y tecnologías. Cada ruta debe ser pertinente a su interés, con cursos distintos cuando sea posible. No inventes cursos.\nPerfil: ${JSON.stringify(dto)}\nCatálogo: ${JSON.stringify(catalog.map(({ id, title, description, category, level, durationHours, tags }) => ({ id, title, description, category, level, durationHours, tags })))}`;
    let generated: GeneratedPath[];
    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-6', max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }],
      });
      const raw = response.content.find((item) => item.type === 'text')?.text;
      const parsed = JSON.parse(raw ?? '{}') as { paths?: GeneratedPath[] };
      generated = parsed.paths ?? [];
    } catch {
      throw new BadGatewayException('No se pudieron generar las rutas con el servicio de IA');
    }
    if (generated.length !== dto.interests.length) throw new BadGatewayException('La IA devolvió una cantidad incorrecta de rutas');
    const activeIds = new Set(catalog.map((course) => course.id));
    for (const path of generated) {
      if (!path.title || !path.description || !Number.isInteger(path.estimatedWeeks) || !Number.isInteger(path.totalHours) ||
        !Array.isArray(path.courses) || path.courses.length === 0 || !Array.isArray(path.tips) ||
        path.courses.some((course) => !activeIds.has(course.courseId) || !Number.isInteger(course.order) || !course.reason)) {
        throw new BadGatewayException('La IA devolvió una ruta con datos inválidos');
      }
      path.courses.sort((a, b) => a.order - b.order);
    }
    return this.dataSource.transaction(async (manager) => {
      const assessmentRepo = manager.getRepository(UserAssessment);
      const assessment = await assessmentRepo.save(assessmentRepo.create({
        profileId, interests: dto.interests.map((interest) => interest.trim()), goals: dto.goals.trim(),
        currentLevel: dto.currentLevel, availableHoursPerWeek: dto.availableHoursPerWeek,
        preferredTechnologies: dto.preferredTechnologies ?? [],
      }));
      const pathRepo = manager.getRepository(LearningPath);
      const savedPaths = await pathRepo.save(generated.map((path) => pathRepo.create({
        profileId, assessmentId: assessment.id, title: path.title, description: path.description,
        estimatedWeeks: path.estimatedWeeks, totalHours: path.totalHours,
        coursesOrder: path.courses, tips: path.tips,
      })));
      return { assessment, learningPaths: savedPaths };
    });
  }

  findAllByUser(profileId: string): Promise<LearningPath[]> {
    return this.paths.find({ where: { profileId }, order: { createdAt: 'DESC' } });
  }

  async findOne(profileId: string, id: string): Promise<LearningPath> {
    const path = await this.paths.findOne({ where: { id, profileId }, relations: { assessment: true } });
    if (!path) throw new NotFoundException('Ruta de aprendizaje no encontrada');
    const courseIds = path.coursesOrder.map((course) => course.courseId);
    const courses = await Promise.all(courseIds.map(async (courseId) => {
      const course = await this.coursesService.findById(courseId).catch(() => null);
      if (!course) return null;
      const lessons = await this.coursesService.findLessonsWithProgress(profileId, courseId);
      return { ...course, lessons };
    }));
    return Object.assign(path, { courses: courses.filter(Boolean) });
  }

  async updateLessonProgress(profileId: string, pathId: string, courseId: string, lessonId: string, dto: UpdateCourseProgressDto) {
    const path = await this.paths.findOne({ where: { id: pathId, profileId } });
    if (!path) throw new NotFoundException('Ruta de aprendizaje no encontrada');
    if (!path.coursesOrder.some((course) => course.courseId === courseId)) {
      throw new NotFoundException('El curso no pertenece a esta ruta');
    }
    const lesson = await this.coursesService.findLessons(courseId).then((lessons) => lessons.find((item) => item.id === lessonId));
    if (!lesson) throw new NotFoundException('Lección no encontrada para el curso indicado');
    return this.coursesService.setLessonCompletion(profileId, lessonId, dto.completed, true);
  }

  async remove(profileId: string, id: string): Promise<void> {
    const result = await this.paths.delete({ id, profileId });
    if (!result.affected) throw new NotFoundException('Ruta de aprendizaje no encontrada');
  }
}
