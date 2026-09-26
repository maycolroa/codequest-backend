import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  url: configService.getOrThrow<string>('DATABASE_URL'),
  autoLoadEntities: true,
  migrations: [
    __dirname + '/../migrations/*{.ts,.js}',
    __dirname + '/../../courses/migrations/*{.ts,.js}',
    __dirname + '/../../assessments/migrations/*{.ts,.js}',
  ],
  synchronize: false,
  ssl: { rejectUnauthorized: false },
});
