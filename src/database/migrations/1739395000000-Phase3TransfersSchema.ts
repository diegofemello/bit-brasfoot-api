import { MigrationInterface, QueryRunner } from 'typeorm';

export class Phase3TransfersSchema1739395000000 implements MigrationInterface {
  name = 'Phase3TransfersSchema1739395000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "players" DROP CONSTRAINT IF EXISTS "FK_players_club"`,
    );
    await queryRunner.query(
      `ALTER TABLE "players" ALTER COLUMN "club_id" DROP NOT NULL`,
    );
    await queryRunner.query(`
      ALTER TABLE "players"
      ADD CONSTRAINT "FK_players_club"
      FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "transfer_listings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "save_game_id" uuid NOT NULL,
        "player_id" uuid NOT NULL,
        "club_id" uuid,
        "asking_price" bigint NOT NULL,
        "is_loan_available" boolean NOT NULL DEFAULT false,
        "is_free_agent" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_transfer_listings_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_transfer_listings_player_id" UNIQUE ("player_id"),
        CONSTRAINT "FK_transfer_listings_save" FOREIGN KEY ("save_game_id") REFERENCES "save_games"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_transfer_listings_player" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_transfer_listings_club" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE SET NULL ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transfer_proposals_type_enum') THEN
          CREATE TYPE "transfer_proposals_type_enum" AS ENUM ('purchase', 'sale', 'loan', 'swap', 'release');
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transfer_proposals_status_enum') THEN
          CREATE TYPE "transfer_proposals_status_enum" AS ENUM ('pending', 'accepted', 'rejected', 'countered', 'canceled');
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "transfer_proposals" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "save_game_id" uuid NOT NULL,
        "player_id" uuid NOT NULL,
        "from_club_id" uuid,
        "to_club_id" uuid,
        "type" "transfer_proposals_type_enum" NOT NULL,
        "amount" bigint,
        "swap_player_id" uuid,
        "status" "transfer_proposals_status_enum" NOT NULL DEFAULT 'pending',
        "response_note" character varying(200),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_transfer_proposals_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_transfer_proposals_save" FOREIGN KEY ("save_game_id") REFERENCES "save_games"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_transfer_proposals_player" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_transfer_proposals_from_club" FOREIGN KEY ("from_club_id") REFERENCES "clubs"("id") ON DELETE SET NULL ON UPDATE NO ACTION,
        CONSTRAINT "FK_transfer_proposals_to_club" FOREIGN KEY ("to_club_id") REFERENCES "clubs"("id") ON DELETE SET NULL ON UPDATE NO ACTION,
        CONSTRAINT "FK_transfer_proposals_swap_player" FOREIGN KEY ("swap_player_id") REFERENCES "players"("id") ON DELETE SET NULL ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_transfer_listings_save_game" ON "transfer_listings" ("save_game_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_transfer_proposals_save_game" ON "transfer_proposals" ("save_game_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_transfer_proposals_save_game"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_transfer_listings_save_game"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "transfer_proposals"`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "transfer_proposals_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "transfer_proposals_type_enum"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "transfer_listings"`);

    await queryRunner.query(
      `ALTER TABLE "players" DROP CONSTRAINT IF EXISTS "FK_players_club"`,
    );
    await queryRunner.query(
      `ALTER TABLE "players" ALTER COLUMN "club_id" SET NOT NULL`,
    );
    await queryRunner.query(`
      ALTER TABLE "players"
      ADD CONSTRAINT "FK_players_club"
      FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }
}
