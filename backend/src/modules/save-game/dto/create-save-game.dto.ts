import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Min,,
} from 'class-validator';

export class CreateSaveGameDto {
  // TODO: Na Fase 1, userId virá do token de autenticação, não do body
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsString()
  @Length(2, 100)
  name!: string;

  @IsOptional()
  @IsUUID()
  clubId?: string;

  @IsOptional()
  @IsInt()
  @Min(2000)
  currentSeasonYear?: number;
}
