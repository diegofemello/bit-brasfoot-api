import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { BaseCrudService } from '../../common/services/base-crud.service';
import { CreatePlayerDto } from './dto/create-player.dto';
import { QueryPlayerDto } from './dto/query-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';
import { Player } from './entities/player.entity';

@Injectable()
export class PlayerService extends BaseCrudService<Player> {
  constructor(
    @InjectRepository(Player)
    repository: Repository<Player>,
  ) {
    super(repository);
  }

  listByClub(clubId: string, pagination: PaginationDto) {
    return this.findPaginated(pagination, {
      where: { clubId },
      relations: ['club'],
      order: { overall: 'DESC' },
    });
  }

  async searchPlayers(query: QueryPlayerDto): Promise<PaginatedResult<Player>> {
    const {
      page,
      limit,
      name,
      position,
      nationality,
      clubId,
      minAge,
      maxAge,
      minOverall,
      maxOverall,
      sortBy,
      sortOrder,
    } = query;

    const qb = this.repository
      .createQueryBuilder('player')
      .leftJoinAndSelect('player.club', 'club');

    if (name) {
      qb.andWhere('LOWER(player.name) LIKE :name', {
        name: `%${name.toLowerCase()}%`,
      });
    }

    if (position) {
      qb.andWhere('player.position = :position', { position });
    }

    if (nationality) {
      qb.andWhere('player.nationality = :nationality', {
        nationality: nationality.toUpperCase(),
      });
    }

    if (clubId) {
      qb.andWhere('player.clubId = :clubId', { clubId });
    }

    if (minAge !== undefined) {
      qb.andWhere('player.age >= :minAge', { minAge });
    }

    if (maxAge !== undefined) {
      qb.andWhere('player.age <= :maxAge', { maxAge });
    }

    if (minOverall !== undefined) {
      qb.andWhere('player.overall >= :minOverall', { minOverall });
    }

    if (maxOverall !== undefined) {
      qb.andWhere('player.overall <= :maxOverall', { maxOverall });
    }

    const orderBy = sortBy ?? 'overall';
    const orderDirection = sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    qb.orderBy(`player.${orderBy}`, orderDirection);
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  createPlayer(payload: CreatePlayerDto) {
    return this.create(payload);
  }

  async findPlayerById(id: string) {
    const player = await this.repository.findOne({
      where: { id },
      relations: ['club', 'club.league'],
    });

    if (!player) {
      throw new NotFoundException('Jogador não encontrado');
    }

    return player;
  }

  async updatePlayer(id: string, payload: UpdatePlayerDto) {
    await this.findPlayerById(id);

    const updated = await this.repository.save({
      id,
      ...payload,
    });

    return this.findPlayerById(updated.id);
  }

  async removePlayer(id: string) {
    await this.findPlayerById(id);
    await this.repository.delete(id);

    return {
      success: true,
      message: 'Jogador removido com sucesso',
    };
  }

  async getPlayerStats(id: string) {
    const player = await this.findPlayerById(id);

    const formHistory = Array.from({ length: 8 }).map((_, index) => {
      const variation = ((player.overall + index) % 5) - 2;
      return {
        match: index + 1,
        rating: Math.max(5.5, Math.min(9.5, 7 + variation * 0.3)),
      };
    });

    return {
      player,
      summary: {
        averageRating:
          formHistory.reduce((sum, item) => sum + item.rating, 0) /
          formHistory.length,
        goals: Math.max(0, Math.floor((player.overall - 60) / 5)),
        assists: Math.max(0, Math.floor((player.potential - 65) / 6)),
        matches: 8,
      },
      formHistory,
    };
  }
}
