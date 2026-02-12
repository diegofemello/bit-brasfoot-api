import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Club } from '../club/entities/club.entity';
import { Player } from '../player/entities/player.entity';
import { SaveGame } from '../save-game/entities/save-game.entity';
import { QuerySeasonFixturesDto } from './dto/query-season-fixtures.dto';
import { QueryTopScorersDto } from './dto/query-top-scorers.dto';
import { CompetitionSeason, CompetitionSeasonStatus } from './entities/competition-season.entity';
import { Competition, CompetitionType } from './entities/competition.entity';
import { Fixture, FixtureStatus } from './entities/fixture.entity';
import { Standing } from './entities/standing.entity';

interface RoundPair {
  homeClubId: string;
  awayClubId: string;
}

@Injectable()
export class CompetitionService {
  constructor(
    @InjectRepository(Competition)
    private readonly competitionRepository: Repository<Competition>,
    @InjectRepository(CompetitionSeason)
    private readonly seasonRepository: Repository<CompetitionSeason>,
    @InjectRepository(Standing)
    private readonly standingRepository: Repository<Standing>,
    @InjectRepository(Fixture)
    private readonly fixtureRepository: Repository<Fixture>,
    @InjectRepository(SaveGame)
    private readonly saveGameRepository: Repository<SaveGame>,
    @InjectRepository(Club)
    private readonly clubRepository: Repository<Club>,
    @InjectRepository(Player)
    private readonly playerRepository: Repository<Player>,
  ) {}

  private async ensureSaveExists(saveGameId: string) {
    const save = await this.saveGameRepository.findOne({
      where: { id: saveGameId },
      relations: ['club', 'club.league'],
    });
    if (!save) {
      throw new NotFoundException('Save não encontrado');
    }
    return save;
  }

  private toDateIso(value: Date) {
    return value.toISOString().slice(0, 10);
  }

  private generateRoundRobinRounds(clubIds: string[]) {
    const teams = [...clubIds];
    const hasBye = teams.length % 2 !== 0;

    if (hasBye) {
      teams.push('__bye__');
    }

    const totalTeams = teams.length;
    const half = totalTeams / 2;
    const rounds: RoundPair[][] = [];

    for (let roundIndex = 0; roundIndex < totalTeams - 1; roundIndex += 1) {
      const pairs: RoundPair[] = [];

      for (let pairIndex = 0; pairIndex < half; pairIndex += 1) {
        const first = teams[pairIndex];
        const second = teams[totalTeams - 1 - pairIndex];

        if (first === '__bye__' || second === '__bye__') {
          continue;
        }

        const isEvenRound = roundIndex % 2 === 0;
        pairs.push({
          homeClubId: isEvenRound ? first : second,
          awayClubId: isEvenRound ? second : first,
        });
      }

      rounds.push(pairs);

      const fixedTeam = teams[0];
      const rotating = teams.slice(1);
      rotating.unshift(rotating.pop()!);
      teams.splice(0, teams.length, fixedTeam, ...rotating);
    }

    const mirroredRounds = rounds.map((pairs) =>
      pairs.map((pair) => ({
        homeClubId: pair.awayClubId,
        awayClubId: pair.homeClubId,
      })),
    );

    return [...rounds, ...mirroredRounds];
  }

  async setupSaveCompetitions(saveGameId: string) {
    const save = await this.ensureSaveExists(saveGameId);

    if (!save.clubId || !save.club?.leagueId) {
      throw new BadRequestException('Save sem clube selecionado para gerar competições');
    }

    const leagueId = save.club.leagueId;

    let competition = await this.competitionRepository.findOne({
      where: {
        leagueId,
        type: CompetitionType.LEAGUE,
      },
    });

    if (!competition) {
      competition = await this.competitionRepository.save({
        name: save.club.league.name,
        type: CompetitionType.LEAGUE,
        leagueId,
      });
    }

    const existingSeason = await this.seasonRepository.findOne({
      where: {
        saveGameId,
        competitionId: competition.id,
        seasonYear: save.currentSeasonYear,
      },
    });

    if (existingSeason) {
      return this.getSaveCompetitions(saveGameId);
    }

    const clubs = await this.clubRepository.find({
      where: { leagueId },
      order: { name: 'ASC' },
    });

    if (clubs.length < 2) {
      throw new BadRequestException('Liga com clubes insuficientes para gerar calendário');
    }

    const season = await this.seasonRepository.save({
      competitionId: competition.id,
      saveGameId,
      seasonYear: save.currentSeasonYear,
      currentRound: 1,
      status: CompetitionSeasonStatus.ONGOING,
    });

    await this.standingRepository.save(
      clubs.map((club, index) => ({
        seasonId: season.id,
        clubId: club.id,
        position: index + 1,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
      })),
    );

    const rounds = this.generateRoundRobinRounds(clubs.map((club) => club.id));
    const seasonStartDate = new Date(`${save.currentDate}T00:00:00.000Z`);

    await this.fixtureRepository.save(
      rounds.flatMap((roundPairs, roundIndex) => {
        const matchDate = new Date(seasonStartDate);
        matchDate.setDate(seasonStartDate.getDate() + roundIndex * 7);

        return roundPairs.map((pair) => ({
          seasonId: season.id,
          round: roundIndex + 1,
          homeClubId: pair.homeClubId,
          awayClubId: pair.awayClubId,
          matchDate: this.toDateIso(matchDate),
          status: FixtureStatus.SCHEDULED,
          homeScore: null,
          awayScore: null,
        }));
      }),
    );

    return this.getSaveCompetitions(saveGameId);
  }

