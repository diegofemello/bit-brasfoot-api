import { IsBoolean, IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class CreateTransferListingDto {
  @IsUUID()
  saveGameId!: string;

  @IsUUID()
  playerId!: string;

  @IsInt()
  @Min(1)
  askingPrice!: number;

  @IsOptional()
  @IsBoolean()
  isLoanAvailable?: boolean;
}
