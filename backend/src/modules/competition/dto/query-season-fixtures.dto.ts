import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Min } from 'class-validator';

export class QuerySeasonFixturesDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  round?: number;

  @IsOptional()
  @IsIn(['league', 'group', 'knockout'])
  stage?: 'league' | 'group' | 'knockout';
}
