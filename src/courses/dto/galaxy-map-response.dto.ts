import { ApiProperty } from '@nestjs/swagger';

import { COURSE_GALAXIES } from '../constants/course-galaxies.constant';
import type { CourseGalaxyKey } from '../constants/course-galaxies.constant';
import { GalaxyCourseDto } from './galaxy-course.dto';

export class GalaxyCenterDto {
  @ApiProperty()
  x: number;

  @ApiProperty()
  y: number;

  @ApiProperty()
  z: number;
}

export class GalaxyDto {
  @ApiProperty({ enum: COURSE_GALAXIES.map(({ key }) => key) })
  key: CourseGalaxyKey;

  @ApiProperty()
  name: string;

  @ApiProperty({ example: '#8B5CF6' })
  color: string;

  @ApiProperty({ type: GalaxyCenterDto })
  center: GalaxyCenterDto;
}

export class GalaxyMapResponseDto {
  @ApiProperty({ type: [GalaxyDto] })
  galaxies: GalaxyDto[];

  @ApiProperty({ type: [GalaxyCourseDto] })
  courses: GalaxyCourseDto[];
}
