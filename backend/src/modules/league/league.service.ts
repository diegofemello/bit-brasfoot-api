import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { BaseCrudService } from '../../common/services/base-crud.service';
import { CreateLeagueDto } from './dto/create-league.dto';
import { UpdateLeagueDto } from './dto/update-league.dto';
import { League } from './entities/league.entity';

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

  async findLeagueById(id: string) {
    const league = await this.repository.findOne({
      where: { id },
      relations: ['country'],
    });

    if (!league) {
      throw new NotFoundException('Liga não encontrada');
    }

    return league;
  }

  async updateLeague(id: string, payload: UpdateLeagueDto) {
    await this.findLeagueById(id);

    const updated = await this.repository.save({
      id,
      ...payload,
    });

    return this.findLeagueById(updated.id);
  }

  async removeLeague(id: string) {
    await this.findLeagueById(id);
    await this.repository.delete(id);

    return {
      success: true,
      message: 'Liga removida com sucesso',
    };
  }
}
