import {
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';

export class CreateTacticDto {
  @IsUUID()
  saveGameId!: string;

  @IsString()
  @Length(3, 20)
  formation!: string;

  @IsOptional()
  @IsObject()
  lineup?: Record<string, string>;

  @IsOptional()
  @IsIn(['defensive', 'balanced', 'attacking'])
  mentality?: 'defensive' | 'balanced' | 'attacking';

  @IsOptional()
  @IsIn(['low', 'medium', 'high'])
  pressing?: 'low' | 'medium' | 'high';

  @IsOptional()
  @IsIn(['low', 'normal', 'high'])
  tempo?: 'low' | 'normal' | 'high';
}
