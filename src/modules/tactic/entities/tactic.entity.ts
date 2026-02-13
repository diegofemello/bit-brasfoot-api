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

@Entity({ name: 'tactics' })
export class Tactic {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'save_game_id' })
  saveGameId!: string;

  @ManyToOne(() => SaveGame, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'save_game_id' })
  saveGame!: SaveGame;

  @Column({ length: 20, default: '4-3-3' })
  formation!: string;

  @Column({ type: 'simple-json', nullable: true })
  lineup!: Record<string, string> | null;

  @Column({ type: 'simple-json', nullable: true })
  instructions!: {
    mentality: 'defensive' | 'balanced' | 'attacking';
    pressing: 'low' | 'medium' | 'high';
    tempo: 'low' | 'normal' | 'high';
  } | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
