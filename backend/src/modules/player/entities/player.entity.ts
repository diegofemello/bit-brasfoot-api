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

export enum PlayerPosition {
  GK = 'GK', // Goleiro
  CB = 'CB', // Zagueiro Central
  LB = 'LB', // Lateral Esquerdo
  RB = 'RB', // Lateral Direito
  CDM = 'CDM', // Volante
  CM = 'CM', // Meio-campo Central
  CAM = 'CAM', // Meia Ofensivo
  LW = 'LW', // Ponta Esquerda
  RW = 'RW', // Ponta Direita
  ST = 'ST', // Atacante
}

@Entity({ name: 'players' })
export class Player {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 100 })
  name!: string;

  @Column({ type: 'int' })
  age!: number;

  @Column({ length: 3 })
  nationality!: string; // Código do país (BRA, ARG, etc)

  @Column({
    type: 'enum',
    enum: PlayerPosition,
  })
  position!: PlayerPosition;

  @Column({ type: 'int', default: 50 })
  overall!: number; // Overall geral do jogador (1-100)

  @Column({ type: 'int', default: 50 })
  potential!: number; // Potencial máximo (1-100)

  @Column({ name: 'club_id', nullable: true })
  clubId!: string | null;

  @ManyToOne(() => Club, (club) => club.players, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'club_id' })
  club!: Club | null;

  @Column({ type: 'bigint', default: 100000 })
  value!: number; // Valor de mercado

  @Column({ type: 'bigint', default: 5000 })
  salary!: number; // Salário mensal

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
