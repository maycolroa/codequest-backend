import { Check, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

import { Skill } from './skill.entity';
import { QuestionOption } from './question-option.entity';
import { QuestionType } from '../enums/question-type.enum';

@Entity('questions')
@Check('CHK_questions_difficulty', '"difficulty" BETWEEN 1 AND 3')
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'skill_id', type: 'uuid' })
  skillId: string;

  @ManyToOne(() => Skill, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'skill_id' })
  skill: Skill;

  @Column({ type: 'text' })
  text: string;

  @Column({ type: 'varchar', default: QuestionType.SINGLE_CHOICE })
  type: QuestionType;

  /** 1 = básica, 2 = intermedia, 3 = avanzada. También es su peso. */
  @Column({ type: 'smallint' })
  difficulty: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => QuestionOption, (option) => option.question)
  options: QuestionOption[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
