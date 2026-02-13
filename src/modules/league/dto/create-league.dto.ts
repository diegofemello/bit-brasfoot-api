import { IsInt, IsString, IsUUID, Length, Min } from 'class-validator';

export class CreateLeagueDto {
  @IsString()
  @Length(2, 100)
  name: string;

  @IsUUID()
  countryId: string;

  @IsInt()
  @Min(1)
  division: number;

  @IsInt()
  @Min(4)
  teamCount: number;
}
