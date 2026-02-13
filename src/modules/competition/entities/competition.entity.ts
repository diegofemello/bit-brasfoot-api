import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { League } from '../../league/entities/league.entity';
import { CompetitionSeason } from './competition-season.entity';

export enum CompetitionType {
  LEAGUE = 'league',
  CUP = 'cup',
  CONTINENTAL = 'continental',
}

@Entity({ name: 'competitions' })
export class Competition {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 120 })
  name!: string;

  @Column({
    type: 'enum',
    enum: CompetitionType,
    default: CompetitionType.LEAGUE,
  })
  type!: CompetitionType;

  @Column({ name: 'league_id', nullable: true })
  leagueId!: string | null;

  @ManyToOne(() => League, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'league_id' })
  league!: League | null;

  @OneToMany(() => CompetitionSeason, (season) => season.competition)
  seasons!: CompetitionSeason[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
