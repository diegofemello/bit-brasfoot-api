import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SaveGame } from '../../save-game/entities/save-game.entity';

@Entity({ name: 'infrastructures' })
export class Infrastructure {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'save_game_id', unique: true })
  saveGameId!: string;

  @ManyToOne(() => SaveGame, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'save_game_id' })
  saveGame!: SaveGame;

  @Column({ name: 'training_level', type: 'int', default: 1 })
  trainingLevel!: number;

  @Column({ name: 'youth_level', type: 'int', default: 1 })
  youthLevel!: number;

  @Column({ name: 'medical_level', type: 'int', default: 1 })
  medicalLevel!: number;

  @Column({ name: 'stadium_level', type: 'int', default: 1 })
  stadiumLevel!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
