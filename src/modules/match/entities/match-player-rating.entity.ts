import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Player } from '../../player/entities/player.entity';
import { Match } from './match.entity';

@Entity({ name: 'match_player_ratings' })
export class MatchPlayerRating {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'match_id' })
  matchId!: string;

  @ManyToOne(() => Match, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'match_id' })
  match!: Match;

  @Column({ name: 'player_id' })
  playerId!: string;

  @ManyToOne(() => Player, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'player_id' })
  player!: Player;

  @Column({ name: 'club_id' })
  clubId!: string;

  @Column({ type: 'numeric', precision: 3, scale: 1 })
  rating!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
