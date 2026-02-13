import { IsInt, IsString, IsUUID, Length, Min } from 'class-validator';

export class RegisterTicketIncomeDto {
  @IsUUID()
  saveGameId!: string;

  @IsString()
  @Length(2, 100)
  matchLabel!: string;

  @IsInt()
  @Min(1)
  attendance!: number;

  @IsInt()
  @Min(1)
  ticketPrice!: number;
}
