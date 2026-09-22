import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { CourseCategory } from '../enums/course-category.enum';
import { CourseLevel } from '../enums/course-level.enum';

@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar' })
  category: CourseCategory;

  @Column({ type: 'varchar' })
  level: CourseLevel;

  @Column({ type: 'varchar', nullable: true })
  url: string | null;

  @Column({ name: 'duration_hours', type: 'integer', nullable: true })
  durationHours: number | null;

  @Column('text', { array: true, default: () => "'{}'" })
  tags: string[];

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
