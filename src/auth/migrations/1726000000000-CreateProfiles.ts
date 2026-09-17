import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProfiles1726000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await queryRunner.query(`
      CREATE TABLE "profiles" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "discord_id" character varying NOT NULL UNIQUE,
        "username" character varying NOT NULL,
        "email" character varying,
        "avatar_url" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "profiles"');
  }
}
