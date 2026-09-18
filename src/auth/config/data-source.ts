import 'dotenv/config';
import { DataSource } from 'typeorm';

import { Profile } from '../entities/profile.entity';
import { CreateProfiles1726000000000 } from '../migrations/1726000000000-CreateProfiles';
import { AddLocalAuthentication1726000000001 } from '../migrations/1726000000001-AddLocalAuthentication';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL no está definida');
}

const authDataSource = new DataSource({
  type: 'postgres',
  url: databaseUrl,
  entities: [Profile],
  migrations: [CreateProfiles1726000000000, AddLocalAuthentication1726000000001],
  synchronize: false,
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
});

export default authDataSource;
