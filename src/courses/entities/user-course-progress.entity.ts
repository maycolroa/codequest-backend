import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import { Profile } from '../../auth/entities/profile.entity';
import { CourseProgressStatus } from '../enums/course-progress-status.enum';
import { CourseCategory } from '../enums/course-category.enum';
import { Course } from './course.entity';

@Entity('user_course_progress')
@Unique('UQ_user_course_progress_profile_course', ['profileId', 'courseId'])
@Check('CHK_user_course_progress_percent', '"progress_percent" BETWEEN 0 AND 100')
export class UserCourseProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'profile_id', type: 'uuid' })
  profileId: string;

  @ManyToOne(() => Profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'profile_id' })
  profile: Profile;

  @Column({ name: 'course_id', type: 'uuid' })
  courseId: string;

  @ManyToOne(() => Course, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @Column({ name: 'course_category', type: 'varchar' })
  courseCategory: CourseCategory;

  @Column({
    type: 'varchar',
    default: CourseProgressStatus.NOT_STARTED,
  })
  status: CourseProgressStatus;

  @Column({ name: 'progress_percent', type: 'integer', default: 0 })
  progressPercent: number;

  @Column({ name: 'started_at', type: 'timestamp', nullable: true })
  startedAt: Date | null;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
