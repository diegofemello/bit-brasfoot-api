import { MigrationInterface, QueryRunner } from 'typeorm';

export class Phase4CompetitionsSchema1739400000000 implements MigrationInterface {
  name = 'Phase4CompetitionsSchema1739400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'competitions_type_enum') THEN
          CREATE TYPE "competitions_type_enum" AS ENUM ('league', 'cup', 'continental');
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'competition_seasons_status_enum') THEN
          CREATE TYPE "competition_seasons_status_enum" AS ENUM ('ongoing', 'finished');
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'fixtures_status_enum') THEN
          CREATE TYPE "fixtures_status_enum" AS ENUM ('scheduled', 'played');
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "competitions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(120) NOT NULL,
        "type" "competitions_type_enum" NOT NULL DEFAULT 'league',
        "league_id" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_competitions_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_competitions_league" FOREIGN KEY ("league_id") REFERENCES "leagues"("id") ON DELETE SET NULL ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "competition_seasons" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "competition_id" uuid NOT NULL,
        "save_game_id" uuid NOT NULL,
        "season_year" integer NOT NULL,
        "current_round" integer NOT NULL DEFAULT 1,
        "status" "competition_seasons_status_enum" NOT NULL DEFAULT 'ongoing',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_competition_seasons_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_competition_seasons_competition" FOREIGN KEY ("competition_id") REFERENCES "competitions"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_competition_seasons_save" FOREIGN KEY ("save_game_id") REFERENCES "save_games"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "UQ_competition_seasons_save_competition_year" UNIQUE ("competition_id", "save_game_id", "season_year")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "standings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "season_id" uuid NOT NULL,
        "club_id" uuid NOT NULL,
        "position" integer NOT NULL DEFAULT 0,
        "played" integer NOT NULL DEFAULT 0,
        "wins" integer NOT NULL DEFAULT 0,
        "draws" integer NOT NULL DEFAULT 0,
        "losses" integer NOT NULL DEFAULT 0,
        "goals_for" integer NOT NULL DEFAULT 0,
        "goals_against" integer NOT NULL DEFAULT 0,
        "goal_difference" integer NOT NULL DEFAULT 0,
        "points" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_standings_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_standings_season" FOREIGN KEY ("season_id") REFERENCES "competition_seasons"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_standings_club" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "UQ_standings_season_club" UNIQUE ("season_id", "club_id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "fixtures" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "season_id" uuid NOT NULL,
        "round" integer NOT NULL,
        "home_club_id" uuid NOT NULL,
        "away_club_id" uuid NOT NULL,
        "match_date" date NOT NULL,
        "status" "fixtures_status_enum" NOT NULL DEFAULT 'scheduled',
        "home_score" integer,
        "away_score" integer,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_fixtures_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_fixtures_season" FOREIGN KEY ("season_id") REFERENCES "competition_seasons"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_fixtures_home_club" FOREIGN KEY ("home_club_id") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_fixtures_away_club" FOREIGN KEY ("away_club_id") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_competition_seasons_save" ON "competition_seasons" ("save_game_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_standings_season" ON "standings" ("season_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_fixtures_season_round" ON "fixtures" ("season_id", "round")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_fixtures_season_round"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_standings_season"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_competition_seasons_save"`);

    await queryRunner.query(`DROP TABLE IF EXISTS "fixtures"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "standings"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "competition_seasons"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "competitions"`);

    await queryRunner.query(`DROP TYPE IF EXISTS "fixtures_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "competition_seasons_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "competitions_type_enum"`);
  }
}
