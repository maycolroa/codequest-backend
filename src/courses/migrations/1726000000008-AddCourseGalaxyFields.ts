import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCourseGalaxyFields1726000000008 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "courses" ADD COLUMN "galaxies" text[] NOT NULL DEFAULT \'{}\'',
    );
    await queryRunner.query(
      'ALTER TABLE "courses" ADD COLUMN "galaxy_color" character varying',
    );
    await queryRunner.query(
      'ALTER TABLE "courses" ADD COLUMN "position_x" double precision NOT NULL DEFAULT 0',
    );
    await queryRunner.query(
      'ALTER TABLE "courses" ADD COLUMN "position_y" double precision NOT NULL DEFAULT 0',
    );
    await queryRunner.query(
      'ALTER TABLE "courses" ADD COLUMN "position_z" double precision NOT NULL DEFAULT 0',
    );
    await queryRunner.query(
      'ALTER TABLE "courses" ADD COLUMN "prerequisites" text[] NOT NULL DEFAULT \'{}\'',
    );
    await queryRunner.query(
      'ALTER TABLE "courses" ADD COLUMN "related" text[] NOT NULL DEFAULT \'{}\'',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "courses" DROP COLUMN "related"');
    await queryRunner.query(
      'ALTER TABLE "courses" DROP COLUMN "prerequisites"',
    );
    await queryRunner.query('ALTER TABLE "courses" DROP COLUMN "position_z"');
    await queryRunner.query('ALTER TABLE "courses" DROP COLUMN "position_y"');
    await queryRunner.query('ALTER TABLE "courses" DROP COLUMN "position_x"');
    await queryRunner.query('ALTER TABLE "courses" DROP COLUMN "galaxy_color"');
    await queryRunner.query('ALTER TABLE "courses" DROP COLUMN "galaxies"');
  }
}
