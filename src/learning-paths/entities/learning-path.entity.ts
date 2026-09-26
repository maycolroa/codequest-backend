import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Profile } from '../../auth/entities/profile.entity';
import { UserAssessment } from './user-assessment.entity';

export interface LearningPathCourse { courseId: string; order: number; reason: string; }

@Entity('learning_paths')
export class LearningPath {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'profile_id', type: 'uuid' }) profileId: string;
  @ManyToOne(() => Profile, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'profile_id' }) profile: Profile;
  @Column({ name: 'assessment_id', type: 'uuid' }) assessmentId: string;
  @ManyToOne(() => UserAssessment, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'assessment_id' }) assessment: UserAssessment;
  @Column() title: string;
  @Column({ type: 'text' }) description: string;
  @Column({ name: 'estimated_weeks', type: 'integer' }) estimatedWeeks: number;
  @Column({ name: 'total_hours', type: 'integer' }) totalHours: number;
  @Column({ name: 'courses_order', type: 'jsonb' }) coursesOrder: LearningPathCourse[];
  @Column('text', { array: true, default: () => "'{}'" }) tips: string[];
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
}
