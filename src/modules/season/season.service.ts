import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Club } from '../club/entities/club.entity';
import { CompetitionService } from '../competition/competition.service';
import { CompetitionSeason } from '../competition/entities/competition-season.entity';
import { Fixture, FixtureStatus } from '../competition/entities/fixture.entity';
import { Player } from '../player/entities/player.entity';
import { SaveGame } from '../save-game/entities/save-game.entity';
import { TransferService } from '../transfer/transfer.service';
import { RenewContractDto } from './dto/renew-contract.dto';
import { PlayerAgingService } from './services/player-aging.service';
import { PlayerEvolutionService } from './services/player-evolution.service';
import { PromotionRelegationService } from './services/promotion-relegation.service';
import { RetirementService } from './services/retirement.service';
import { YouthAcademyService } from './services/youth-academy.service';

@Injectable()
export class SeasonService {
  constructor(
    @InjectRepository(SaveGame)
    private readonly saveGameRepository: Repository<SaveGame>,
    @InjectRepository(Player)
    private readonly playerRepository: Repository<Player>,
    @InjectRepository(Club)
    private readonly clubRepository: Repository<Club>,
    @InjectRepository(Fixture)
    private readonly fixtureRepository: Repository<Fixture>,
    @InjectRepository(CompetitionSeason)
    private readonly competitionSeasonRepository: Repository<CompetitionSeason>,
    private readonly competitionService: CompetitionService,
    private readonly playerEvolutionService: PlayerEvolutionService,
    private readonly playerAgingService: PlayerAgingService,
    private readonly retirementService: RetirementService,
    private readonly promotionRelegationService: PromotionRelegationService,
    private readonly youthAcademyService: YouthAcademyService,
    private readonly transferService: TransferService,
  ) {}

  private toDateIso(value: Date) {
    return value.toISOString().slice(0, 10);
  }

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

  private async processEndOfSeason(save: SaveGame) {
    if (!save.clubId) {
      return {
        playersProcessed: 0,
        retirees: 0,
        retireeNames: [] as string[],
        youthGenerated: 0,
        youthRevealed: [] as Array<{
          name: string;
          position: string;
          overall: number;
          potential: number;
        }>,
        promotionRelegation: this.promotionRelegationService.process(),
      };
    }

    const squad = await this.playerRepository.find({
      where: { clubId: save.clubId },
      order: { overall: 'DESC' },
    });

    this.playerAgingService.apply(squad);
    this.playerEvolutionService.apply(squad);

    const retirees = this.retirementService.selectRetirees(squad);
    const retireeIds = new Set(retirees.map((player) => player.id));
    const activePlayers = squad.filter((player) => !retireeIds.has(player.id));

    if (activePlayers.length > 0) {
      await this.playerRepository.save(activePlayers);
    }

    if (retirees.length > 0) {
      await this.playerRepository.remove(retirees);
    }

    const nationality = save.club?.league?.country?.code ?? 'BRA';
    const prospects = this.youthAcademyService.generateProspects({
      clubId: save.clubId,
      nationality,
      seasonYear: save.currentSeasonYear + 1,
      amount: 2,
    });

    if (prospects.length > 0) {
      await this.playerRepository.save(prospects);
    }

    return {
      playersProcessed: squad.length,
      retirees: retirees.length,
      retireeNames: retirees.map((player) => player.name),
      youthGenerated: prospects.length,
      youthRevealed: prospects.map((player) => ({
        name: player.name,
        position: player.position,
        overall: player.overall,
        potential: player.potential,
      })),
      promotionRelegation: this.promotionRelegationService.process(),
    };
  }

  async getLastSeasonSummary(saveGameId: string) {
    const save = await this.ensureSave(saveGameId);
    return {
      saveId: save.id,
      summary: save.lastSeasonSummary,
    };
  }

  async listYouthPlayers(saveGameId: string) {
    const save = await this.ensureSave(saveGameId);
    const promotedYouthPlayerIds = this.getPromotedYouthPlayerIds(save);

    if (!save.clubId) {
      return {
        saveId: save.id,
        players: [],
      };
    }

    const players = await this.playerRepository
      .createQueryBuilder('player')
      .where('player.clubId = :clubId', { clubId: save.clubId })
      .andWhere('player.age <= :maxAge', { maxAge: 21 })
      .andWhere(
        promotedYouthPlayerIds.length > 0
          ? 'player.id NOT IN (:...promotedIds)'
          : '1 = 1',
        { promotedIds: promotedYouthPlayerIds },
      )
      .orderBy('player.potential', 'DESC')
      .addOrderBy('player.overall', 'DESC')
      .getMany();

    return {
      saveId: save.id,
      players,
    };
  }

