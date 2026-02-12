import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SaveGame } from '../../save-game/entities/save-game.entity';

export enum FinanceTransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

@Entity({ name: 'finance_transactions' })
export class FinanceTransaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'save_game_id' })
  saveGameId!: string;

  @ManyToOne(() => SaveGame, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'save_game_id' })
  saveGame!: SaveGame;

  @Column({
    type: 'enum',
    enum: FinanceTransactionType,
  })
  type!: FinanceTransactionType;

  @Column({ length: 60 })
  category!: string;

  @Column({ type: 'bigint' })
  amount!: number;

  @Column({ length: 200 })
  description!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
