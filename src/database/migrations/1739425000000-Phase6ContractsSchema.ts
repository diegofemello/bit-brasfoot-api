import { MigrationInterface, QueryRunner } from 'typeorm';

export class Phase6ContractsSchema1739425000000 implements MigrationInterface {
  name = 'Phase6ContractsSchema1739425000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "players" ADD COLUMN IF NOT EXISTS "contract_years_remaining" integer NOT NULL DEFAULT 2`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "players" DROP COLUMN IF EXISTS "contract_years_remaining"`,
    );
  }
}
