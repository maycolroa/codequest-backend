import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLocalAuthentication1726000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "profiles" ALTER COLUMN "discord_id" DROP NOT NULL',
    );
    await queryRunner.query(
      'ALTER TABLE "profiles" ADD COLUMN "password_hash" character varying',
    );
    await queryRunner.query(
      'ALTER TABLE "profiles" ADD COLUMN "is_active" boolean NOT NULL DEFAULT true',
    );
    await queryRunner.query(
      'CREATE UNIQUE INDEX "IDX_profiles_email_unique" ON "profiles" ("email") WHERE "email" IS NOT NULL',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "IDX_profiles_email_unique"');
    await queryRunner.query('ALTER TABLE "profiles" DROP COLUMN "is_active"');
    await queryRunner.query('ALTER TABLE "profiles" DROP COLUMN "password_hash"');
    await queryRunner.query('ALTER TABLE "profiles" ALTER COLUMN "discord_id" SET NOT NULL');
  }
}
