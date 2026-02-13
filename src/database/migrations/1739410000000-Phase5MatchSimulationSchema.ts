import { MigrationInterface, QueryRunner } from 'typeorm';

export class Phase5MatchSimulationSchema1739410000000 implements MigrationInterface {
  name = 'Phase5MatchSimulationSchema1739410000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'matches_status_enum') THEN
          CREATE TYPE "matches_status_enum" AS ENUM ('finished');
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "matches" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "fixture_id" uuid NOT NULL,
        "home_club_id" uuid NOT NULL,
        "away_club_id" uuid NOT NULL,
        "home_score" integer NOT NULL DEFAULT 0,
        "away_score" integer NOT NULL DEFAULT 0,
        "home_possession" integer NOT NULL DEFAULT 50,
        "away_possession" integer NOT NULL DEFAULT 50,
        "home_shots" integer NOT NULL DEFAULT 0,
        "away_shots" integer NOT NULL DEFAULT 0,
        "status" "matches_status_enum" NOT NULL DEFAULT 'finished',
        "simulated_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_matches_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_matches_fixture_id" UNIQUE ("fixture_id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "matches"
      ADD CONSTRAINT "FK_matches_fixture_id"
      FOREIGN KEY ("fixture_id") REFERENCES "fixtures"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "matches"
      ADD CONSTRAINT "FK_matches_home_club_id"
      FOREIGN KEY ("home_club_id") REFERENCES "clubs"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "matches"
      ADD CONSTRAINT "FK_matches_away_club_id"
      FOREIGN KEY ("away_club_id") REFERENCES "clubs"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'match_events_type_enum') THEN
          CREATE TYPE "match_events_type_enum" AS ENUM (
            'goal',
            'yellow_card',
            'red_card',
            'injury',
            'substitution',
            'tactic_change'
          );
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "match_events" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "match_id" uuid NOT NULL,
        "minute" integer NOT NULL,
        "type" "match_events_type_enum" NOT NULL,
        "club_id" uuid,
        "player_id" uuid,
        "description" character varying(255) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_match_events_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "match_events"
      ADD CONSTRAINT "FK_match_events_match_id"
      FOREIGN KEY ("match_id") REFERENCES "matches"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "match_events"
      ADD CONSTRAINT "FK_match_events_club_id"
      FOREIGN KEY ("club_id") REFERENCES "clubs"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "match_events"
      ADD CONSTRAINT "FK_match_events_player_id"
      FOREIGN KEY ("player_id") REFERENCES "players"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "match_timelines" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "match_id" uuid NOT NULL,
        "minute" integer NOT NULL,
        "home_score" integer NOT NULL,
        "away_score" integer NOT NULL,
        "commentary" character varying(255) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_match_timelines_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "match_timelines"
      ADD CONSTRAINT "FK_match_timelines_match_id"
      FOREIGN KEY ("match_id") REFERENCES "matches"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "match_player_ratings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "match_id" uuid NOT NULL,
        "player_id" uuid NOT NULL,
        "club_id" uuid NOT NULL,
        "rating" numeric(3,1) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_match_player_ratings_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "match_player_ratings"
      ADD CONSTRAINT "FK_match_player_ratings_match_id"
      FOREIGN KEY ("match_id") REFERENCES "matches"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "match_player_ratings"
      ADD CONSTRAINT "FK_match_player_ratings_player_id"
      FOREIGN KEY ("player_id") REFERENCES "players"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "match_player_ratings"
      ADD CONSTRAINT "FK_match_player_ratings_club_id"
      FOREIGN KEY ("club_id") REFERENCES "clubs"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_matches_fixture_id" ON "matches" ("fixture_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_match_events_match_minute" ON "match_events" ("match_id", "minute")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_match_timelines_match_minute" ON "match_timelines" ("match_id", "minute")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_match_player_ratings_match" ON "match_player_ratings" ("match_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_match_player_ratings_match"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_match_timelines_match_minute"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_match_events_match_minute"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_matches_fixture_id"`);

    await queryRunner.query(
      `ALTER TABLE "match_player_ratings" DROP CONSTRAINT IF EXISTS "FK_match_player_ratings_club_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "match_player_ratings" DROP CONSTRAINT IF EXISTS "FK_match_player_ratings_player_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "match_player_ratings" DROP CONSTRAINT IF EXISTS "FK_match_player_ratings_match_id"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "match_player_ratings"`);

    await queryRunner.query(
      `ALTER TABLE "match_timelines" DROP CONSTRAINT IF EXISTS "FK_match_timelines_match_id"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "match_timelines"`);

    await queryRunner.query(`ALTER TABLE "match_events" DROP CONSTRAINT IF EXISTS "FK_match_events_player_id"`);
    await queryRunner.query(`ALTER TABLE "match_events" DROP CONSTRAINT IF EXISTS "FK_match_events_club_id"`);
    await queryRunner.query(`ALTER TABLE "match_events" DROP CONSTRAINT IF EXISTS "FK_match_events_match_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "match_events"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "match_events_type_enum"`);

    await queryRunner.query(`ALTER TABLE "matches" DROP CONSTRAINT IF EXISTS "FK_matches_away_club_id"`);
    await queryRunner.query(`ALTER TABLE "matches" DROP CONSTRAINT IF EXISTS "FK_matches_home_club_id"`);
    await queryRunner.query(`ALTER TABLE "matches" DROP CONSTRAINT IF EXISTS "FK_matches_fixture_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "matches"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "matches_status_enum"`);
  }
}
