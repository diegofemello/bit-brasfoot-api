import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { BaseCrudService } from '../../common/services/base-crud.service';
import { CreateClubDto } from './dto/create-club.dto';
import { Club } from './entities/club.entity';

@Injectable()
export class ClubService extends BaseCrudService<Club> {
  constructor(
    @InjectRepository(Club)
    repository: Repository<Club>,
  ) {
    super(repository);
  }

  listAll(pagination: PaginationDto) {
    return this.findPaginated(pagination, {
      relations: ['league', 'league.country'],
      order: { name: 'ASC' },
    });
  }

  listByLeague(leagueId: string, pagination: PaginationDto) {
    return this.findPaginated(pagination, {
      where: { leagueId },
      relations: ['league'],
      order: { name: 'ASC' },
    });
  }

  createClub(payload: CreateClubDto) {
    return this.create(payload);
  }
}
