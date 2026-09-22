import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCourseLessonsAndAutomaticProgress1726000000007
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "course_lessons" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "course_id" uuid NOT NULL,
        "title" character varying NOT NULL,
        "content" text NOT NULL,
        "video_url" character varying,
        "position" integer NOT NULL,
        "is_preview" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_course_lessons_course_position" UNIQUE ("course_id", "position"),
        CONSTRAINT "CHK_course_lessons_position" CHECK ("position" > 0),
        CONSTRAINT "FK_course_lessons_course" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "IDX_course_lessons_course_position" ON "course_lessons" ("course_id", "position")',
    );
    await queryRunner.query(`
      CREATE TABLE "user_lesson_progress" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "profile_id" uuid NOT NULL,
        "lesson_id" uuid NOT NULL,
        "completed_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_user_lesson_progress_profile_lesson" UNIQUE ("profile_id", "lesson_id"),
        CONSTRAINT "FK_user_lesson_progress_profile" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_user_lesson_progress_lesson" FOREIGN KEY ("lesson_id") REFERENCES "course_lessons"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "user_lesson_progress"');
    await queryRunner.query('DROP INDEX "IDX_course_lessons_course_position"');
    await queryRunner.query('DROP TABLE "course_lessons"');
  }
}
