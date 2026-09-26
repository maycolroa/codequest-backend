import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';

import { QuestionType } from '../enums/question-type.enum';
import { QuizAttempt } from './quiz-attempt.entity';

export interface AttemptQuestionOptionSnapshot {
  id: string;
  text: string;
  position: number;
}

/** Immutable copy of a question as it was presented to the user. */
@Entity('quiz_attempt_questions')
@Unique('UQ_quiz_attempt_questions_attempt_question', ['attemptId', 'questionId'])
export class QuizAttemptQuestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'attempt_id', type: 'uuid' })
  attemptId: string;

  @ManyToOne(() => QuizAttempt, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'attempt_id' })
  attempt: QuizAttempt;

  /** Original ID for auditing; no FK so the historical snapshot survives deletion. */
  @Column({ name: 'question_id', type: 'uuid' })
  questionId: string;

  @Column({ name: 'question_text', type: 'text' })
  questionText: string;

  @Column({ type: 'varchar' })
  type: QuestionType;

  @Column({ type: 'smallint' })
  difficulty: number;

  @Column({ name: 'options_snapshot', type: 'jsonb' })
  optionsSnapshot: AttemptQuestionOptionSnapshot[];

  /** Server-side only; never expose this when returning a questionnaire. */
  @Column({ name: 'correct_option_id', type: 'uuid' })
  correctOptionId: string;
}
