import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { Course } from './entities/course.entity';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Course])],
  controllers: [CoursesController],
  providers: [CoursesService],
  exports: [CoursesService],
})
export class CoursesModule {}