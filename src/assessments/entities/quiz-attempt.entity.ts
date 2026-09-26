import { Check, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

import { Profile } from '../../auth/entities/profile.entity';
import { SkillLevel } from '../enums/skill-level.enum';
import { QuizAttemptStatus } from '../enums/quiz-attempt-status.enum';
import { QuizAnswer } from './quiz-answer.entity';
import { Skill } from './skill.entity';

@Entity('quiz_attempts')
@Check('CHK_quiz_attempts_score', '"score" IS NULL OR "score" BETWEEN 0 AND 100')
export class QuizAttempt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'profile_id', type: 'uuid' })
  profileId: string;

  @ManyToOne(() => Profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'profile_id' })
  profile: Profile;

  @Column({ name: 'skill_id', type: 'uuid' })
  skillId: string;

  @ManyToOne(() => Skill, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'skill_id' })
  skill: Skill;

  @Column({ type: 'varchar', default: QuizAttemptStatus.IN_PROGRESS })
  status: QuizAttemptStatus;

  /** Snapshot of the questions served when the attempt began. */
  @Column({ name: 'question_ids', type: 'uuid', array: true })
  questionIds: string[];

  @Column({ type: 'integer', nullable: true })
  score: number | null;

  @Column({ type: 'varchar', nullable: true })
  level: SkillLevel | null;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @OneToMany(() => QuizAnswer, (answer) => answer.attempt)
  answers: QuizAnswer[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
