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

export enum StandingStage {
  LEAGUE = 'league',
  GROUP = 'group',
}

@Entity({ name: 'standings' })
export class Standing {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'season_id' })
  seasonId!: string;

  @ManyToOne(() => CompetitionSeason, (season) => season.standings, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'season_id' })
  season!: CompetitionSeason;

  @Column({ name: 'club_id' })
  clubId!: string;

  @ManyToOne(() => Club, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'club_id' })
  club!: Club;

  @Column({
    type: 'enum',
    enum: StandingStage,
    default: StandingStage.LEAGUE,
  })
  stage!: StandingStage;

  @Column({ name: 'group_name', type: 'varchar', length: 20, nullable: true })
  groupName!: string | null;

  @Column({ type: 'int', default: 0 })
  position!: number;

  @Column({ type: 'int', default: 0 })
  played!: number;

  @Column({ type: 'int', default: 0 })
  wins!: number;

  @Column({ type: 'int', default: 0 })
  draws!: number;

  @Column({ type: 'int', default: 0 })
  losses!: number;

  @Column({ name: 'goals_for', type: 'int', default: 0 })
  goalsFor!: number;

  @Column({ name: 'goals_against', type: 'int', default: 0 })
  goalsAgainst!: number;

  @Column({ name: 'goal_difference', type: 'int', default: 0 })
  goalDifference!: number;

  @Column({ type: 'int', default: 0 })
  points!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
