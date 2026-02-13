import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Club } from '../../club/entities/club.entity';
import { Fixture } from '../../competition/entities/fixture.entity';

export enum MatchStatus {
  FINISHED = 'finished',
}

@Entity({ name: 'matches' })
@Unique('UQ_matches_fixture_id', ['fixtureId'])
export class Match {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'fixture_id' })
  fixtureId!: string;

  @ManyToOne(() => Fixture, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'fixture_id' })
  fixture!: Fixture;

  @Column({ name: 'home_club_id' })
  homeClubId!: string;

  @ManyToOne(() => Club, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'home_club_id' })
  homeClub!: Club;

  @Column({ name: 'away_club_id' })
  awayClubId!: string;

  @ManyToOne(() => Club, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'away_club_id' })
  awayClub!: Club;

  @Column({ name: 'home_score', type: 'int', default: 0 })
  homeScore!: number;

  @Column({ name: 'away_score', type: 'int', default: 0 })
  awayScore!: number;

  @Column({ name: 'home_possession', type: 'int', default: 50 })
  homePossession!: number;

  @Column({ name: 'away_possession', type: 'int', default: 50 })
  awayPossession!: number;

  @Column({ name: 'home_shots', type: 'int', default: 0 })
  homeShots!: number;

  @Column({ name: 'away_shots', type: 'int', default: 0 })
  awayShots!: number;

  @Column({
    type: 'enum',
    enum: MatchStatus,
    default: MatchStatus.FINISHED,
  })
  status!: MatchStatus;

  @Column({ name: 'simulated_at', type: 'timestamp', nullable: true })
  simulatedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
