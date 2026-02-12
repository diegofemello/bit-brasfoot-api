import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompetitionService } from '../competition/competition.service';
import { SaveGame } from '../save-game/entities/save-game.entity';

@Injectable()
export class SeasonService {
  constructor(
    @InjectRepository(SaveGame)
    private readonly saveGameRepository: Repository<SaveGame>,
    private readonly competitionService: CompetitionService,
  ) {}

  private toDateIso(value: Date) {
    return value.toISOString().slice(0, 10);
  }

  async advanceSeason(saveGameId: string) {
    const save = await this.saveGameRepository.findOne({
      where: { id: saveGameId },
    });

    if (!save) {
      throw new NotFoundException('Save não encontrado');
    }

    const nextSeasonYear = save.currentSeasonYear + 1;
    const nextDate = new Date(`${save.currentDate}T00:00:00.000Z`);
    nextDate.setFullYear(nextSeasonYear);

    save.currentSeasonYear = nextSeasonYear;
    save.currentDate = this.toDateIso(nextDate);

    await this.saveGameRepository.save(save);
    await this.competitionService.finishPreviousSeasons(save.id, nextSeasonYear);
    await this.competitionService.setupSaveCompetitions(save.id);

    return {
      saveId: save.id,
      seasonYear: save.currentSeasonYear,
      currentDate: save.currentDate,
    };
  }
}
