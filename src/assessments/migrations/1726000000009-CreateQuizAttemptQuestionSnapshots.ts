import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateQuizAttemptQuestionSnapshots1726000000009 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "quiz_attempt_questions" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "attempt_id" uuid NOT NULL,
        "question_id" uuid NOT NULL,
        "question_text" text NOT NULL,
        "type" character varying NOT NULL,
        "difficulty" smallint NOT NULL,
        "options_snapshot" jsonb NOT NULL,
        "correct_option_id" uuid NOT NULL,
        CONSTRAINT "UQ_quiz_attempt_questions_attempt_question" UNIQUE ("attempt_id", "question_id"),
        CONSTRAINT "FK_quiz_attempt_questions_attempt" FOREIGN KEY ("attempt_id") REFERENCES "quiz_attempts"("id") ON DELETE CASCADE
      )
    `);

    // Preserve historical attempts that might exist before this migration.
    await queryRunner.query(`
      INSERT INTO "quiz_attempt_questions" (
        "attempt_id", "question_id", "question_text", "type", "difficulty", "options_snapshot", "correct_option_id"
      )
      SELECT
        attempt.id,
        question.id,
        question.text,
        question.type,
        question.difficulty,
        options.options_snapshot,
        correct_option.id
      FROM "quiz_attempts" attempt
      JOIN "questions" question ON question.id = ANY(attempt.question_ids)
      JOIN LATERAL (
        SELECT jsonb_agg(jsonb_build_object('id', option.id, 'text', option.text, 'position', option.position) ORDER BY option.position) AS options_snapshot
        FROM "question_options" option
        WHERE option.question_id = question.id
      ) options ON options.options_snapshot IS NOT NULL
      JOIN LATERAL (
        SELECT option.id
        FROM "question_options" option
        WHERE option.question_id = question.id AND option.is_correct = true
        ORDER BY option.position
        LIMIT 1
      ) correct_option ON true
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "quiz_attempt_questions"');
  }
}
