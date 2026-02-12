import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SaveGame } from '../../save-game/entities/save-game.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'manager_name', length: 100 })
  managerName!: string;

  @Column({ length: 10, default: 'pt-BR' })
  locale!: string;

  @OneToMany(() => SaveGame, (saveGame: SaveGame) => saveGame.user)
  saveGames!: SaveGame[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
