import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';

export class RespondTransferProposalDto {
  @IsIn(['accept', 'reject', 'counter', 'cancel'])
  action!: 'accept' | 'reject' | 'counter' | 'cancel';

  @IsOptional()
  @IsInt()
  @Min(0)
  counterAmount?: number;

  @IsOptional()
  @IsString()
  @Length(2, 200)
  note?: string;
}
