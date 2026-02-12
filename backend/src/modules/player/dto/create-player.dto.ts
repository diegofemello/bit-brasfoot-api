import {
 
 
 
 
 
 
 ,

  IsEnum,
  IsInt,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
} from 'class-validator';
import { PlayerPosition } from '../entities/player.entity';

export class CreatePlayerDto {
  @IsString()
  @Length(2, 100)
  name: string;

  @IsInt()
  @Min(16)
  @Max(45)
  age: number;

  @IsString()
  @Length(3, 3)
  nationality: string;

  @IsEnum(PlayerPosition)
  position: PlayerPosition;

  @IsInt()
  @Min(1)
  @Max(100)
  overall: number;

  @IsInt()
  @Min(1)
  @Max(100)
  potential: number;

  @IsUUID()
  clubId: string;

  @IsInt()
  @Min(0)
  value: number;

  @IsInt()
  @Min(0)
  salary: number;
}
