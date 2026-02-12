import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { League } from '../../league/entities/league.entity';

@Entity({ name: 'countries' })
export class Country {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 100, unique: true })
  name!: string;

  @Column({ length: 3, unique: true })
  code!: string; // ISO 3166-1 alpha-3 (ex: BRA, ENG, ESP)

  @Column({ name: 'flag_emoji', length: 10 })
  flagEmoji!: string;

  @OneToMany(() => League, (league) => league.country)
  leagues!: League[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
