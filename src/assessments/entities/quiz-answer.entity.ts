import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';

import { Question } from './question.entity';
import { QuestionOption } from './question-option.entity';
import { QuizAttempt } from './quiz-attempt.entity';

@Entity('quiz_answers')
@Unique('UQ_quiz_answers_attempt_question', ['attemptId', 'questionId'])
export class QuizAnswer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'attempt_id', type: 'uuid' })
  attemptId: string;

  @ManyToOne(() => QuizAttempt, (attempt) => attempt.answers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'attempt_id' })
  attempt: QuizAttempt;

  @Column({ name: 'question_id', type: 'uuid' })
  questionId: string;

  @ManyToOne(() => Question, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'question_id' })
  question: Question;

  @Column({ name: 'selected_option_id', type: 'uuid' })
  selectedOptionId: string;

  @ManyToOne(() => QuestionOption, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'selected_option_id' })
  selectedOption: QuestionOption;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
