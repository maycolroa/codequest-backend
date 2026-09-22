import 'dotenv/config';
import { DataSource } from 'typeorm';

import { Profile } from '../entities/profile.entity';
import { CreateProfiles1726000000000 } from '../migrations/1726000000000-CreateProfiles';
import { AddLocalAuthentication1726000000001 } from '../migrations/1726000000001-AddLocalAuthentication';
import { AddSuperAdminRole1726000000003 } from '../migrations/1726000000003-AddSuperAdminRole';
import { CreateCourses1726000000002 } from '../../courses/migrations/1726000000002-CreateCourses';
import { Course } from '../../courses/entities/course.entity';
import { AddCourseCatalogMetadata1726000000004 } from '../../courses/migrations/1726000000004-AddCourseCatalogMetadata';
import { CreateUserCourseProgress1726000000005 } from '../../courses/migrations/1726000000005-CreateUserCourseProgress';
import { SeedDevTallesCourses1726000000006 } from '../../courses/migrations/1726000000006-SeedDevTallesCourses';
import { UserCourseProgress } from '../../courses/entities/user-course-progress.entity';
import { CourseLesson } from '../../courses/entities/course-lesson.entity';
import { UserLessonProgress } from '../../courses/entities/user-lesson-progress.entity';
import { CreateCourseLessonsAndAutomaticProgress1726000000007 } from '../../courses/migrations/1726000000007-CreateCourseLessonsAndAutomaticProgress';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL no está definida');
}

const authDataSource = new DataSource({
  type: 'postgres',
  url: databaseUrl,
  entities: [Profile, Course, CourseLesson, UserCourseProgress, UserLessonProgress],
  migrations: [
    CreateProfiles1726000000000,
    AddLocalAuthentication1726000000001,
    AddSuperAdminRole1726000000003,
    CreateCourses1726000000002,
    AddCourseCatalogMetadata1726000000004,
    CreateUserCourseProgress1726000000005,
    SeedDevTallesCourses1726000000006,
    CreateCourseLessonsAndAutomaticProgress1726000000007,
  ],
  synchronize: false,
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
});

export default authDataSource;
