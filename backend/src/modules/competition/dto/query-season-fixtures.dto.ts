import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class QuerySeasonFixturesDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  round?: number;
}
