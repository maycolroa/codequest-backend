import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAssessments1726000000008 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "skills" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL UNIQUE,
        "slug" character varying NOT NULL UNIQUE,
        "description" text,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "questions" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "skill_id" uuid NOT NULL,
        "text" text NOT NULL,
        "type" character varying NOT NULL DEFAULT 'single_choice',
        "difficulty" smallint NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "CHK_questions_difficulty" CHECK ("difficulty" BETWEEN 1 AND 3),
        CONSTRAINT "FK_questions_skill" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE
      )
    `);
    // Las skills iniciales se derivan de los tags del catálogo ya cargado.
    // Al crear un curso nuevo, el administrador puede reutilizar o crear su skill
    // correspondiente antes de cargar sus preguntas.
    await queryRunner.query(`
      INSERT INTO "skills" ("name", "slug")
      SELECT DISTINCT tag, tag
      FROM "courses"
      CROSS JOIN LATERAL unnest("courses"."tags") AS tag
      WHERE "courses"."is_active" = true
      ON CONFLICT ("slug") DO NOTHING
    `);
    await queryRunner.query('CREATE INDEX "IDX_questions_skill_active" ON "questions" ("skill_id", "is_active")');
    await queryRunner.query(`
      CREATE TABLE "question_options" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "question_id" uuid NOT NULL,
        "text" text NOT NULL,
        "is_correct" boolean NOT NULL DEFAULT false,
        "position" smallint NOT NULL,
        CONSTRAINT "UQ_question_options_question_position" UNIQUE ("question_id", "position"),
        CONSTRAINT "FK_question_options_question" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "quiz_attempts" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "profile_id" uuid NOT NULL,
        "skill_id" uuid NOT NULL,
        "status" character varying NOT NULL DEFAULT 'in_progress',
        "question_ids" uuid[] NOT NULL,
        "score" integer,
        "level" character varying,
        "completed_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "CHK_quiz_attempts_score" CHECK ("score" IS NULL OR "score" BETWEEN 0 AND 100),
        CONSTRAINT "CHK_quiz_attempts_status" CHECK ("status" IN ('in_progress', 'completed')),
        CONSTRAINT "CHK_quiz_attempts_level" CHECK ("level" IS NULL OR "level" IN ('beginner', 'intermediate', 'advanced')),
        CONSTRAINT "FK_quiz_attempts_profile" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_quiz_attempts_skill" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query('CREATE INDEX "IDX_quiz_attempts_profile_skill_completed" ON "quiz_attempts" ("profile_id", "skill_id", "completed_at" DESC)');
    await queryRunner.query('CREATE UNIQUE INDEX "UQ_quiz_attempts_profile_skill_in_progress" ON "quiz_attempts" ("profile_id", "skill_id") WHERE "status" = \'in_progress\'');
    await queryRunner.query(`
      CREATE TABLE "quiz_answers" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "attempt_id" uuid NOT NULL,
        "question_id" uuid NOT NULL,
        "selected_option_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_quiz_answers_attempt_question" UNIQUE ("attempt_id", "question_id"),
        CONSTRAINT "FK_quiz_answers_attempt" FOREIGN KEY ("attempt_id") REFERENCES "quiz_attempts"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_quiz_answers_question" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_quiz_answers_selected_option" FOREIGN KEY ("selected_option_id") REFERENCES "question_options"("id") ON DELETE RESTRICT
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "quiz_answers"');
    await queryRunner.query('DROP INDEX "UQ_quiz_attempts_profile_skill_in_progress"');
    await queryRunner.query('DROP INDEX "IDX_quiz_attempts_profile_skill_completed"');
    await queryRunner.query('DROP TABLE "quiz_attempts"');
    await queryRunner.query('DROP TABLE "question_options"');
    await queryRunner.query('DROP INDEX "IDX_questions_skill_active"');
    await queryRunner.query('DROP TABLE "questions"');
    await queryRunner.query('DROP TABLE "skills"');
  }
}
