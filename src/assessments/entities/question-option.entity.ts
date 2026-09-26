import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';

import { Question } from './question.entity';

@Entity('question_options')
@Unique('UQ_question_options_question_position', ['questionId', 'position'])
export class QuestionOption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'question_id', type: 'uuid' })
  questionId: string;

  @ManyToOne(() => Question, (question) => question.options, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'question_id' })
  question: Question;

  @Column({ type: 'text' })
  text: string;

  @Column({ name: 'is_correct', default: false })
  isCorrect: boolean;

  @Column({ type: 'smallint' })
  position: number;
}
