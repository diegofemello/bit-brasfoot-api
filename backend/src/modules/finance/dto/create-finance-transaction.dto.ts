import { IsEnum, IsInt, IsString, IsUUID, Length, Min } from 'class-validator';
import { FinanceTransactionType } from '../entities/finance-transaction.entity';

export class CreateFinanceTransactionDto {
  @IsUUID()
  saveGameId!: string;

  @IsEnum(FinanceTransactionType)
  type!: FinanceTransactionType;

  @IsString()
  @Length(2, 60)
  category!: string;

  @IsInt()
  @Min(1)
  amount!: number;

  @IsString()
  @Length(2, 200)
  description!: string;
}
