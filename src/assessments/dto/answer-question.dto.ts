import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AnswerQuestionDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  questionId: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  selectedOptionId: string;
}
