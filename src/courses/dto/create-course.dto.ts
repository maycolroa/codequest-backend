import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
} from 'class-validator';

import { CourseCategory } from '../enums/course-category.enum';
import { CourseLevel } from '../enums/course-level.enum';

export class CreateCourseDto {
  @ApiProperty({ example: 'NestJS desde cero' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Aprende a construir APIs robustas con NestJS.' })
  @IsString()
  description: string;

  @ApiProperty({ enum: CourseCategory })
  @IsEnum(CourseCategory)
  category: CourseCategory;

  @ApiProperty({ enum: CourseLevel })
  @IsEnum(CourseLevel)
  level: CourseLevel;

  @ApiPropertyOptional({ example: 'https://cursos.devtalles.com/courses/nest' })
  @IsOptional()
  @IsUrl()
  url?: string;

  @ApiPropertyOptional({ example: 40, minimum: 1, maximum: 1000 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  durationHours?: number;

  @ApiProperty({ example: ['nestjs', 'typescript', 'backend'] })
  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
