import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCourses1726000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "courses" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "title" character varying NOT NULL,
        "description" text NOT NULL,
        "category" character varying NOT NULL,
        "level" character varying NOT NULL,
        "url" character varying NOT NULL,
        "duration_hours" integer NOT NULL,
        "tags" text[] NOT NULL DEFAULT '{}',
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "IDX_courses_category_level" ON "courses" ("category", "level")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "IDX_courses_category_level"');
    await queryRunner.query('DROP TABLE "courses"');
  }
}