import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  Min,
} from 'class-validator';

import { COURSE_GALAXIES } from '../constants/course-galaxies.constant';
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

  @ApiPropertyOptional({
    enum: COURSE_GALAXIES.map(({ key }) => key),
    isArray: true,
    example: ['backend', 'fundamentals'],
    description: 'La primera es la galaxia principal',
  })
  @IsOptional()
  @IsArray()
  @IsIn(COURSE_GALAXIES.map(({ key }) => key), { each: true })
  galaxies?: string[];

  @ApiPropertyOptional({ example: '#10B981' })
  @IsOptional()
  @Matches(/^#[0-9A-F]{6}$/i)
  galaxyColor?: string;

  @ApiPropertyOptional({ example: 12.5 })
  @IsOptional()
  @IsNumber()
  positionX?: number;

  @ApiPropertyOptional({ example: -3 })
  @IsOptional()
  @IsNumber()
  positionY?: number;

  @ApiPropertyOptional({ example: 40.25 })
  @IsOptional()
  @IsNumber()
  positionZ?: number;

  @ApiPropertyOptional({
    example: ['nodejs-de-cero-a-experto'],
    description: 'Slugs de cursos prerequisito',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  prerequisites?: string[];

  @ApiPropertyOptional({
    example: ['nest-graphql'],
    description: 'Slugs de cursos relacionados',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  related?: string[];
}
