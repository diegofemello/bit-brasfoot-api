import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Club } from '../../club/entities/club.entity';
import { Player } from '../../player/entities/player.entity';
import { SaveGame } from '../../save-game/entities/save-game.entity';

@Entity({ name: 'transfer_listings' })
export class TransferListing {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'save_game_id' })
  saveGameId!: string;

  @ManyToOne(() => SaveGame, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'save_game_id' })
  saveGame!: SaveGame;

  @Column({ name: 'player_id', unique: true })
  playerId!: string;

  @ManyToOne(() => Player, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'player_id' })
  player!: Player;

  @Column({ name: 'club_id', nullable: true })
  clubId!: string | null;

  @ManyToOne(() => Club, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'club_id' })
  club!: Club | null;

  @Column({ name: 'asking_price', type: 'bigint' })
  askingPrice!: number;

  @Column({ name: 'is_loan_available', default: false })
  isLoanAvailable!: boolean;

  @Column({ name: 'is_free_agent', default: false })
  isFreeAgent!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
