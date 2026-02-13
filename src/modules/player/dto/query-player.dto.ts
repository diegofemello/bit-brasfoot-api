import { Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
} from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { PlayerPosition } from '../entities/player.entity';

export class QueryPlayerDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string;

  @IsOptional()
  @IsEnum(PlayerPosition)
  position?: PlayerPosition;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  nationality?: string;

  @IsOptional()
  @IsUUID()
  clubId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(16)
  @Max(45)
  minAge?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(16)
  @Max(45)
  maxAge?: number;

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
  @IsIn(['name', 'age', 'overall', 'potential', 'value', 'salary'])
  sortBy?: 'name' | 'age' | 'overall' | 'potential' | 'value' | 'salary';

  @IsOptional()
  @IsIn(['ASC', 'DESC', 'asc', 'desc'])
  sortOrder?: 'ASC' | 'DESC' | 'asc' | 'desc';
}
