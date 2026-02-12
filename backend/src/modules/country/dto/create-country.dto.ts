import { IsString, Length } from 'class-validator';

export class CreateCountryDto {
  @IsString()
  @Length(2, 100)
  name: string;

  @IsString()
  @Length(3, 3)
  code: string;

  @IsString()
  @Length(1, 10)
  flagEmoji: string;
}
