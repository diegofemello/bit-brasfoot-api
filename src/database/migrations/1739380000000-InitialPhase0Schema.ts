import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialPhase0Schema1739380000000 implements MigrationInterface {
  name = 'InitialPhase0Schema1739380000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "manager_name" character varying(100) NOT NULL,
        "locale" character varying(10) NOT NULL DEFAULT 'pt-BR',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "save_games" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid,
        "club_id" uuid,
        "name" character varying(100) NOT NULL,
        "current_date" date NOT NULL,
        "current_season_year" integer NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_save_games_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_save_games_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_save_games_user_id" ON "save_games" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_save_games_club_id" ON "save_games" ("club_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_save_games_club_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_save_games_user_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "save_games"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
  }
}
