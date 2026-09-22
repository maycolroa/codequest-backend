import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
} from 'class-validator';

export class CreateCourseDto {
  @ApiProperty({ example: 'NestJS desde cero' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Aprende a construir APIs robustas con NestJS.' })
  @IsString()
  description: string;

  @ApiProperty({ enum: ['frontend', 'backend', 'fullstack', 'devops', 'mobile', 'databases'] })
  @IsIn(['frontend', 'backend', 'fullstack', 'devops', 'mobile', 'databases'])
  category: string;

  @ApiProperty({ enum: ['beginner', 'intermediate', 'advanced'] })
  @IsIn(['beginner', 'intermediate', 'advanced'])
  level: string;

  @ApiProperty({ example: 'https://cursos.devtalles.com/courses/nest' })
  @IsUrl()
  url: string;

  @ApiProperty({ example: 40, minimum: 1, maximum: 1000 })
  @IsInt()
  @Min(1)
  @Max(1000)
  durationHours: number;

  @ApiProperty({ example: ['nestjs', 'typescript', 'backend'] })
  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}