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

  @Column('text', { array: true, default: () => "'{}'" })
  galaxies: string[];

  @Column({ name: 'galaxy_color', type: 'varchar', nullable: true })
  galaxyColor: string | null;

  @Column({ name: 'position_x', type: 'double precision', default: 0 })
  positionX: number;

  @Column({ name: 'position_y', type: 'double precision', default: 0 })
  positionY: number;

  @Column({ name: 'position_z', type: 'double precision', default: 0 })
  positionZ: number;

  @Column('text', { array: true, default: () => "'{}'" })
  prerequisites: string[];

  @Column('text', { array: true, default: () => "'{}'" })
  related: string[];

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
