import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';

import { QuestionType } from '../enums/question-type.enum';
import { CreateQuestionOptionDto } from './create-assessment.dto';

export class UpdateAssessmentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  text?: string;

  @ApiPropertyOptional({ enum: QuestionType })
  @IsOptional()
  @IsEnum(QuestionType)
  type?: QuestionType;

  @ApiPropertyOptional({ minimum: 1, maximum: 3 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3)
  difficulty?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  /** Reemplaza todas las opciones. No está permitido si la pregunta ya fue respondida. */
  @ApiPropertyOptional({ type: [CreateQuestionOptionDto] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionOptionDto)
  options?: CreateQuestionOptionDto[];
}
