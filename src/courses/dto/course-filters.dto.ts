import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

import { CourseCategory } from '../enums/course-category.enum';
import { CourseLevel } from '../enums/course-level.enum';

export class CourseFiltersDto {
  @ApiPropertyOptional({ example: 'backend' })
  @IsOptional()
  @IsEnum(CourseCategory)
  category?: CourseCategory;

  @ApiPropertyOptional({ enum: CourseLevel })
  @IsOptional()
  @IsEnum(CourseLevel)
  level?: CourseLevel;
}
