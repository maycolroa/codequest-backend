import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLearningPaths1726000000011 implements MigrationInterface {
  name = 'CreateLearningPaths1726000000011';
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "user_assessments" (
      "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "profile_id" uuid NOT NULL,
      "interests" text array NOT NULL, "goals" text NOT NULL, "current_level" character varying NOT NULL,
      "available_hours_per_week" integer NOT NULL, "preferred_technologies" text array NOT NULL DEFAULT '{}',
      "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_user_assessments" PRIMARY KEY ("id"),
      CONSTRAINT "FK_user_assessments_profile" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE)`);
    await queryRunner.query(`CREATE INDEX "IDX_user_assessments_profile_created" ON "user_assessments" ("profile_id", "created_at")`);
    await queryRunner.query(`CREATE TABLE "learning_paths" (
      "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "profile_id" uuid NOT NULL, "assessment_id" uuid NOT NULL,
      "title" character varying NOT NULL, "description" text NOT NULL, "estimated_weeks" integer NOT NULL,
      "total_hours" integer NOT NULL, "courses_order" jsonb NOT NULL, "completed_course_ids" text array NOT NULL DEFAULT '{}', "tips" text array NOT NULL DEFAULT '{}',
      "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_learning_paths" PRIMARY KEY ("id"),
      CONSTRAINT "FK_learning_paths_profile" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE,
      CONSTRAINT "FK_learning_paths_assessment" FOREIGN KEY ("assessment_id") REFERENCES "user_assessments"("id") ON DELETE CASCADE)`);
    await queryRunner.query(`CREATE INDEX "IDX_learning_paths_profile_created" ON "learning_paths" ("profile_id", "created_at")`);
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "learning_paths"');
    await queryRunner.query('DROP INDEX "IDX_user_assessments_profile_created"');
    await queryRunner.query('DROP TABLE "user_assessments"');
  }
}
