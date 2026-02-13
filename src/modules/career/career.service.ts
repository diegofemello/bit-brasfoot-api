import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Club } from '../club/entities/club.entity';
import { SaveGame } from '../save-game/entities/save-game.entity';
import { QueryAiFeedDto } from '../transfer/dto/query-ai-feed.dto';
import { TransferService } from '../transfer/transfer.service';

type CareerHistoryItem = {
  clubId: string;
  clubName: string;
  countryName: string | null;
  leagueName: string | null;
  fromDate: string;
  toDate: string | null;
  role: string;
};

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

  private dateOnly(value: Date | string) {
    if (value instanceof Date) {
      return value.toISOString().slice(0, 10);
    }

    return String(value).slice(0, 10);
  }

  private extractCareerHistory(save: SaveGame): CareerHistoryItem[] {
    return Array.isArray(save.lastSeasonSummary?.careerHistory)
      ? [...(save.lastSeasonSummary?.careerHistory as CareerHistoryItem[])]
      : [];
  }

  private ensureSeedHistory(save: SaveGame, history: CareerHistoryItem[]) {
    if (history.length > 0) {
      return history;
    }

    if (!save.club) {
      return history;
    }

    return [
      {
        clubId: save.club.id,
        clubName: save.club.name,
        countryName: save.club.league?.country?.name ?? null,
        leagueName: save.club.league?.name ?? null,
        fromDate: this.dateOnly(save.createdAt),
        toDate: null,
        role: 'Manager',
      },
    ];
  }

  private persistCareerMeta(
    save: SaveGame,
    history: CareerHistoryItem[],
    reputation: number,
  ) {
    save.lastSeasonSummary = {
      ...(save.lastSeasonSummary ?? {}),
      careerHistory: history,
      careerReputation: reputation,
    } as SaveGame['lastSeasonSummary'];
  }

  async getOverview(saveGameId: string) {
    const save = await this.ensureSave(saveGameId);
    const storedReputation = save.lastSeasonSummary?.careerReputation;
    const liveReputation = Math.min(
      99,
      50 + Math.round((Number(save.club?.budget ?? 0) || 0) / 10_000_000),
    );
    const reputation = save.club ? liveReputation : (storedReputation ?? 50);

    return {
      saveId: save.id,
      managerName: save.name,
      currentSeasonYear: save.currentSeasonYear,
      currentDate: save.currentDate,
      currentClub: save.club,
      reputation,
      status: save.clubId ? 'em-atividade' : 'sem-clube',
    };
  }

  async getHistory(saveGameId: string) {
    const save = await this.ensureSave(saveGameId);
    const history = this.ensureSeedHistory(
      save,
      this.extractCareerHistory(save),
    );

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

    let history = this.ensureSeedHistory(save, this.extractCareerHistory(save));
    const today = this.dateOnly(new Date());
    const currentOpenIndex = history.findIndex((item) => item.toDate === null);

    if (currentOpenIndex >= 0) {
      history[currentOpenIndex] = {
        ...history[currentOpenIndex],
        toDate: today,
      };
    }

    history = [
      ...history,
      {
        clubId: club.id,
        clubName: club.name,
        countryName: club.league?.country?.name ?? null,
        leagueName: club.league?.name ?? null,
        fromDate: today,
        toDate: null,
        role: 'Manager',
      },
    ];

    const updatedReputation = Math.min(
      99,
      50 + Math.round((Number(club.budget) || 0) / 10_000_000),
    );
    this.persistCareerMeta(save, history, updatedReputation);

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

    const history = this.ensureSeedHistory(
      save,
      this.extractCareerHistory(save),
    );
    const today = this.dateOnly(new Date());
    const currentOpenIndex = history.findIndex((item) => item.toDate === null);

    if (currentOpenIndex >= 0) {
      history[currentOpenIndex] = {
        ...history[currentOpenIndex],
        toDate: today,
      };
    }

    const currentReputation =
      save.lastSeasonSummary?.careerReputation ??
      Math.min(
        99,
        50 + Math.round((Number(save.club?.budget ?? 0) || 0) / 10_000_000),
      );
    this.persistCareerMeta(save, history, currentReputation);

    save.clubId = null;
    save.club = null;
    await this.saveGameRepository.save(save);

    return {
      success: true,
      message: 'Você pediu demissão e está sem clube no momento.',
    };
  }
}