  async promoteYouthPlayer(saveGameId: string, playerId: string) {
    const save = await this.ensureSave(saveGameId);
    if (!save.clubId) {
      throw new BadRequestException('Save sem clube selecionado');
    }

    const player = await this.playerRepository.findOne({
      where: { id: playerId },
    });
    if (!player || player.clubId !== save.clubId) {
      throw new NotFoundException(
        'Jogador da base não encontrado no clube do save',
      );
    }

    if (player.age > 23) {
      throw new BadRequestException(
        'Jogador não elegível para promoção da base',
      );
    }

    player.overall = Math.min(99, player.overall + 2);
    player.value = Math.round(player.value * 1.2);
    player.salary = Math.round(player.salary * 1.3);
    const savedPlayer = await this.playerRepository.save(player);
    await this.markYouthAsPromoted(save, savedPlayer.id);

    return {
      success: true,
      message: `${savedPlayer.name} promovido ao elenco principal.`,
      player: savedPlayer,
    };
  }

  async releaseYouthPlayer(saveGameId: string, playerId: string) {
    const save = await this.ensureSave(saveGameId);
    if (!save.clubId) {
      throw new BadRequestException('Save sem clube selecionado');
    }

    const player = await this.playerRepository.findOne({
      where: { id: playerId },
    });
    if (!player || player.clubId !== save.clubId) {
      throw new NotFoundException(
        'Jogador da base não encontrado no clube do save',
      );
    }

    await this.playerRepository.delete(player.id);

    return {
      success: true,
      message: `${player.name} dispensado da base.`,
    };
  }

  async listExpiringContracts(saveGameId: string) {
    const save = await this.ensureSave(saveGameId);

    if (!save.clubId) {
      return {
        saveId: save.id,
        players: [],
      };
    }

    const players = await this.playerRepository
      .createQueryBuilder('player')
      .where('player.clubId = :clubId', { clubId: save.clubId })
      .andWhere('player.contractYearsRemaining <= :threshold', { threshold: 1 })
      .orderBy('player.overall', 'DESC')
      .addOrderBy('player.age', 'ASC')
      .getMany();

    return {
      saveId: save.id,
      players,
    };
  }

  async renewContract(
    saveGameId: string,
    playerId: string,
    payload: RenewContractDto,
  ) {
    const save = await this.ensureSave(saveGameId);

    if (!save.clubId) {
      throw new BadRequestException('Save sem clube selecionado');
    }

    const player = await this.playerRepository.findOne({
      where: { id: playerId },
    });
    if (!player || player.clubId !== save.clubId) {
      throw new NotFoundException('Jogador não encontrado no clube do save');
    }

    const years = payload.years ?? 2;
    const salaryIncreasePercent = payload.salaryIncreasePercent ?? 12;

    player.contractYearsRemaining = years;
    player.salary = Math.max(
      0,
      Math.round(player.salary * (1 + salaryIncreasePercent / 100)),
    );

    const savedPlayer = await this.playerRepository.save(player);

    return {
      success: true,
      message: `Contrato de ${savedPlayer.name} renovado por ${years} ano(s).`,
      player: savedPlayer,
    };
  }

  async advanceDay(saveGameId: string) {
    const save = await this.ensureSave(saveGameId);
    const current = new Date(`${save.currentDate}T00:00:00.000Z`);
    current.setDate(current.getDate() + 1);

    save.currentDate = this.toDateIso(current);
    await this.saveGameRepository.save(save);

    let aiTransfers = {
      createdOffers: 0,
      resolvedOffers: 0,
      message: 'Ciclo IA não executado.',
    };

    if (save.clubId) {
      try {
        const result = await this.transferService.runAiTransferCycle({
          saveGameId,
          offers: 4,
        });
        aiTransfers = {
          createdOffers: result.createdOffers,
          resolvedOffers: result.resolvedOffers,
          message: 'Ciclo IA executado com sucesso.',
        };
      } catch {
        aiTransfers = {
          createdOffers: 0,
          resolvedOffers: 0,
          message: 'Ciclo IA indisponível neste avanço de dia.',
        };
      }
    }

    return {
      saveId: save.id,
      currentDate: save.currentDate,
      seasonYear: save.currentSeasonYear,
      aiTransfers,
    };
  }

