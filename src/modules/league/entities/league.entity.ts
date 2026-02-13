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
import { Club } from '../../club/entities/club.entity';
import { Country } from '../../country/entities/country.entity';

@Entity({ name: 'leagues' })
export class League {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 100 })
  name!: string;

  @Column({ name: 'country_id' })
  countryId!: string;

  @ManyToOne(() => Country, (country) => country.leagues, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'country_id' })
  country!: Country;

  @Column({ type: 'int', default: 1 })
  division!: number; // 1 = primeira divisão, 2 = segunda, etc

  @Column({ name: 'team_count', type: 'int', default: 20 })
  teamCount!: number;

  @OneToMany(() => Club, (club) => club.league)
  clubs!: Club[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
