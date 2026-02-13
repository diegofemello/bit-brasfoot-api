import { MigrationInterface, QueryRunner } from 'typeorm';

export class Phase2ClubManagementSchema1739390000000
  implements MigrationInterface
{
  name = 'Phase2ClubManagementSchema1739390000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "tactics" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "save_game_id" uuid NOT NULL,
        "formation" character varying(20) NOT NULL DEFAULT '4-3-3',
        "lineup" text,
        "instructions" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tactics_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_tactics_save_game_id" UNIQUE ("save_game_id"),
        CONSTRAINT "FK_tactics_save_game" FOREIGN KEY ("save_game_id") REFERENCES "save_games"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "finance_accounts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "save_game_id" uuid NOT NULL,
        "balance" bigint NOT NULL DEFAULT 30000000,
        "monthly_income" bigint NOT NULL DEFAULT 2000000,
        "monthly_expense" bigint NOT NULL DEFAULT 1200000,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_finance_accounts_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_finance_accounts_save_game_id" UNIQUE ("save_game_id"),
        CONSTRAINT "FK_finance_accounts_save_game" FOREIGN KEY ("save_game_id") REFERENCES "save_games"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'finance_transactions_type_enum') THEN
          CREATE TYPE "finance_transactions_type_enum" AS ENUM ('income', 'expense');
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "finance_transactions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "save_game_id" uuid NOT NULL,
        "type" "finance_transactions_type_enum" NOT NULL,
        "category" character varying(60) NOT NULL,
        "amount" bigint NOT NULL,
        "description" character varying(200) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_finance_transactions_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_finance_transactions_save_game" FOREIGN KEY ("save_game_id") REFERENCES "save_games"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "infrastructures" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "save_game_id" uuid NOT NULL,
        "training_level" integer NOT NULL DEFAULT 1,
        "youth_level" integer NOT NULL DEFAULT 1,
        "medical_level" integer NOT NULL DEFAULT 1,
        "stadium_level" integer NOT NULL DEFAULT 1,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_infrastructures_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_infrastructures_save_game_id" UNIQUE ("save_game_id"),
        CONSTRAINT "FK_infrastructures_save_game" FOREIGN KEY ("save_game_id") REFERENCES "save_games"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_finance_transactions_save_game" ON "finance_transactions" ("save_game_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_finance_transactions_save_game"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "infrastructures"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "finance_transactions"`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "finance_transactions_type_enum"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "finance_accounts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "tactics"`);
  }
}
