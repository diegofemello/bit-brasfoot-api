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
import { Match } from './match.entity';

export enum MatchEventType {
  GOAL = 'goal',
  YELLOW_CARD = 'yellow_card',
  RED_CARD = 'red_card',
  INJURY = 'injury',
  SUBSTITUTION = 'substitution',
  TACTIC_CHANGE = 'tactic_change',
}

@Entity({ name: 'match_events' })
export class MatchEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'match_id' })
  matchId!: string;

  @ManyToOne(() => Match, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'match_id' })
  match!: Match;

  @Column({ type: 'int' })
  minute!: number;

  @Column({
    type: 'enum',
    enum: MatchEventType,
  })
  type!: MatchEventType;

  @Column({ name: 'club_id', nullable: true })
  clubId!: string | null;

  @ManyToOne(() => Club, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'club_id' })
  club!: Club | null;

  @Column({ name: 'player_id', nullable: true })
  playerId!: string | null;

  @ManyToOne(() => Player, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'player_id' })
  player!: Player | null;

  @Column({ type: 'varchar', length: 255 })
  description!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
