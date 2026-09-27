import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const databaseUrl = new URL(configService.getOrThrow<string>('DATABASE_URL'))
  // pg v8 interpreta sslmode=require como verify-full; el proveedor usa un certificado autofirmado.
  databaseUrl.searchParams.delete('sslmode')

  return {
  type: 'postgres',
  url: databaseUrl.toString(),
  autoLoadEntities: true,
  migrations: [
    __dirname + '/../migrations/*{.ts,.js}',
    __dirname + '/../../courses/migrations/*{.ts,.js}',
    __dirname + '/../../assessments/migrations/*{.ts,.js}',
    __dirname + '/../../learning-paths/migrations/*{.ts,.js}',
  ],
  synchronize: false,
  ssl: { rejectUnauthorized: false },
  }
}
