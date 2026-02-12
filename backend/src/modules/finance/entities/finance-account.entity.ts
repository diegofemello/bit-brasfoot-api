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

@Entity({ name: 'finance_accounts' })
export class FinanceAccount {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'save_game_id', unique: true })
  saveGameId!: string;

  @ManyToOne(() => SaveGame, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'save_game_id' })
  saveGame!: SaveGame;

  @Column({ type: 'bigint', default: 30000000 })
  balance!: number;

  @Column({ name: 'monthly_income', type: 'bigint', default: 2000000 })
  monthlyIncome!: number;

  @Column({ name: 'monthly_expense', type: 'bigint', default: 1200000 })
  monthlyExpense!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
