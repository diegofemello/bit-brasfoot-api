import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { BaseCrudService } from '../../common/services/base-crud.service';
import { Club } from '../club/entities/club.entity';
import { AssignClubDto } from './dto/assign-club.dto';
import { CreateSaveGameDto } from './dto/create-save-game.dto';
import { UpdateSaveGameDto } from './dto/update-save-game.dto';
import { SaveGame } from './entities/save-game.entity';

@Injectable()
export class SaveGameService extends BaseCrudService<SaveGame> {
  constructor(
    @InjectRepository(SaveGame)
    repository: Repository<SaveGame>,
    @InjectRepository(Club)
    private readonly clubRepository: Repository<Club>,
  ) {
    super(repository);
  }

  async createSave(payload: CreateSaveGameDto) {
    // TODO: Na Fase 1, userId virá do contexto de autenticação (token)
    // Por enquanto, aceita userId opcional para testes sem autenticação
    if (payload.clubId) {
      const club = await this.clubRepository.findOneBy({ id: payload.clubId });
      if (!club) {
        throw new NotFoundException('Clube informado não existe');
      }
    }

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

  async findByIdWithRelations(id: string) {
    const saveGame = await this.repository.findOne({
      where: { id },
      relations: ['club', 'club.league', 'club.league.country', 'user'],
    });

    if (!saveGame) {
      throw new NotFoundException('Save não encontrado');
    }

    return saveGame;
  }

  async assignClub(saveGameId: string, payload: AssignClubDto) {
    await this.findByIdWithRelations(saveGameId);
    const club = await this.clubRepository.findOneBy({ id: payload.clubId });

    if (!club) {
      throw new NotFoundException('Clube informado não existe');
    }

    await this.repository.update(
      { id: saveGameId },
      { clubId: payload.clubId },
    );

    return this.findByIdWithRelations(saveGameId);
  }

  async updateSave(saveGameId: string, payload: UpdateSaveGameDto) {
    await this.findByIdWithRelations(saveGameId);

    await this.repository.update(
      { id: saveGameId },
      {
        name: payload.name,
        currentSeasonYear: payload.currentSeasonYear,
        isActive: payload.isActive,
      },
    );

    return this.findByIdWithRelations(saveGameId);
  }

  async removeSave(saveGameId: string) {
    await this.findByIdWithRelations(saveGameId);
    await this.repository.delete(saveGameId);

    return {
      success: true,
      message: 'Save removido com sucesso',
    };
  }
}
