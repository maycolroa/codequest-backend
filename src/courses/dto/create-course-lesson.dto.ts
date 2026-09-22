import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, IsUrl, Min } from 'class-validator';

export class CreateCourseLessonDto {
  @ApiProperty({ example: 'Introducción al curso' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Contenido de la lección en formato Markdown.' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ example: 'https://video.example.com/lesson-1' })
  @IsOptional()
  @IsUrl()
  videoUrl?: string;

  @ApiProperty({ example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  position: number;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  isPreview?: boolean;
}
