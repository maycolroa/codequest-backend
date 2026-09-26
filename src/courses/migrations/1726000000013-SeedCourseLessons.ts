import { MigrationInterface, QueryRunner } from 'typeorm';

import { COURSE_LESSON_SEEDS } from '../seeds/course-lessons.seed';

export class SeedCourseLessons1726000000013 implements MigrationInterface {
  name = 'SeedCourseLessons1726000000013';

  async up(queryRunner: QueryRunner): Promise<void> {
    for (const [slug, titles] of Object.entries(COURSE_LESSON_SEEDS)) {
      const [course] = await queryRunner.query(
        'SELECT "id" FROM "courses" WHERE "slug" = $1',
        [slug],
      ) as { id: string }[];
      if (!course || titles.length === 0) continue;

      const existing = await queryRunner.query(
        'SELECT 1 FROM "course_lessons" WHERE "course_id" = $1 LIMIT 1',
        [course.id],
      ) as unknown[];
      // Keep lessons that were already created by an administrator.
      if (existing.length > 0) continue;

      await queryRunner.query(
        `INSERT INTO "course_lessons" ("course_id", "title", "content", "position", "is_preview")
         SELECT $1, seed.title, '', seed.position::integer, false
         FROM unnest($2::text[]) WITH ORDINALITY AS seed(title, position)
         ON CONFLICT ("course_id", "position") DO NOTHING`,
        [course.id, titles],
      );
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    for (const [slug, titles] of Object.entries(COURSE_LESSON_SEEDS)) {
      const [course] = await queryRunner.query(
        'SELECT "id" FROM "courses" WHERE "slug" = $1',
        [slug],
      ) as { id: string }[];
      if (!course || titles.length === 0) continue;
      await queryRunner.query(
        `DELETE FROM "course_lessons"
         WHERE "course_id" = $1 AND "position" <= $2 AND "title" = ANY($3)`,
        [course.id, titles.length, titles],
      );
    }
  }
}
