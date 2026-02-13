import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Club } from '../club/entities/club.entity';
import { CompetitionSeason } from '../competition/entities/competition-season.entity';
import { CompetitionType } from '../competition/entities/competition.entity';
import {
  Fixture,
  FixtureStage,
  FixtureStatus,
  KnockoutRound,
} from '../competition/entities/fixture.entity';
import {
  Standing,
  StandingStage,
} from '../competition/entities/standing.entity';
import {
  MatchEvent,
  MatchEventType,
} from '../match/entities/match-event.entity';
import { Match } from '../match/entities/match.entity';
import { Player } from '../player/entities/player.entity';
import { SaveGame } from '../save-game/entities/save-game.entity';

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(SaveGame)
    private readonly saveGameRepository: Repository<SaveGame>,
    @InjectRepository(CompetitionSeason)
    private readonly seasonRepository: Repository<CompetitionSeason>,
    @InjectRepository(Standing)
    private readonly standingRepository: Repository<Standing>,
    @InjectRepository(Fixture)
    private readonly fixtureRepository: Repository<Fixture>,
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
    @InjectRepository(MatchEvent)
    private readonly matchEventRepository: Repository<MatchEvent>,
    @InjectRepository(Player)
    private readonly playerRepository: Repository<Player>,
    @InjectRepository(Club)
    private readonly clubRepository: Repository<Club>,
  ) {}

  private async ensureSave(saveGameId: string) {
    const save = await this.saveGameRepository.findOne({
      where: { id: saveGameId },
    });
    if (!save) {
      throw new NotFoundException('Save não encontrado');
    }
    return save;
  }

  private async resolveSeason(saveGameId: string, seasonId?: string) {
    if (seasonId) {
      const season = await this.seasonRepository.findOne({
        where: { id: seasonId, saveGameId },
        relations: ['competition'],
      });
      if (!season) {
        throw new NotFoundException('Temporada não encontrada para este save');
      }
      return season;
    }

    const season = await this.seasonRepository.findOne({
      where: { saveGameId },
      relations: ['competition'],
      order: { seasonYear: 'DESC', createdAt: 'DESC' },
    });

    return season ?? null;
  }

  private toNumber(value: unknown) {
    return Number(value ?? 0);
  }

  async getSeasonStats(
    saveGameId: string,
    options?: {
      seasonId?: string;
      limit?: number;
    },
  ) {
    await this.ensureSave(saveGameId);
    const season = await this.resolveSeason(saveGameId, options?.seasonId);
    const limit = Math.min(30, Math.max(5, options?.limit ?? 10));

    if (!season) {
      return {
        saveId: saveGameId,
        seasonId: null,
        seasonYear: null,
        competition: null,
        progress: {
          playedFixtures: 0,
          totalFixtures: 0,
        },
        topScorers: [],
        topAssists: [],
        tableLeaders: [],
      };
    }

    const topScorersRaw = await this.matchEventRepository
      .createQueryBuilder('event')
      .innerJoin('event.match', 'match')
      .innerJoin('match.fixture', 'fixture')
      .innerJoin('event.player', 'player')
      .leftJoin('player.club', 'club')
      .where('fixture.seasonId = :seasonId', { seasonId: season.id })
      .andWhere('event.type = :goalType', { goalType: MatchEventType.GOAL })
      .andWhere('event.playerId IS NOT NULL')
      .select('event.playerId', 'playerId')
      .addSelect('player.name', 'playerName')
      .addSelect('player.potential', 'playerPotential')
      .addSelect('club.name', 'clubName')
      .addSelect('COUNT(event.id)', 'goals')
      .groupBy('event.playerId')
      .addGroupBy('player.name')
      .addGroupBy('player.potential')
      .addGroupBy('club.name')
      .orderBy('goals', 'DESC')
      .addOrderBy('player.name', 'ASC')
      .limit(limit)
      .getRawMany<{
        playerId: string;
        playerName: string;
        playerPotential: string;
        clubName: string | null;
        goals: string;
      }>();

    const topScorers = topScorersRaw.map((row, index) => ({
      position: index + 1,
      playerId: row.playerId,
      playerName: row.playerName,
      clubName: row.clubName ?? 'Sem clube',
      goals: this.toNumber(row.goals),
    }));

    const topAssists = topScorersRaw
      .map((row) => {
        const goals = this.toNumber(row.goals);
        const potential = this.toNumber(row.playerPotential);
        return {
          playerId: row.playerId,
          playerName: row.playerName,
          clubName: row.clubName ?? 'Sem clube',
          assists: Math.max(0, Math.floor(goals * 0.6 + (potential - 70) / 10)),
        };
      })
      .sort(
        (a, b) =>
          b.assists - a.assists || a.playerName.localeCompare(b.playerName),
      )
      .slice(0, limit)
      .map((row, index) => ({ ...row, position: index + 1 }));

    const standings = await this.standingRepository.find({
      where: { seasonId: season.id, stage: StandingStage.LEAGUE },
      relations: ['club'],
      order: {
        points: 'DESC',
        goalDifference: 'DESC',
        goalsFor: 'DESC',
        club: { name: 'ASC' },
      },
      take: 5,
    });

    const seasonFixturesCount = await this.fixtureRepository.count({
      where: { seasonId: season.id },
    });
    const playedFixturesCount = await this.fixtureRepository.count({
      where: { seasonId: season.id, status: FixtureStatus.PLAYED },
    });

    return {
      saveId: saveGameId,
      seasonId: season.id,
      seasonYear: season.seasonYear,
      competition: {
        id: season.competitionId,
        name: season.competition.name,
        type: season.competition.type,
      },
      progress: {
        playedFixtures: playedFixturesCount,
        totalFixtures: seasonFixturesCount,
      },
      topScorers,
      topAssists,
      tableLeaders: standings.map((standing, index) => ({
        position: index + 1,
        clubId: standing.clubId,
        clubName: standing.club?.name ?? 'Clube',
        points: standing.points,
        played: standing.played,
        goalDifference: standing.goalDifference,
      })),
    };
  }

  async getPlayerRankings(saveGameId: string, limitInput?: number) {
    await this.ensureSave(saveGameId);
    const limit = Math.min(50, Math.max(10, limitInput ?? 20));

    const seasons = await this.seasonRepository.find({
      where: { saveGameId },
      select: ['id'],
    });

    const seasonIds = seasons.map((season) => season.id);
    const standings = seasonIds.length
      ? await this.standingRepository.find({
          where: { seasonId: In(seasonIds) },
          select: ['clubId'],
        })
      : [];

    const clubIds = Array.from(new Set(standings.map((item) => item.clubId)));

    const players = await this.playerRepository.find({
      where:
        clubIds.length > 0
          ? { clubId: In(clubIds) }
          : {
              clubId: In(
                (await this.clubRepository.find({ select: ['id'] })).map(
                  (club) => club.id,
                ),
              ),
            },
      relations: ['club'],
      take: Math.max(limit * 4, 100),
      order: {
        overall: 'DESC',
        potential: 'DESC',
        name: 'ASC',
      },
    });

    const mapPlayer = (player: Player, position: number) => ({
      position,
      playerId: player.id,
      name: player.name,
      clubId: player.clubId,
      clubName: player.club?.name ?? 'Sem clube',
      overall: player.overall,
      potential: player.potential,
      value: this.toNumber(player.value),
    });

    const byOverall = [...players]
      .sort(
        (a, b) =>
          b.overall - a.overall ||
          b.potential - a.potential ||
          a.name.localeCompare(b.name),
      )
      .slice(0, limit)
      .map((player, index) => mapPlayer(player, index + 1));

    const byPotential = [...players]
      .sort(
        (a, b) =>
          b.potential - a.potential ||
          b.overall - a.overall ||
          a.name.localeCompare(b.name),
      )
      .slice(0, limit)
      .map((player, index) => mapPlayer(player, index + 1));

    const byMarketValue = [...players]
      .sort(
        (a, b) =>
          this.toNumber(b.value) - this.toNumber(a.value) ||
          b.overall - a.overall,
      )
      .slice(0, limit)
      .map((player, index) => mapPlayer(player, index + 1));

    return {
      saveId: saveGameId,
      rankings: {
        byOverall,
        byPotential,
        byMarketValue,
      },
    };
  }

  async getChampionsHistory(saveGameId: string) {
    await this.ensureSave(saveGameId);

    const seasons = await this.seasonRepository.find({
      where: { saveGameId },
      relations: ['competition'],
      order: { seasonYear: 'DESC', createdAt: 'DESC' },
    });

    const champions: Array<{
      seasonId: string;
      seasonYear: number;
      competitionId: string;
      competitionName: string;
      competitionType: CompetitionType;
      championClubId: string;
      championClubName: string;
      source: 'table' | 'final';
    }> = [];

    for (const season of seasons) {
      if (season.competition.type === CompetitionType.LEAGUE) {
        const champion = await this.standingRepository.findOne({
          where: { seasonId: season.id, stage: StandingStage.LEAGUE },
          relations: ['club'],
          order: {
            points: 'DESC',
            goalDifference: 'DESC',
            goalsFor: 'DESC',
            club: { name: 'ASC' },
          },
        });

        if (champion?.club) {
          champions.push({
            seasonId: season.id,
            seasonYear: season.seasonYear,
            competitionId: season.competitionId,
            competitionName: season.competition.name,
            competitionType: season.competition.type,
            championClubId: champion.clubId,
            championClubName: champion.club.name,
            source: 'table',
          });
        }
        continue;
      }

      const finalFixture = await this.fixtureRepository.findOne({
        where: {
          seasonId: season.id,
          stage: FixtureStage.KNOCKOUT,
          knockoutRound: KnockoutRound.FINAL,
          status: FixtureStatus.PLAYED,
        },
        relations: ['homeClub', 'awayClub'],
        order: {
          round: 'DESC',
          matchDate: 'DESC',
        },
      });

      if (!finalFixture?.homeClub || !finalFixture.awayClub) {
        continue;
      }

      const homeScore = this.toNumber(finalFixture.homeScore);
      const awayScore = this.toNumber(finalFixture.awayScore);
      const homeWins = homeScore >= awayScore;
      const championClub = homeWins
        ? finalFixture.homeClub
        : finalFixture.awayClub;

      champions.push({
        seasonId: season.id,
        seasonYear: season.seasonYear,
        competitionId: season.competitionId,
        competitionName: season.competition.name,
        competitionType: season.competition.type,
        championClubId: championClub.id,
        championClubName: championClub.name,
        source: 'final',
      });
    }

    const titlesByClub = champions.reduce<
      Record<string, { clubId: string; clubName: string; titles: number }>
    >((acc, item) => {
      const current = acc[item.championClubId] ?? {
        clubId: item.championClubId,
        clubName: item.championClubName,
        titles: 0,
      };
      current.titles += 1;
      acc[item.championClubId] = current;
      return acc;
    }, {});

    return {
      saveId: saveGameId,
      champions,
      titleRanking: Object.values(titlesByClub).sort(
        (a, b) => b.titles - a.titles || a.clubName.localeCompare(b.clubName),
      ),
    };
  }

  async getRecords(saveGameId: string) {
    await this.ensureSave(saveGameId);

    const seasons = await this.seasonRepository.find({
      where: { saveGameId },
      relations: ['competition'],
      order: { seasonYear: 'DESC' },
    });

    const seasonIds = seasons.map((season) => season.id);
    if (seasonIds.length === 0) {
      return {
        saveId: saveGameId,
        records: {},
      };
    }

    const matches = await this.matchRepository.find({
      relations: ['homeClub', 'awayClub', 'fixture'],
      where: {
        fixture: {
          seasonId: In(seasonIds),
        },
      },
      order: { createdAt: 'DESC' },
      take: 1000,
    });

    let biggestWin: {
      matchId: string;
      score: string;
      winnerClubName: string;
      loserClubName: string;
      goalDifference: number;
    } | null = null;

    let highestScoringMatch: {
      matchId: string;
      score: string;
      totalGoals: number;
      homeClubName: string;
      awayClubName: string;
    } | null = null;

    for (const match of matches) {
      const homeScore = this.toNumber(match.homeScore);
      const awayScore = this.toNumber(match.awayScore);
      const goalDifference = Math.abs(homeScore - awayScore);
      const totalGoals = homeScore + awayScore;

      if (!biggestWin || goalDifference > biggestWin.goalDifference) {
        const homeWins = homeScore >= awayScore;
        biggestWin = {
          matchId: match.id,
          score: `${homeScore} x ${awayScore}`,
          winnerClubName: homeWins
            ? (match.homeClub?.name ?? 'Mandante')
            : (match.awayClub?.name ?? 'Visitante'),
          loserClubName: homeWins
            ? (match.awayClub?.name ?? 'Visitante')
            : (match.homeClub?.name ?? 'Mandante'),
          goalDifference,
        };
      }

      if (!highestScoringMatch || totalGoals > highestScoringMatch.totalGoals) {
        highestScoringMatch = {
          matchId: match.id,
          score: `${homeScore} x ${awayScore}`,
          totalGoals,
          homeClubName: match.homeClub?.name ?? 'Mandante',
          awayClubName: match.awayClub?.name ?? 'Visitante',
        };
      }
    }

    const bestCampaignRaw = await this.standingRepository
      .createQueryBuilder('standing')
      .innerJoin('standing.season', 'season')
      .innerJoin('season.competition', 'competition')
      .innerJoin('standing.club', 'club')
      .where('season.saveGameId = :saveGameId', { saveGameId })
      .andWhere('standing.stage = :stage', { stage: StandingStage.LEAGUE })
      .select('standing.points', 'points')
      .addSelect('standing.wins', 'wins')
      .addSelect('standing.draws', 'draws')
      .addSelect('standing.losses', 'losses')
      .addSelect('standing.goalDifference', 'goalDifference')
      .addSelect('club.name', 'clubName')
      .addSelect('season.seasonYear', 'seasonYear')
      .addSelect('competition.name', 'competitionName')
      .orderBy('standing.points', 'DESC')
      .addOrderBy('standing.goalDifference', 'DESC')
      .addOrderBy('standing.wins', 'DESC')
      .limit(1)
      .getRawOne<{
        points: string;
        wins: string;
        draws: string;
        losses: string;
        goalDifference: string;
        clubName: string;
        seasonYear: string;
        competitionName: string;
      }>();

    const topScorerSeasonRaw = await this.matchEventRepository
      .createQueryBuilder('event')
      .innerJoin('event.match', 'match')
      .innerJoin('match.fixture', 'fixture')
      .innerJoin('fixture.season', 'season')
      .innerJoin('event.player', 'player')
      .leftJoin('player.club', 'club')
      .where('season.saveGameId = :saveGameId', { saveGameId })
      .andWhere('event.type = :goalType', { goalType: MatchEventType.GOAL })
      .andWhere('event.playerId IS NOT NULL')
      .select('player.id', 'playerId')
      .addSelect('player.name', 'playerName')
      .addSelect('club.name', 'clubName')
      .addSelect('season.seasonYear', 'seasonYear')
      .addSelect('COUNT(event.id)', 'goals')
      .groupBy('player.id')
      .addGroupBy('player.name')
      .addGroupBy('club.name')
      .addGroupBy('season.seasonYear')
      .orderBy('goals', 'DESC')
      .addOrderBy('player.name', 'ASC')
      .limit(1)
      .getRawOne<{
        playerId: string;
        playerName: string;
        clubName: string | null;
        seasonYear: string;
        goals: string;
      }>();

    const championsHistory = await this.getChampionsHistory(saveGameId);
    const dominantClub = championsHistory.titleRanking[0] ?? null;

    return {
      saveId: saveGameId,
      records: {
        biggestWin,
        highestScoringMatch,
        bestLeagueCampaign: bestCampaignRaw
          ? {
              clubName: bestCampaignRaw.clubName,
              seasonYear: this.toNumber(bestCampaignRaw.seasonYear),
              competitionName: bestCampaignRaw.competitionName,
              points: this.toNumber(bestCampaignRaw.points),
              wins: this.toNumber(bestCampaignRaw.wins),
              draws: this.toNumber(bestCampaignRaw.draws),
              losses: this.toNumber(bestCampaignRaw.losses),
              goalDifference: this.toNumber(bestCampaignRaw.goalDifference),
            }
          : null,
        topScorerSeason: topScorerSeasonRaw
          ? {
              playerId: topScorerSeasonRaw.playerId,
              playerName: topScorerSeasonRaw.playerName,
              clubName: topScorerSeasonRaw.clubName ?? 'Sem clube',
              seasonYear: this.toNumber(topScorerSeasonRaw.seasonYear),
              goals: this.toNumber(topScorerSeasonRaw.goals),
            }
          : null,
        mostTitledClub: dominantClub,
      },
    };
  }
}
