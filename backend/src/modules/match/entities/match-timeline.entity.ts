import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Match } from './match.entity';

@Entity({ name: 'match_timelines' })
export class MatchTimeline {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'match_id' })
  matchId!: string;

  @ManyToOne(() => Match, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'match_id' })
  match!: Match;

  @Column({ type: 'int' })
  minute!: number;

  @Column({ name: 'home_score', type: 'int' })
  homeScore!: number;

  @Column({ name: 'away_score', type: 'int' })
  awayScore!: number;

  @Column({ type: 'varchar', length: 255 })
  commentary!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
