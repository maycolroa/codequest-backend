import { MigrationInterface, QueryRunner } from 'typeorm';

export class UseLessonProgress1726000000012 implements MigrationInterface {
  name = 'UseLessonProgress1726000000012';
  async up(queryRunner: QueryRunner): Promise<void> {
    const columns = await queryRunner.query(
      `SELECT 1 FROM information_schema.columns
       WHERE table_schema = current_schema() AND table_name = 'learning_paths'
       AND column_name = 'completed_course_ids'`,
    ) as unknown[];
    if (columns.length > 0) {
      await queryRunner.query('ALTER TABLE "learning_paths" DROP COLUMN "completed_course_ids"');
    }
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    const columns = await queryRunner.query(
      `SELECT 1 FROM information_schema.columns
       WHERE table_schema = current_schema() AND table_name = 'learning_paths'
       AND column_name = 'completed_course_ids'`,
    ) as unknown[];
    if (columns.length === 0) {
      await queryRunner.query(`ALTER TABLE "learning_paths" ADD COLUMN "completed_course_ids" text array NOT NULL DEFAULT '{}'`);
    }
  }
}
