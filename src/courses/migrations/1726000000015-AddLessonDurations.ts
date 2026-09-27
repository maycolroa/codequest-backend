import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLessonDurations1726000000015 implements MigrationInterface {
  name = 'AddLessonDurations1726000000015';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "course_lessons" ADD COLUMN IF NOT EXISTS "duration_hours" numeric(4,2) NOT NULL DEFAULT 0.5',
    );
    await queryRunner.query(
      'UPDATE "course_lessons" SET "duration_hours" = 0.5 + (("position" - 1) % 4) * 0.25',
    );
    await queryRunner.query(
      'UPDATE "courses" c SET "duration_hours" = totals.hours FROM (SELECT "course_id", SUM("duration_hours") AS hours FROM "course_lessons" GROUP BY "course_id") totals WHERE c."id" = totals."course_id"',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "course_lessons" DROP COLUMN "duration_hours"');
  }
}
