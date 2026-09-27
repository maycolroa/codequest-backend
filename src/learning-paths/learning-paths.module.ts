import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { CoursesModule } from '../courses/courses.module';
import { LearningPath } from './entities/learning-path.entity';
import { UserAssessment } from './entities/user-assessment.entity';
import { LearningPathsController } from './learning-paths.controller';
import { LearningPathsService } from './learning-paths.service';

@Module({ imports: [AuthModule, CoursesModule, TypeOrmModule.forFeature([LearningPath, UserAssessment])], controllers: [LearningPathsController], providers: [LearningPathsService] })
export class LearningPathsModule {}
