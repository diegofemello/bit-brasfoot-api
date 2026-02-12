import { IsUUID } from 'class-validator';

export class AssignClubDto {
  @IsUUID()
  clubId!: string;
}
