import 'dotenv/config';
import { DataSource } from 'typeorm';

import { Profile } from '../entities/profile.entity';
import { CreateProfiles1726000000000 } from '../migrations/1726000000000-CreateProfiles';
import { AddLocalAuthentication1726000000001 } from '../migrations/1726000000001-AddLocalAuthentication';
import { AddSuperAdminRole1726000000003 } from '../migrations/1726000000003-AddSuperAdminRole';
import { CreateCourses1726000000002 } from '../../courses/migrations/1726000000002-CreateCourses';
import { Course } from '../../courses/entities/course.entity';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL no está definida');
}

const authDataSource = new DataSource({
  type: 'postgres',
  url: databaseUrl,
  entities: [Profile, Course],
  migrations: [
    CreateProfiles1726000000000,
    AddLocalAuthentication1726000000001,
    AddSuperAdminRole1726000000003,
    CreateCourses1726000000002,
  ],
  synchronize: false,
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
});

export default authDataSource;
