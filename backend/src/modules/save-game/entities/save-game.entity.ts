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
import { User } from '../../user/entities/user.entity';

@Entity({ name: 'save_games' })
export class SaveGame {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // TODO: Na Fase 1, tornar obrigatório novamente (remover nullable)
  @Column({ name: 'user_id', nullable: true })
  userId!: string | null;

  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'user_id' })
  user!: User | null;

  @Column({ name: 'club_id', nullable: true })
  clubId!: string | null;

  @ManyToOne(() => Club, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'club_id' })
  club!: Club | null;

  @Column({ length: 100 })
  name!: string;

  @Column({ name: 'current_date', type: 'date' })
  currentDate!: string;

  @Column({ name: 'current_season_year', type: 'int' })
  currentSeasonYear!: number;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