  async advanceToNextMatch(saveGameId: string) {
    const save = await this.ensureSave(saveGameId);

    if (!save.clubId) {
      return {
        saveId: save.id,
        currentDate: save.currentDate,
        nextFixture: null,
        message: 'Save sem clube selecionado.',
      };
    }

    const nextFixture = await this.fixtureRepository
      .createQueryBuilder('fixture')
      .innerJoin(CompetitionSeason, 'season', 'season.id = fixture.seasonId')
      .where('season.saveGameId = :saveGameId', { saveGameId })
      .andWhere('fixture.status = :status', { status: FixtureStatus.SCHEDULED })
      .andWhere(
        '(fixture.homeClubId = :clubId OR fixture.awayClubId = :clubId)',
        {
          clubId: save.clubId,
        },
      )
      .andWhere('fixture.matchDate >= :currentDate', {
        currentDate: save.currentDate,
      })
      .orderBy('fixture.matchDate', 'ASC')
      .addOrderBy('fixture.round', 'ASC')
      .getOne();

    if (!nextFixture) {
      return {
        saveId: save.id,
        currentDate: save.currentDate,
        nextFixture: null,
        message: 'Não há próximo jogo agendado.',
      };
    }

    save.currentDate = nextFixture.matchDate;
    await this.saveGameRepository.save(save);

    return {
      saveId: save.id,
      currentDate: save.currentDate,
      nextFixture: {
        fixtureId: nextFixture.id,
        seasonId: nextFixture.seasonId,
        matchDate: nextFixture.matchDate,
        round: nextFixture.round,
      },
    };
  }

  async advanceSeason(saveGameId: string) {
    const save = await this.ensureSave(saveGameId);
    const endSeasonSummary = await this.processEndOfSeason(save);
    const promotedYouthPlayerIds = this.getPromotedYouthPlayerIds(save);

    if (save.clubId) {
      await this.playerRepository
        .createQueryBuilder()
        .update(Player)
        .set({
          contractYearsRemaining: () =>
            'GREATEST(contract_years_remaining - 1, 0)',
        })
        .where('club_id = :clubId', { clubId: save.clubId })
        .execute();
    }

    const endedContractPlayers = save.clubId
      ? await this.playerRepository.find({
          where: {
            clubId: save.clubId,
            contractYearsRemaining: 0,
          },
          order: { overall: 'DESC', age: 'ASC' },
        })
      : [];

    if (endedContractPlayers.length > 0) {
      endedContractPlayers.forEach((player) => {
        player.clubId = null;
      });
      await this.playerRepository.save(endedContractPlayers);
    }

    const nextSeasonYear = save.currentSeasonYear + 1;
    const nextDate = new Date(`${save.currentDate}T00:00:00.000Z`);
    nextDate.setFullYear(nextSeasonYear);

    save.currentSeasonYear = nextSeasonYear;
    save.currentDate = this.toDateIso(nextDate);
    save.lastSeasonSummary = {
      seasonYear: nextSeasonYear - 1,
      playersProcessed: endSeasonSummary.playersProcessed,
      retirees: endSeasonSummary.retirees,
      retireeNames: endSeasonSummary.retireeNames,
      youthGenerated: endSeasonSummary.youthGenerated,
      youthRevealed: endSeasonSummary.youthRevealed,
      endedContracts: endedContractPlayers.map((player) => player.name),
      promotionRelegation: endSeasonSummary.promotionRelegation,
      promotedYouthPlayerIds,
    };

    await this.saveGameRepository.save(save);
    await this.competitionService.finishPreviousSeasons(
      save.id,
      nextSeasonYear,
    );
    await this.competitionService.setupSaveCompetitions(save.id);

    return {
      saveId: save.id,
      seasonYear: save.currentSeasonYear,
      currentDate: save.currentDate,
      endedContracts: endedContractPlayers.map((player) => player.name),
      endSeasonSummary,
    };
  }

  private getPromotedYouthPlayerIds(save: SaveGame) {
    return save.lastSeasonSummary?.promotedYouthPlayerIds ?? [];
  }

  private async markYouthAsPromoted(save: SaveGame, playerId: string) {
    const promotedIds = new Set(this.getPromotedYouthPlayerIds(save));
    promotedIds.add(playerId);

    save.lastSeasonSummary = {
      seasonYear: save.lastSeasonSummary?.seasonYear ?? save.currentSeasonYear,
      playersProcessed: save.lastSeasonSummary?.playersProcessed ?? 0,
      retirees: save.lastSeasonSummary?.retirees ?? 0,
      retireeNames: save.lastSeasonSummary?.retireeNames ?? [],
      youthGenerated: save.lastSeasonSummary?.youthGenerated ?? 0,
      youthRevealed: save.lastSeasonSummary?.youthRevealed ?? [],
      endedContracts: save.lastSeasonSummary?.endedContracts ?? [],
      promotionRelegation: save.lastSeasonSummary?.promotionRelegation ?? {
        promoted: [],
        relegated: [],
        note: 'Sem dados',
      },
      careerHistory: save.lastSeasonSummary?.careerHistory,
      careerReputation: save.lastSeasonSummary?.careerReputation,
      promotedYouthPlayerIds: Array.from(promotedIds),
    };

    await this.saveGameRepository.save(save);
  }
}
