import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { BaseCrudService } from '../../common/services/base-crud.service';
import { Player } from './entities/player.entity';
import { CreatePlayerDto } from './dto/create-player.dto';

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

  createPlayer(payload: CreatePlayerDto) {
    return this.create(payload);
  }
}
