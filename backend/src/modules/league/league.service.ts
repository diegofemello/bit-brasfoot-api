import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { BaseCrudService } from '../../common/services/base-crud.service';
import { League } from './entities/league.entity';
import { CreateLeagueDto } from './dto/create-league.dto';

@Injectable()
export class LeagueService extends BaseCrudService<League> {
  constructor(
    @InjectRepository(League)
    repository: Repository<League>,
  ) {
    super(repository);
  }

  listAll(pagination: PaginationDto) {
    return this.findPaginated(pagination, {
      relations: ['country'],
      order: { name: 'ASC' },
    });
  }

  listByCountry(countryId: string, pagination: PaginationDto) {
    return this.findPaginated(pagination, {
      where: { countryId },
      relations: ['country'],
      order: { division: 'ASC' },
    });
  }

  createLeague(payload: CreateLeagueDto) {
    return this.create(payload);
  }
}
