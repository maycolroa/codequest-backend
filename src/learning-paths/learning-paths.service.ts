import { Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CoursesService } from '../courses/courses.service';
import { GenerateLearningPathsDto } from './dto/generate-learning-paths.dto';
import { LearningPath } from './entities/learning-path.entity';
import { UserAssessment } from './entities/user-assessment.entity';
import { UpdateCourseProgressDto } from './dto/update-course-progress.dto';


@Injectable()
export class LearningPathsService {
  constructor(
    private readonly coursesService: CoursesService,
    private readonly dataSource: DataSource,
    @InjectRepository(LearningPath) private readonly paths: Repository<LearningPath>,
  ) {}

  async generate(profileId: string, dto: GenerateLearningPathsDto) {
    const catalog = await this.coursesService.getCatalogSummary();
    if (!catalog.length) throw new ServiceUnavailableException('No hay cursos activos para generar rutas');
    const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const aliases: Record<string, string[]> = {
      frontend: ['frontend', 'front-end', 'ui', 'web'], backend: ['backend', 'back-end', 'api', 'servidor'],
      mobile: ['mobile', 'movil', 'flutter', 'react native'], devops: ['devops', 'cloud', 'infraestructura', 'docker'],
      'bases de datos': ['database', 'databases', 'base de datos', 'sql', 'postgres'], testing: ['testing', 'test', 'qa'],
      'ia aplicada': ['ia', 'ai', 'machine learning', 'inteligencia artificial'], arquitectura: ['arquitectura', 'architecture'],
      seguridad: ['seguridad', 'security'],
    };
    const level = normalize(dto.currentLevel);
    const levelWeight = (courseLevel: string) => normalize(courseLevel) === level ? 3 : 0;
    const selected = new Set<string>();
    const generated = dto.interests.map((interest) => {
      const normalizedInterest = normalize(interest);
      const terms = aliases[normalizedInterest] ?? [normalizedInterest];
      const ranked = catalog.map((course) => {
        const searchable = [course.title, course.description, course.category, ...course.tags].map(normalize).join(' ');
        const matches = terms.reduce((score, term) => score + (searchable.includes(normalize(term)) ? 1 : 0), 0);
        return { course, score: matches * 10 + levelWeight(course.level) - (selected.has(course.id) ? 2 : 0) };
      }).filter(({ score }) => score > 0).sort((a, b) => b.score - a.score || a.course.title.localeCompare(b.course.title));
      const candidates = (ranked.length ? ranked : catalog.map((course) => ({ course, score: 0 }))).slice(0, 8);
      candidates.forEach(({ course }) => selected.add(course.id));
      const courses = candidates.map(({ course }, index) => ({ courseId: course.id, order: index + 1, reason: `Coincide con ${interest} y el nivel ${dto.currentLevel}` }));
      const totalHours = candidates.reduce((sum, { course }) => sum + Number(course.durationHours ?? 0), 0);
      return { title: `Ruta de ${interest}`, description: `Cursos seleccionados del catálogo para desarrollar conocimientos en ${interest}.`, estimatedWeeks: Math.max(1, Math.ceil(totalHours / dto.availableHoursPerWeek)), totalHours, courses, tips: ['Sigue los cursos en el orden recomendado.', 'Completa las lecciones y revisa tus prerequisitos.'] };
    });
    return this.dataSource.transaction(async (manager) => {
      const assessmentRepo = manager.getRepository(UserAssessment);
      const assessment = await assessmentRepo.save(assessmentRepo.create({ profileId, interests: dto.interests.map((interest) => interest.trim()), goals: dto.goals.trim(), currentLevel: dto.currentLevel, availableHoursPerWeek: dto.availableHoursPerWeek, preferredTechnologies: dto.preferredTechnologies ?? [] }));
      const pathRepo = manager.getRepository(LearningPath);
      const savedPaths = await pathRepo.save(generated.map((path) => pathRepo.create({ profileId, assessmentId: assessment.id, title: path.title, description: path.description, estimatedWeeks: path.estimatedWeeks, totalHours: path.totalHours, coursesOrder: path.courses, tips: path.tips })));
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
