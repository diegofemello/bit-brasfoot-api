import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QueryTransferMarketDto extends PaginationDto {
  @IsOptional()
  @IsUUID()
  saveGameId?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  position?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  minOverall?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  maxOverall?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minValue?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxValue?: number;

  @IsOptional()
  @IsIn(['overall', 'value', 'age'])
  sortBy?: 'overall' | 'value' | 'age';

  @IsOptional()
  @IsIn(['ASC', 'DESC', 'asc', 'desc'])
  sortOrder?: 'ASC' | 'DESC' | 'asc' | 'desc';
}
