import {
    IsInt,
    IsOptional,
    IsString,
    IsUUID,
    Length,
    Min,
} from 'class-validator';

export class CreateSaveGameDto {
  @IsUUID()
  userId: string;

  @IsString()
  @Length(2, 100)
  name: string;

  @IsOptional()
  @IsInt()
  @Min(2000)
  currentSeasonYear?: number;
}
