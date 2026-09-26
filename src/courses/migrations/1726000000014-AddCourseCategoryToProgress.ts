import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCourseCategoryToProgress1726000000014 implements MigrationInterface {
  name = 'AddCourseCategoryToProgress1726000000014';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "user_course_progress" ADD COLUMN "course_category" character varying',
    );
    await queryRunner.query(
      `UPDATE "user_course_progress" progress
       SET "course_category" = course."category"
       FROM "courses" course
       WHERE course."id" = progress."course_id"`,
    );
    await queryRunner.query(
      'ALTER TABLE "user_course_progress" ALTER COLUMN "course_category" SET NOT NULL',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "user_course_progress" DROP COLUMN "course_category"',
    );
  }
}
