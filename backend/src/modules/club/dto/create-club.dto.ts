import { IsInt, IsString, IsUUID, Length, Min } from 'class-validator';

export class CreateClubDto {
  @IsString()
  @Length(2, 100)
  name: string;

  @IsString()
  @Length(2, 10)
  abbreviation: string;

  @IsUUID()
  leagueId: string;

  @IsString()
  @Length(2, 100)
  stadiumName: string;

  @IsInt()
  @Min(1000)
  stadiumCapacity: number;

  @IsInt()
  @Min(0)
  budget: number;
}
