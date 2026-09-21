import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Course } from './entities/course.entity';
import { CourseFiltersDto } from './dto/course-filters.dto';

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