import { ApiProperty } from '@nestjs/swagger';

import { CourseCategory } from '../enums/course-category.enum';
import { CourseLevel } from '../enums/course-level.enum';

export class GalaxyCourseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ enum: CourseCategory })
  category: string;

  @ApiProperty({ enum: CourseLevel })
  level: string;

  @ApiProperty({ type: [String] })
  tags: string[];

  @ApiProperty({
    description:
      'Los cursos inactivos (legacy) también se devuelven; el front decide cómo pintarlos',
  })
  isActive: boolean;

  @ApiProperty({
    type: [String],
    description:
      'Claves de COURSE_GALAXIES; la primera es la galaxia principal',
    example: ['ai-ml', 'backend'],
  })
  galaxies: string[];

  @ApiProperty({ type: String, nullable: true, example: '#8B5CF6' })
  galaxyColor: string | null;

  @ApiProperty()
  positionX: number;

  @ApiProperty()
  positionY: number;

  @ApiProperty()
  positionZ: number;

  @ApiProperty({ type: [String], description: 'Slugs de cursos prerequisito' })
  prerequisites: string[];

  @ApiProperty({ type: [String], description: 'Slugs de cursos relacionados' })
  related: string[];
}
