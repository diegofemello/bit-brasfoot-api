import { MigrationInterface, QueryRunner } from 'typeorm';

export class Phase1WorldDataSchema1739385000000 implements MigrationInterface {
  name = 'Phase1WorldDataSchema1739385000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "countries" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(100) NOT NULL,
        "code" character varying(3) NOT NULL,
        "flag_emoji" character varying(10) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_countries_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_countries_name" UNIQUE ("name"),
        CONSTRAINT "UQ_countries_code" UNIQUE ("code")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "leagues" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(100) NOT NULL,
        "country_id" uuid NOT NULL,
        "division" integer NOT NULL DEFAULT 1,
        "team_count" integer NOT NULL DEFAULT 20,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_leagues_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_leagues_country" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "clubs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(100) NOT NULL,
        "abbreviation" character varying(10) NOT NULL,
        "league_id" uuid NOT NULL,
        "stadium_name" character varying(100) NOT NULL,
        "stadium_capacity" integer NOT NULL DEFAULT 20000,
        "budget" bigint NOT NULL DEFAULT 1000000,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_clubs_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_clubs_league" FOREIGN KEY ("league_id") REFERENCES "leagues"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'players_position_enum') THEN
          CREATE TYPE "players_position_enum" AS ENUM ('GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST');
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "players" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(100) NOT NULL,
        "age" integer NOT NULL,
        "nationality" character varying(3) NOT NULL,
        "position" "players_position_enum" NOT NULL,
        "overall" integer NOT NULL DEFAULT 50,
        "potential" integer NOT NULL DEFAULT 50,
        "club_id" uuid NOT NULL,
        "value" bigint NOT NULL DEFAULT 100000,
        "salary" bigint NOT NULL DEFAULT 5000,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_players_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_players_club" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_leagues_country_id" ON "leagues" ("country_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_clubs_league_id" ON "clubs" ("league_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_players_club_id" ON "players" ("club_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_players_overall" ON "players" ("overall")`,
    );

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_save_games_club') THEN
          ALTER TABLE "save_games"
          ADD CONSTRAINT "FK_save_games_club"
          FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
        END IF;
      END
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "save_games" DROP CONSTRAINT IF EXISTS "FK_save_games_club"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_players_overall"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_players_club_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_clubs_league_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_leagues_country_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "players"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "players_position_enum"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "clubs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "leagues"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "countries"`);
  }
}
