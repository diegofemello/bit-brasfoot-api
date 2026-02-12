import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Length, Min } from 'class-validator';
import { TransferType } from '../entities/transfer-proposal.entity';

export class CreateTransferProposalDto {
  @IsUUID()
  saveGameId!: string;

  @IsUUID()
  playerId!: string;

  @IsOptional()
  @IsUUID()
  fromClubId?: string;

  @IsOptional()
  @IsUUID()
  toClubId?: string;

  @IsEnum(TransferType)
  type!: TransferType;

  @IsOptional()
  @IsInt()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsUUID()
  swapPlayerId?: string;

  @IsOptional()
  @IsString()
  @Length(2, 200)
  note?: string;
}
