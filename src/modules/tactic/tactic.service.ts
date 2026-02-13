import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SaveGame } from '../save-game/entities/save-game.entity';
import { CreateTacticDto } from './dto/create-tactic.dto';
import { UpdateTacticDto } from './dto/update-tactic.dto';
import { Tactic } from './entities/tactic.entity';

@Injectable()
export class TacticService {
  constructor(
    @InjectRepository(Tactic)
    private readonly tacticRepository: Repository<Tactic>,
    @InjectRepository(SaveGame)
    private readonly saveGameRepository: Repository<SaveGame>,
  ) {}

  private async ensureSaveExists(saveGameId: string) {
    const saveGame = await this.saveGameRepository.findOneBy({
      id: saveGameId,
    });
    if (!saveGame) {
      throw new NotFoundException('Save não encontrado');
    }
  }

  async getBySave(saveGameId: string) {
    await this.ensureSaveExists(saveGameId);

    const existing = await this.tacticRepository.findOne({
      where: { saveGameId },
    });
    if (existing) {
      return existing;
    }

    return this.tacticRepository.save({
      saveGameId,
      formation: '4-3-3',
      lineup: {},
      instructions: {
        mentality: 'balanced',
        pressing: 'medium',
        tempo: 'normal',
      },
    });
  }

  async create(payload: CreateTacticDto) {
    await this.ensureSaveExists(payload.saveGameId);
    const existing = await this.tacticRepository.findOne({
      where: { saveGameId: payload.saveGameId },
    });

    this.validateUniqueLineup(payload.lineup ?? {});

    if (existing) {
      return this.update(existing.id, payload);
    }

    return this.tacticRepository.save({
      saveGameId: payload.saveGameId,
      formation: payload.formation,
      lineup: payload.lineup ?? {},
      instructions: {
        mentality: payload.mentality ?? 'balanced',
        pressing: payload.pressing ?? 'medium',
        tempo: payload.tempo ?? 'normal',
      },
    });
  }

  async update(id: string, payload: UpdateTacticDto) {
    const tactic = await this.tacticRepository.findOne({ where: { id } });
    if (!tactic) {
      throw new NotFoundException('Tática não encontrada');
    }

    const nextLineup = payload.lineup ?? tactic.lineup ?? {};
    this.validateUniqueLineup(nextLineup);

    const mergedInstructions = {
      mentality:
        payload.mentality ?? tactic.instructions?.mentality ?? 'balanced',
      pressing: payload.pressing ?? tactic.instructions?.pressing ?? 'medium',
      tempo: payload.tempo ?? tactic.instructions?.tempo ?? 'normal',
    };

    await this.tacticRepository.update(id, {
      formation: payload.formation ?? tactic.formation,
      lineup: nextLineup,
      instructions: mergedInstructions,
    });

    return this.tacticRepository.findOneBy({ id });
  }

  private validateUniqueLineup(lineup: Record<string, string>) {
    const players = Object.values(lineup).filter(
      (player) => player && player.trim().length > 0,
    );
    const uniquePlayers = new Set(players);

    if (players.length !== uniquePlayers.size) {
      throw new BadRequestException(
        'Um mesmo jogador não pode ocupar múltiplas posições',
      );
    }
  }
}
