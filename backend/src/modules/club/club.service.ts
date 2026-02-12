import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { BaseCrudService } from '../../common/services/base-crud.service';
import { CreateClubDto } from './dto/create-club.dto';
import { UpdateClubDto } from './dto/update-club.dto';
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

  async findClubById(id: string) {
    const club = await this.repository.findOne({
      where: { id },
      relations: ['league', 'league.country'],
    });

    if (!club) {
      throw new NotFoundException('Clube não encontrado');
    }

    return club;
  }

  async updateClub(id: string, payload: UpdateClubDto) {
    await this.findClubById(id);

    const updated = await this.repository.save({
      id,
      ...payload,
    });

    return this.findClubById(updated.id);
  }

  async removeClub(id: string) {
    await this.findClubById(id);
    await this.repository.delete(id);

    return {
      success: true,
      message: 'Clube removido com sucesso',
    };
  }
}
