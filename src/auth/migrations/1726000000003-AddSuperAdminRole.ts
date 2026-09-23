import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSuperAdminRole1726000000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "profiles" ADD COLUMN "is_super_admin" boolean NOT NULL DEFAULT false',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "profiles" DROP COLUMN "is_super_admin"',
    );
  }
}