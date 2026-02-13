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
import { SaveGame } from '../../save-game/entities/save-game.entity';
import { Competition } from './competition.entity';
import { Fixture } from './fixture.entity';
import { Standing } from './standing.entity';

export enum CompetitionSeasonStatus {
  ONGOING = 'ongoing',
  FINISHED = 'finished',
}

@Entity({ name: 'competition_seasons' })
export class CompetitionSeason {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'competition_id' })
  competitionId!: string;

  @ManyToOne(() => Competition, (competition) => competition.seasons, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'competition_id' })
  competition!: Competition;

  @Column({ name: 'save_game_id' })
  saveGameId!: string;

  @ManyToOne(() => SaveGame, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'save_game_id' })
  saveGame!: SaveGame;

  @Column({ name: 'season_year', type: 'int' })
  seasonYear!: number;

  @Column({ name: 'current_round', type: 'int', default: 1 })
  currentRound!: number;

  @Column({
    type: 'enum',
    enum: CompetitionSeasonStatus,
    default: CompetitionSeasonStatus.ONGOING,
  })
  status!: CompetitionSeasonStatus;

  @OneToMany(() => Standing, (standing) => standing.season)
  standings!: Standing[];

  @OneToMany(() => Fixture, (fixture) => fixture.season)
  fixtures!: Fixture[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
