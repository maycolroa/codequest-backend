import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module';
import { AssessmentsController } from './assessments.controller';
import { AssessmentsService } from './assessments.service';
import { QuestionOption } from './entities/question-option.entity';
import { Question } from './entities/question.entity';
import { QuizAnswer } from './entities/quiz-answer.entity';
import { QuizAttempt } from './entities/quiz-attempt.entity';
import { QuizAttemptQuestion } from './entities/quiz-attempt-question.entity';
import { Skill } from './entities/skill.entity';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Skill, Question, QuestionOption, QuizAttempt, QuizAttemptQuestion, QuizAnswer])],
  controllers: [AssessmentsController],
  providers: [AssessmentsService],
  exports: [AssessmentsService],
})
export class AssessmentsModule {}
