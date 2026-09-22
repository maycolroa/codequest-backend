import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Course } from './entities/course.entity';
import { CourseFiltersDto } from './dto/course-filters.dto';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

export type CourseCatalogSummary = Pick<
  Course,
  'id' | 'title' | 'description' | 'category' | 'level' | 'durationHours' | 'tags'
>;

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private readonly coursesRepository: Repository<Course>,
  ) {}

  create(createCourseDto: CreateCourseDto): Promise<Course> {
    const course = this.coursesRepository.create(createCourseDto);
    return this.coursesRepository.save(course);
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
}