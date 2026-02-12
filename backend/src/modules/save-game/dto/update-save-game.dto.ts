import { IsBoolean, IsInt, IsOptional, IsString, Length, Min } from 'class-validator';

export class UpdateSaveGameDto {
  @IsOptional()
  @IsString()
  @Length(2, 100)
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(2000)
  currentSeasonYear?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
