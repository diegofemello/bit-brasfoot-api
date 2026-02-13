import { IsIn, IsOptional, IsUUID } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QueryTransferProposalsDto extends PaginationDto {
  @IsUUID()
  saveGameId!: string;

  @IsOptional()
  @IsIn(['sent', 'received', 'history'])
  scope?: 'sent' | 'received' | 'history';
}
