import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

import { Profile } from '../../auth/entities/profile.entity';
import { CourseLesson } from './course-lesson.entity';

@Entity('user_lesson_progress')
@Unique('UQ_user_lesson_progress_profile_lesson', ['profileId', 'lessonId'])
export class UserLessonProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'profile_id', type: 'uuid' })
  profileId: string;

  @JoinColumn({ name: 'profile_id' })
  @ManyToOne(() => Profile, { onDelete: 'CASCADE' })
  profile: Profile;

  @Column({ name: 'lesson_id', type: 'uuid' })
  lessonId: string;

  @JoinColumn({ name: 'lesson_id' })
  @ManyToOne(() => CourseLesson, { onDelete: 'CASCADE' })
  lesson: CourseLesson;

  @CreateDateColumn({ name: 'completed_at' })
  completedAt: Date;
}
