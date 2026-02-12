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
import { CompetitionSeason } from './competition-season.entity';

export enum FixtureStatus {
  SCHEDULED = 'scheduled',
  PLAYED = 'played',
}

export enum FixtureStage {
  LEAGUE = 'league',
  GROUP = 'group',
  KNOCKOUT = 'knockout',
}

export enum KnockoutRound {
  ROUND_OF_16 = 'round_of_16',
  QUARTERFINAL = 'quarterfinal',
  SEMIFINAL = 'semifinal',
  FINAL = 'final',
}

@Entity({ name: 'fixtures' })
export class Fixture {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'season_id' })
  seasonId!: string;

  @ManyToOne(() => CompetitionSeason, (season) => season.fixtures, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'season_id' })
  season!: CompetitionSeason;

  @Column({ type: 'int' })
  round!: number;

  @Column({
    type: 'enum',
    enum: FixtureStage,
    default: FixtureStage.LEAGUE,
  })
  stage!: FixtureStage;

  @Column({ name: 'group_name', type: 'varchar', length: 20, nullable: true })
  groupName!: string | null;

  @Column({
    name: 'knockout_round',
    type: 'enum',
    enum: KnockoutRound,
    nullable: true,
  })
  knockoutRound!: KnockoutRound | null;

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

  @Column({ name: 'match_date', type: 'date' })
  matchDate!: string;

  @Column({
    type: 'enum',
    enum: FixtureStatus,
    default: FixtureStatus.SCHEDULED,
  })
  status!: FixtureStatus;

  @Column({ name: 'home_score', type: 'int', nullable: true })
  homeScore!: number | null;

  @Column({ name: 'away_score', type: 'int', nullable: true })
  awayScore!: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
