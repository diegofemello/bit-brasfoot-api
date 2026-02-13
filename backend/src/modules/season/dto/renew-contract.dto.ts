import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class RenewContractDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  years?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  salaryIncreasePercent?: number;
}
