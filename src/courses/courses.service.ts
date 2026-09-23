import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { COURSE_GALAXIES } from './constants/course-galaxies.constant';
import { Course } from './entities/course.entity';
import { CourseFiltersDto } from './dto/course-filters.dto';
import { CreateCourseDto } from './dto/create-course.dto';
import { CreateCourseLessonDto } from './dto/create-course-lesson.dto';
import { GalaxyMapResponseDto } from './dto/galaxy-map-response.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { UpdateCourseLessonDto } from './dto/update-course-lesson.dto';
import { CourseProgressStatus } from './enums/course-progress-status.enum';
import { CourseLesson } from './entities/course-lesson.entity';
import { UserCourseProgress } from './entities/user-course-progress.entity';
import { UserLessonProgress } from './entities/user-lesson-progress.entity';

export type CourseCatalogSummary = Pick<
  Course,
  'id' | 'title' | 'description' | 'category' | 'level' | 'durationHours' | 'tags'
>;

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private readonly coursesRepository: Repository<Course>,
    @InjectRepository(UserCourseProgress)
    private readonly progressRepository: Repository<UserCourseProgress>,
    @InjectRepository(CourseLesson)
    private readonly lessonsRepository: Repository<CourseLesson>,
    private readonly dataSource: DataSource,
  ) {}

  async create(createCourseDto: CreateCourseDto): Promise<Course> {
    const course = this.coursesRepository.create({
      title: createCourseDto.title,
      description: createCourseDto.description,
      category: createCourseDto.category,
      level: createCourseDto.level,
      url: createCourseDto.url ?? null,
      durationHours: createCourseDto.durationHours ?? null,
      tags: createCourseDto.tags,
      isActive: createCourseDto.isActive ?? true,
      slug: this.createSlug(createCourseDto.title),
    });

    try {
      return await this.coursesRepository.save(course);
    } catch (error: unknown) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('Ya existe un curso con ese título');
      }

      throw error;
    }
  }

  findAll(filters: CourseFiltersDto): Promise<Course[]> {
    const query = this.coursesRepository
      .createQueryBuilder('course')
      .where('course.is_active = :isActive', { isActive: true });

    if (filters.category) {
      query.andWhere('course.category = :category', { category: filters.category });
    }

    if (filters.level) {
      query.andWhere('course.level = :level', { level: filters.level });
    }

    return query.orderBy('course.title', 'ASC').getMany();
  }

  async findById(id: string): Promise<Course> {
    const course = await this.coursesRepository.findOne({
      where: { id, isActive: true },
    });

    if (!course) {
      throw new NotFoundException(`Curso ${id} no encontrado`);
    }

    return course;
  }

  async update(id: string, updateCourseDto: UpdateCourseDto): Promise<Course> {
    const course = await this.findById(id);
    Object.assign(course, updateCourseDto);
    return this.coursesRepository.save(course);
  }

  async remove(id: string): Promise<void> {
    const course = await this.findById(id);
    course.isActive = false;
    await this.coursesRepository.save(course);
  }

  async enroll(profileId: string, courseId: string): Promise<UserCourseProgress> {
    await this.findById(courseId);

    const existingProgress = await this.progressRepository.findOne({
      where: { profileId, courseId },
    });

    if (existingProgress) {
      throw new ConflictException('Ya estás inscrito en este curso');
    }

    return this.progressRepository.save(
      this.progressRepository.create({ profileId, courseId }),
    );
  }

  findMyProgress(profileId: string): Promise<UserCourseProgress[]> {
    return this.progressRepository.find({
      where: { profileId },
      relations: { course: true },
      order: { updatedAt: 'DESC' },
    });
  }

  async createLesson(
    courseId: string,
    createCourseLessonDto: CreateCourseLessonDto,
  ): Promise<CourseLesson> {
    await this.findById(courseId);

    try {
      return await this.lessonsRepository.save(
        this.lessonsRepository.create({
          courseId,
          title: createCourseLessonDto.title,
          content: createCourseLessonDto.content,
          videoUrl: createCourseLessonDto.videoUrl ?? null,
          position: createCourseLessonDto.position,
          isPreview: createCourseLessonDto.isPreview ?? false,
        }),
      );
    } catch (error: unknown) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException(
          'Ya existe una lección en esa posición para el curso',
        );
      }

      throw error;
    }
  }

  async findLessons(courseId: string): Promise<CourseLesson[]> {
    await this.findById(courseId);
    return this.lessonsRepository.find({
      where: { courseId },
      order: { position: 'ASC' },
    });
  }

  async updateLesson(
    lessonId: string,
    updateCourseLessonDto: UpdateCourseLessonDto,
  ): Promise<CourseLesson> {
    const lesson = await this.lessonsRepository.findOne({
      where: { id: lessonId },
    });

    if (!lesson) {
      throw new NotFoundException('Lección no encontrada');
    }

    Object.assign(lesson, updateCourseLessonDto);

    try {
      return await this.lessonsRepository.save(lesson);
    } catch (error: unknown) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException(
          'Ya existe una lección en esa posición para el curso',
        );
      }

      throw error;
    }
  }

  removeLesson(lessonId: string): Promise<void> {
    return this.dataSource.transaction(async (manager) => {
      const lessonRepository = manager.getRepository(CourseLesson);
      const lesson = await lessonRepository.findOne({ where: { id: lessonId } });

      if (!lesson) {
        throw new NotFoundException('Lección no encontrada');
      }

      await lessonRepository.remove(lesson);
      await this.recalculateCourseProgress(manager, lesson.courseId);
    });
  }

  completeLesson(profileId: string, lessonId: string): Promise<UserCourseProgress> {
    return this.dataSource.transaction(async (manager) => {
      const lessonRepository = manager.getRepository(CourseLesson);
      const courseRepository = manager.getRepository(Course);
      const progressRepository = manager.getRepository(UserCourseProgress);
      const lessonProgressRepository = manager.getRepository(UserLessonProgress);

      const lesson = await lessonRepository.findOne({ where: { id: lessonId } });

      if (!lesson) {
        throw new NotFoundException('Lección no encontrada');
      }

      const course = await courseRepository.findOne({
        where: { id: lesson.courseId, isActive: true },
      });

      if (!course) {
        throw new NotFoundException('Curso no encontrado');
      }

      const courseProgress = await progressRepository.findOne({
        where: { profileId, courseId: lesson.courseId },
      });

      if (!courseProgress) {
        throw new ConflictException('Debes inscribirte al curso antes de avanzar');
      }

      const existingLessonProgress = await lessonProgressRepository.findOne({
        where: { profileId, lessonId },
      });

      if (!existingLessonProgress) {
        await lessonProgressRepository.save(
          lessonProgressRepository.create({ profileId, lessonId }),
        );
      }

      await this.recalculateCourseProgress(manager, lesson.courseId, profileId);
      return progressRepository.findOneOrFail({ where: { id: courseProgress.id } });
    });
  }

  getCategories(): Promise<string[]> {
    return this.coursesRepository
      .createQueryBuilder('course')
      .select('course.category', 'category')
      .where('course.is_active = :isActive', { isActive: true })
      .distinct(true)
      .orderBy('course.category', 'ASC')
      .getRawMany<{ category: string }>()
      .then((categories) => categories.map(({ category }) => category));
  }

  getCatalogSummary(): Promise<CourseCatalogSummary[]> {
    return this.coursesRepository.find({
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        level: true,
        durationHours: true,
        tags: true,
      },
      where: { isActive: true },
      order: { title: 'ASC' },
    });
  }

  async findGalaxy(): Promise<GalaxyMapResponseDto> {
    // A diferencia del resto de endpoints, incluye los cursos inactivos (legacy).
    const courses = await this.coursesRepository.find({
      select: {
        id: true,
        slug: true,
        title: true,
        category: true,
        level: true,
        tags: true,
        isActive: true,
        galaxies: true,
        galaxyColor: true,
        positionX: true,
        positionY: true,
        positionZ: true,
        prerequisites: true,
        related: true,
      },
      order: { title: 'ASC' },
    });

    return {
      galaxies: COURSE_GALAXIES.map((galaxy) => ({
        ...galaxy,
        center: { ...galaxy.center },
      })),
      courses,
    };
  }

  private createSlug(title: string): string {
    return title
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private isUniqueViolation(error: unknown): error is { code: string } {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === '23505';
  }

  private async recalculateCourseProgress(
    manager: import('typeorm').EntityManager,
    courseId: string,
    profileId?: string,
  ): Promise<void> {
    const lessonRepository = manager.getRepository(CourseLesson);
    const progressRepository = manager.getRepository(UserCourseProgress);
    const lessonProgressRepository = manager.getRepository(UserLessonProgress);
    const totalLessons = await lessonRepository.count({ where: { courseId } });
    const progressEntries = await progressRepository.find({
      where: profileId ? { profileId, courseId } : { courseId },
    });

    for (const progressEntry of progressEntries) {
      const completedLessons = await lessonProgressRepository
        .createQueryBuilder('lessonProgress')
        .innerJoin('lessonProgress.lesson', 'lesson')
        .where('lessonProgress.profile_id = :profileId', {
          profileId: progressEntry.profileId,
        })
        .andWhere('lesson.course_id = :courseId', { courseId })
        .getCount();

      const progressPercent =
        totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);
      progressEntry.progressPercent = progressPercent;
      progressEntry.status =
        progressPercent === 100 && totalLessons > 0
          ? CourseProgressStatus.COMPLETED
          : progressPercent > 0
            ? CourseProgressStatus.IN_PROGRESS
            : CourseProgressStatus.NOT_STARTED;
      progressEntry.startedAt = progressPercent > 0 ? progressEntry.startedAt ?? new Date() : null;
      progressEntry.completedAt =
        progressEntry.status === CourseProgressStatus.COMPLETED
          ? new Date()
          : null;
    }

    await progressRepository.save(progressEntries);
  }
}
