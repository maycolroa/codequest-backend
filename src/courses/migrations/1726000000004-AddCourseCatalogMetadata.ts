import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCourseCatalogMetadata1726000000004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "courses" ALTER COLUMN "url" DROP NOT NULL');
    await queryRunner.query(
      'ALTER TABLE "courses" ALTER COLUMN "duration_hours" DROP NOT NULL',
    );
    await queryRunner.query('ALTER TABLE "courses" ADD COLUMN "slug" character varying');
    await queryRunner.query(
      'UPDATE "courses" SET "slug" = CONCAT(\'course-\', "id") WHERE "slug" IS NULL',
    );
    await queryRunner.query('ALTER TABLE "courses" ALTER COLUMN "slug" SET NOT NULL');
    await queryRunner.query(
      'ALTER TABLE "courses" ADD CONSTRAINT "UQ_courses_slug" UNIQUE ("slug")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_courses_catalog" ON "courses" ("category", "level", "is_active")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "IDX_courses_catalog"');
    await queryRunner.query('ALTER TABLE "courses" DROP CONSTRAINT "UQ_courses_slug"');
    await queryRunner.query('ALTER TABLE "courses" DROP COLUMN "slug"');
    await queryRunner.query(
      'ALTER TABLE "courses" ALTER COLUMN "duration_hours" SET NOT NULL',
    );
    await queryRunner.query('ALTER TABLE "courses" ALTER COLUMN "url" SET NOT NULL');
  }
}
