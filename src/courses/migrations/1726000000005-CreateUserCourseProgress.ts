import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserCourseProgress1726000000005 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "user_course_progress" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "profile_id" uuid NOT NULL,
        "course_id" uuid NOT NULL,
        "status" character varying NOT NULL DEFAULT 'not_started',
        "progress_percent" integer NOT NULL DEFAULT 0,
        "started_at" TIMESTAMP,
        "completed_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_user_course_progress_profile_course" UNIQUE ("profile_id", "course_id"),
        CONSTRAINT "CHK_user_course_progress_percent" CHECK ("progress_percent" BETWEEN 0 AND 100),
        CONSTRAINT "CHK_user_course_progress_status" CHECK ("status" IN ('not_started', 'in_progress', 'completed')),
        CONSTRAINT "CHK_user_course_progress_completion" CHECK ("completed_at" IS NULL OR "status" = 'completed'),
        CONSTRAINT "FK_user_course_progress_profile" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_user_course_progress_course" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "IDX_user_course_progress_profile_status" ON "user_course_progress" ("profile_id", "status")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "IDX_user_course_progress_profile_status"');
    await queryRunner.query('DROP TABLE "user_course_progress"');
  }
}
