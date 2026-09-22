import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { Course } from './entities/course.entity';
import { CourseLesson } from './entities/course-lesson.entity';
import { UserCourseProgress } from './entities/user-course-progress.entity';
import { UserLessonProgress } from './entities/user-lesson-progress.entity';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      Course,
      CourseLesson,
      UserCourseProgress,
      UserLessonProgress,
    ]),
  ],
  controllers: [CoursesController],
  providers: [CoursesService],
  exports: [CoursesService],
})
export class CoursesModule {}
