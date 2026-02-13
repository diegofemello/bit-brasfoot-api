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

export enum TransferType {
  PURCHASE = 'purchase',
  SALE = 'sale',
  LOAN = 'loan',
  SWAP = 'swap',
  RELEASE = 'release',
}

export enum TransferProposalStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  COUNTERED = 'countered',
  CANCELED = 'canceled',
}

@Entity({ name: 'transfer_proposals' })
export class TransferProposal {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'save_game_id' })
  saveGameId!: string;

  @ManyToOne(() => SaveGame, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'save_game_id' })
  saveGame!: SaveGame;

  @Column({ name: 'player_id' })
  playerId!: string;

  @ManyToOne(() => Player, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'player_id' })
  player!: Player;

  @Column({ name: 'from_club_id', nullable: true })
  fromClubId!: string | null;

  @ManyToOne(() => Club, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'from_club_id' })
  fromClub!: Club | null;

  @Column({ name: 'to_club_id', nullable: true })
  toClubId!: string | null;

  @ManyToOne(() => Club, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'to_club_id' })
  toClub!: Club | null;

  @Column({
    type: 'enum',
    enum: TransferType,
  })
  type!: TransferType;

  @Column({ type: 'bigint', nullable: true })
  amount!: number | null;

  @Column({ name: 'swap_player_id', nullable: true })
  swapPlayerId!: string | null;

  @ManyToOne(() => Player, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'swap_player_id' })
  swapPlayer!: Player | null;

  @Column({
    type: 'enum',
    enum: TransferProposalStatus,
    default: TransferProposalStatus.PENDING,
  })
  status!: TransferProposalStatus;

  @Column({
    name: 'response_note',
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  responseNote!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
