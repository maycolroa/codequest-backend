import { PartialType } from '@nestjs/swagger';

import { CreateCourseLessonDto } from './create-course-lesson.dto';

export class UpdateCourseLessonDto extends PartialType(CreateCourseLessonDto) {}
