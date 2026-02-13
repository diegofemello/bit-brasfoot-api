import { MigrationInterface, QueryRunner } from 'typeorm';

export class Phase6SeasonSummarySchema1739420000000 implements MigrationInterface {
  name = 'Phase6SeasonSummarySchema1739420000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "save_games" ADD COLUMN IF NOT EXISTS "last_season_summary" jsonb`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "save_games" DROP COLUMN IF EXISTS "last_season_summary"`,
    );
  }
}
