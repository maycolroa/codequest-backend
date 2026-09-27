import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from './auth/auth.module';
import { getDatabaseConfig } from './auth/config/database.config';
import { CoursesModule } from './courses/courses.module';
import { AssessmentsModule } from './assessments/assessments.module';
import { LearningPathsModule } from './learning-paths/learning-paths.module';
import { DeviModule } from './devi/devi.module';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: getDatabaseConfig,
    }),
    AuthModule,
    CoursesModule,
    AssessmentsModule,
    LearningPathsModule,
    DeviModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
