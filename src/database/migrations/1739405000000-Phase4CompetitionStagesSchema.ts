import { MigrationInterface, QueryRunner } from 'typeorm';

export class Phase4CompetitionStagesSchema1739405000000 implements MigrationInterface {
  name = 'Phase4CompetitionStagesSchema1739405000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'standings_stage_enum') THEN
          CREATE TYPE "standings_stage_enum" AS ENUM ('league', 'group');
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'fixtures_stage_enum') THEN
          CREATE TYPE "fixtures_stage_enum" AS ENUM ('league', 'group', 'knockout');
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'fixtures_knockout_round_enum') THEN
          CREATE TYPE "fixtures_knockout_round_enum" AS ENUM ('round_of_16', 'quarterfinal', 'semifinal', 'final');
        END IF;
      END
      $$;
    `);

    await queryRunner.query(
      `ALTER TABLE "standings" ADD COLUMN IF NOT EXISTS "stage" "standings_stage_enum" NOT NULL DEFAULT 'league'`,
    );
    await queryRunner.query(
      `ALTER TABLE "standings" ADD COLUMN IF NOT EXISTS "group_name" character varying(20)`,
    );

    await queryRunner.query(
      `ALTER TABLE "fixtures" ADD COLUMN IF NOT EXISTS "stage" "fixtures_stage_enum" NOT NULL DEFAULT 'league'`,
    );
    await queryRunner.query(
      `ALTER TABLE "fixtures" ADD COLUMN IF NOT EXISTS "group_name" character varying(20)`,
    );
    await queryRunner.query(
      `ALTER TABLE "fixtures" ADD COLUMN IF NOT EXISTS "knockout_round" "fixtures_knockout_round_enum"`,
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_standings_season_stage_group" ON "standings" ("season_id", "stage", "group_name")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_fixtures_season_stage_round" ON "fixtures" ("season_id", "stage", "round")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_fixtures_season_stage_round"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_standings_season_stage_group"`);

    await queryRunner.query(`ALTER TABLE "fixtures" DROP COLUMN IF EXISTS "knockout_round"`);
    await queryRunner.query(`ALTER TABLE "fixtures" DROP COLUMN IF EXISTS "group_name"`);
    await queryRunner.query(`ALTER TABLE "fixtures" DROP COLUMN IF EXISTS "stage"`);

    await queryRunner.query(`ALTER TABLE "standings" DROP COLUMN IF EXISTS "group_name"`);
    await queryRunner.query(`ALTER TABLE "standings" DROP COLUMN IF EXISTS "stage"`);

    await queryRunner.query(`DROP TYPE IF EXISTS "fixtures_knockout_round_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "fixtures_stage_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "standings_stage_enum"`);
  }
}
