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
import { Player } from '../../player/entities/player.entity';

@Entity({ name: 'clubs' })
export class Club {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 100 })
  name!: string;

  @Column({ length: 10 })
  abbreviation!: string; // Ex: FLA, PAL, COR

  @Column({ name: 'league_id' })
  leagueId!: string;

  @ManyToOne(() => League, (league) => league.clubs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'league_id' })
  league!: League;

  @Column({ name: 'stadium_name', length: 100 })
  stadiumName!: string;

  @Column({ name: 'stadium_capacity', type: 'int', default: 20000 })
  stadiumCapacity!: number;

  @Column({ type: 'bigint', default: 1000000 })
  budget!: number; // Orçamento em moeda do jogo

  @OneToMany(() => Player, (player) => player.club)
  players!: Player[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
