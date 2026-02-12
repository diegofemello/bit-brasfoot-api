import { IsOptional, IsString, Length } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @Length(2, 100)
  managerName: string;

  @IsOptional()
  @IsString()
  @Length(2, 10)
  locale?: string;
}
