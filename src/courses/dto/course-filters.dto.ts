import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class CourseFiltersDto {
  @ApiPropertyOptional({ example: 'backend' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ enum: ['beginner', 'intermediate', 'advanced'] })
  @IsOptional()
  @IsIn(['beginner', 'intermediate', 'advanced'])
  level?: string;
}