import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Club } from '../club/entities/club.entity';
import { SaveGame } from '../save-game/entities/save-game.entity';
import { QueryAiFeedDto } from '../transfer/dto/query-ai-feed.dto';
import { TransferService } from '../transfer/transfer.service';

@Injectable()
export class CareerService {
  constructor(
    @InjectRepository(SaveGame)
    private readonly saveGameRepository: Repository<SaveGame>,
    @InjectRepository(Club)
    private readonly clubRepository: Repository<Club>,
    private readonly transferService: TransferService,
  ) {}

  private async ensureSave(saveGameId: string) {
    const save = await this.saveGameRepository.findOne({
      where: { id: saveGameId },
      relations: ['club', 'club.league', 'club.league.country'],
    });

    if (!save) {
      throw new NotFoundException('Save não encontrado');
    }

    return save;
  }

  async getOverview(saveGameId: string) {
    const save = await this.ensureSave(saveGameId);

    return {
      saveId: save.id,
      managerName: save.name,
      currentSeasonYear: save.currentSeasonYear,
      currentDate: save.currentDate,
      currentClub: save.club,
      reputation: Math.min(99, 50 + Math.round((Number(save.club?.budget ?? 0) || 0) / 10_000_000)),
      status: save.clubId ? 'em-atividade' : 'sem-clube',
    };
  }

  async getHistory(saveGameId: string) {
    const save = await this.ensureSave(saveGameId);

    const history = save.club
      ? [
          {
            clubId: save.club.id,
            clubName: save.club.name,
            countryName: save.club.league?.country?.name ?? null,
            leagueName: save.club.league?.name ?? null,
            fromDate: save.createdAt,
            toDate: null,
            role: 'Manager',
          },
        ]
      : [];

    return {
      saveId: save.id,
      history,
    };
  }

  async getOffers(saveGameId: string, query: QueryAiFeedDto) {
    await this.ensureSave(saveGameId);

    return this.transferService.listAiJobOffers({
      saveGameId,
      page: query.page,
      limit: query.limit,
    });
  }

  async acceptOffer(saveGameId: string, clubId: string) {
    const save = await this.ensureSave(saveGameId);
    const club = await this.clubRepository.findOne({
      where: { id: clubId },
      relations: ['league', 'league.country'],
    });

    if (!club) {
      throw new NotFoundException('Clube da proposta não encontrado');
    }

    if (save.clubId === club.id) {
      throw new BadRequestException('Você já está neste clube');
    }

    save.clubId = club.id;
    save.club = club;
    await this.saveGameRepository.save(save);

    return {
      success: true,
      message: `Você aceitou a proposta para treinar o ${club.name}.`,
      club,
    };
  }

  async resign(saveGameId: string) {
    const save = await this.ensureSave(saveGameId);

    if (!save.clubId) {
      throw new BadRequestException('Você já está sem clube');
    }

    save.clubId = null;
    save.club = null;
    await this.saveGameRepository.save(save);

    return {
      success: true,
      message: 'Você pediu demissão e está sem clube no momento.',
    };
  }
}
