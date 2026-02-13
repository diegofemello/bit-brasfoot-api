import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class RunAiTransfersDto {
  @IsUUID()
  saveGameId!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  offers?: number;
}
