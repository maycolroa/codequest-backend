import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import { Course } from './course.entity';

@Entity('course_lessons')
@Unique('UQ_course_lessons_course_position', ['courseId', 'position'])
export class CourseLesson {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'course_id', type: 'uuid' })
  courseId: string;

  @ManyToOne(() => Course, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @Column()
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'video_url', type: 'varchar', nullable: true })
  videoUrl: string | null;

  @Column({ type: 'integer' })
  position: number;

  @Column({ name: 'is_preview', default: false })
  isPreview: boolean;

  @Column({ name: 'duration_hours', type: 'numeric', precision: 4, scale: 2, default: 0.5 })
  durationHours: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