  async getSaveCompetitions(saveGameId: string) {
    await this.ensureSaveExists(saveGameId);

    const seasons = await this.seasonRepository.find({
      where: { saveGameId },
      relations: ['competition'],
      order: { seasonYear: 'DESC' },
    });

    return Promise.all(
      seasons.map(async (season) => {
        const totalRounds = await this.fixtureRepository
          .createQueryBuilder('fixture')
          .where('fixture.seasonId = :seasonId', { seasonId: season.id })
          .select('COALESCE(MAX(fixture.round), 0)', 'maxRound')
          .getRawOne<{ maxRound: string }>();

        return {
          seasonId: season.id,
          competitionId: season.competitionId,
          competitionName: season.competition.name,
          competitionType: season.competition.type,
          seasonYear: season.seasonYear,
          currentRound: season.currentRound,
          totalRounds: Number(totalRounds?.maxRound ?? 0),
          status: season.status,
        };
      }),
    );
  }

  async getSeasonStandings(seasonId: string) {
    const season = await this.seasonRepository.findOne({ where: { id: seasonId } });
    if (!season) {
      throw new NotFoundException('Temporada da competição não encontrada');
    }

    const standings = await this.standingRepository.find({
      where: { seasonId },
      relations: ['club'],
      order: {
        points: 'DESC',
        goalDifference: 'DESC',
        goalsFor: 'DESC',
        club: { name: 'ASC' },
      },
    });

    return standings.map((standing, index) => ({
      ...standing,
      position: index + 1,
    }));
  }

  async getSeasonFixtures(seasonId: string, query: QuerySeasonFixturesDto) {
    const season = await this.seasonRepository.findOne({ where: { id: seasonId } });
    if (!season) {
      throw new NotFoundException('Temporada da competição não encontrada');
    }

    const qb = this.fixtureRepository
      .createQueryBuilder('fixture')
      .leftJoinAndSelect('fixture.homeClub', 'homeClub')
      .leftJoinAndSelect('fixture.awayClub', 'awayClub')
      .where('fixture.seasonId = :seasonId', { seasonId });

    if (query.round) {
      qb.andWhere('fixture.round = :round', { round: query.round });
    }

    qb.orderBy('fixture.round', 'ASC').addOrderBy('fixture.matchDate', 'ASC').addOrderBy('homeClub.name', 'ASC');

    const fixtures = await qb.getMany();

    const rounds = await this.fixtureRepository
      .createQueryBuilder('fixture')
      .where('fixture.seasonId = :seasonId', { seasonId })
      .select('DISTINCT fixture.round', 'round')
      .orderBy('fixture.round', 'ASC')
      .getRawMany<{ round: string }>();

    return {
      data: fixtures,
      availableRounds: rounds.map((item) => Number(item.round)),
    };
  }

  async getTopScorers(seasonId: string, query: QueryTopScorersDto) {
    const season = await this.seasonRepository.findOne({
      where: { id: seasonId },
      relations: ['competition'],
    });

    if (!season) {
      throw new NotFoundException('Temporada da competição não encontrada');
    }

    if (!season.competition.leagueId) {
      return [];
    }

    const players = await this.playerRepository
      .createQueryBuilder('player')
      .leftJoinAndSelect('player.club', 'club')
      .where('club.leagueId = :leagueId', { leagueId: season.competition.leagueId })
      .orderBy('player.overall', 'DESC')
      .addOrderBy('player.potential', 'DESC')
      .take(query.limit ?? 10)
      .getMany();

    return players.map((player) => ({
      playerId: player.id,
      name: player.name,
      clubId: player.clubId,
      clubName: player.club?.name ?? 'Sem clube',
      goals: Math.max(0, Math.floor((player.overall - 60) / 5)),
    }));
  }
}
