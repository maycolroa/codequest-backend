import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsBoolean, IsEnum, IsInt, IsString, IsUUID, Max, Min, ValidateNested } from 'class-validator';

import { QuestionType } from '../enums/question-type.enum';

export class CreateQuestionOptionDto {
  @ApiProperty({ example: 'Una función que devuelve una promesa.' })
  @IsString()
  text: string;

  @ApiProperty({ example: false })
  @IsBoolean()
  isCorrect: boolean;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  position: number;
}

/** Payload administrativo para cargar preguntas de una skill. */
export class CreateAssessmentDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  skillId: string;

  @ApiProperty({ example: '¿Qué devuelve Promise.all cuando una promesa falla?' })
  @IsString()
  text: string;

  @ApiProperty({ enum: QuestionType, default: QuestionType.SINGLE_CHOICE })
  @IsEnum(QuestionType)
  type: QuestionType;

  @ApiProperty({ minimum: 1, maximum: 3, example: 2 })
  @IsInt()
  @Min(1)
  @Max(3)
  difficulty: number;

  @ApiProperty({ type: [CreateQuestionOptionDto] })
  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionOptionDto)
  options: CreateQuestionOptionDto[];
}
