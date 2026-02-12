import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { BaseCrudService } from '../../common/services/base-crud.service';
import { CreateSaveGameDto } from './dto/create-save-game.dto';
import { SaveGame } from './entities/save-game.entity';

@Injectable()
export class SaveGameService extends BaseCrudService<SaveGame> {
  constructor(
    @InjectRepository(SaveGame)
    repository: Repository<SaveGame>,
  ) {
    super(repository);
  }

  createSave(payload: CreateSaveGameDto) {
    return this.create({
      userId: payload.userId,
      name: payload.name,
      currentDate: new Date().toISOString().slice(0, 10),
      currentSeasonYear: payload.currentSeasonYear ?? new Date().getFullYear(),
      isActive: true,
    });
  }

  listByUser(userId: string, pagination: PaginationDto) {
    return this.findPaginated(pagination, {
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }
}
