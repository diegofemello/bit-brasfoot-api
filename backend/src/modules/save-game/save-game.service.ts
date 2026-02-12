import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { BaseCrudService } from '../../common/services/base-crud.service';
import { AssignClubDto } from './dto/assign-club.dto';
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
    // TODO: Na Fase 1, userId virá do contexto de autenticação (token)
    // Por enquanto, aceita userId opcional para testes sem autenticação
    return this.create({
      userId: payload.userId ?? null, // Será obrigatório na Fase 1
      clubId: payload.clubId ?? null,
      name: payload.name,
      currentDate: new Date().toISOString().slice(0, 10),
      currentSeasonYear: payload.currentSeasonYear ?? new Date().getFullYear(),
      isActive: true,
    });
  }

  listAll(pagination: PaginationDto) {
    return this.findPaginated(pagination, {
      relations: ['club', 'club.league', 'club.league.country'],
      order: { createdAt: 'DESC' },
    });
  }

  findByIdWithRelations(id: string) {
    return this.repository.findOne({
      where: { id },
      relations: ['club', 'club.league', 'club.league.country', 'user'],
    });
  }

  async assignClub(saveGameId: string, payload: AssignClubDto) {
    await this.repository.update(
      { id: saveGameId },
      { clubId: payload.clubId },
    );
    return this.findByIdWithRelations(saveGameId);
  }
}
