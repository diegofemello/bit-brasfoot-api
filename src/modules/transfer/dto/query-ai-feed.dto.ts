import { IsUUID } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QueryAiFeedDto extends PaginationDto {
  @IsUUID()
  saveGameId!: string;
}
