import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { Club } from '../club/entities/club.entity';
import { FinanceService } from '../finance/finance.service';
import { TeamTactic } from '../match-engine/services/event-generator.service';
import { SimulationService } from '../match-engine/services/simulation.service';
import { MatchEvent } from '../match/entities/match-event.entity';
import { MatchPlayerRating } from '../match/entities/match-player-rating.entity';
import { MatchTimeline } from '../match/entities/match-timeline.entity';
import { Match, MatchStatus } from '../match/entities/match.entity';
import { Player } from '../player/entities/player.entity';
import { SaveGame } from '../save-game/entities/save-game.entity';
import { Tactic } from '../tactic/entities/tactic.entity';
import { QuerySeasonFixturesDto } from './dto/query-season-fixtures.dto';
import { QueryTopScorersDto } from './dto/query-top-scorers.dto';
import { CompetitionSeason, CompetitionSeasonStatus } from './entities/competition-season.entity';
import { Competition, CompetitionType } from './entities/competition.entity';
import { Fixture, FixtureStage, FixtureStatus, KnockoutRound } from './entities/fixture.entity';
import { Standing, StandingStage } from './entities/standing.entity';

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
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
    @InjectRepository(MatchEvent)
    private readonly matchEventRepository: Repository<MatchEvent>,
    @InjectRepository(MatchTimeline)
    private readonly matchTimelineRepository: Repository<MatchTimeline>,
    @InjectRepository(MatchPlayerRating)
    private readonly matchPlayerRatingRepository: Repository<MatchPlayerRating>,
    @InjectRepository(Tactic)
    private readonly tacticRepository: Repository<Tactic>,
    private readonly simulationService: SimulationService,
    private readonly financeService: FinanceService,
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

  private generateSingleLegRoundRobin(clubIds: string[]) {
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

    return rounds;
  }

  private generateDoubleLegRoundRobin(clubIds: string[]) {
    const singleLeg = this.generateSingleLegRoundRobin(clubIds);
    const mirrored = singleLeg.map((pairs) =>
      pairs.map((pair) => ({
        homeClubId: pair.awayClubId,
        awayClubId: pair.homeClubId,
      })),
    );
    return [...singleLeg, ...mirrored];
  }

  private async getClubStrengthMap(clubIds: string[]) {
    const uniqueClubIds = Array.from(new Set(clubIds));

    if (uniqueClubIds.length === 0) {
      return new Map<string, number>();
    }

    const players = await this.playerRepository.find({
      where: { clubId: In(uniqueClubIds) },
      select: ['clubId', 'overall'],
    });

    const strengthMap = new Map<string, number>();

    uniqueClubIds.forEach((clubId) => {
      const clubPlayers = players.filter((player) => player.clubId === clubId);

      if (clubPlayers.length === 0) {
        strengthMap.set(clubId, 70);
        return;
      }

      const averageOverall =
        clubPlayers.reduce((sum, player) => sum + player.overall, 0) /
        clubPlayers.length;

      strengthMap.set(clubId, averageOverall);
    });

    return strengthMap;
  }

  private defaultTactic(): TeamTactic {
    return {
      mentality: 'balanced',
      pressing: 'medium',
      tempo: 'normal',
    };
  }

  private async getTacticBySave(saveGameId: string) {
    const tactic = await this.tacticRepository.findOne({ where: { saveGameId } });
    if (!tactic?.instructions) {
      return this.defaultTactic();
    }

    return {
      mentality: tactic.instructions.mentality,
      pressing: tactic.instructions.pressing,
      tempo: tactic.instructions.tempo,
    };
  }

  private async getPlayersByClubMap(clubIds: string[]) {
    const uniqueClubIds = Array.from(new Set(clubIds));
    const players = await this.playerRepository.find({
      where: { clubId: In(uniqueClubIds) },
      order: { overall: 'DESC', potential: 'DESC', name: 'ASC' },
    });

    const playersByClub = new Map<string, Player[]>();
    uniqueClubIds.forEach((clubId) => {
      playersByClub.set(
        clubId,
        players.filter((player) => player.clubId === clubId),
      );
    });

    return playersByClub;
  }

  private async persistMatchAndEvents(
    fixture: Fixture,
    playersByClub: Map<string, Player[]>,
    saveGameId: string,
    managedClubId: string | null,
    homeStrength: number,
    awayStrength: number,
  ) {
    const managedClubTactic = await this.getTacticBySave(saveGameId);
    const homeTactic = fixture.homeClubId === managedClubId
      ? managedClubTactic
      : this.defaultTactic();
    const awayTactic = fixture.awayClubId === managedClubId
      ? managedClubTactic
      : this.defaultTactic();

    const homePlayers = playersByClub.get(fixture.homeClubId) ?? [];
    const awayPlayers = playersByClub.get(fixture.awayClubId) ?? [];

    const simulation = this.simulationService.simulateMatch({
      home: {
        clubId: fixture.homeClubId,
        clubName: fixture.homeClub?.name ?? 'Clube mandante',
        strength: homeStrength,
        players: homePlayers.map((player) => ({ id: player.id, name: player.name })),
        tactic: homeTactic,
      },
      away: {
        clubId: fixture.awayClubId,
        clubName: fixture.awayClub?.name ?? 'Clube visitante',
        strength: awayStrength,
        players: awayPlayers.map((player) => ({ id: player.id, name: player.name })),
        tactic: awayTactic,
      },
    });

    fixture.homeScore = simulation.homeScore;
    fixture.awayScore = simulation.awayScore;
    fixture.status = FixtureStatus.PLAYED;

    let match = await this.matchRepository.findOne({ where: { fixtureId: fixture.id } });

    if (!match) {
      match = this.matchRepository.create({
        fixtureId: fixture.id,
        homeClubId: fixture.homeClubId,
        awayClubId: fixture.awayClubId,
        homeScore: simulation.homeScore,
        awayScore: simulation.awayScore,
        homePossession: simulation.stats.homePossession,
        awayPossession: simulation.stats.awayPossession,
        homeShots: simulation.stats.homeShots,
        awayShots: simulation.stats.awayShots,
        status: MatchStatus.FINISHED,
        simulatedAt: new Date(),
      });
    } else {
      match.homeScore = simulation.homeScore;
      match.awayScore = simulation.awayScore;
      match.homePossession = simulation.stats.homePossession;
      match.awayPossession = simulation.stats.awayPossession;
      match.homeShots = simulation.stats.homeShots;
      match.awayShots = simulation.stats.awayShots;
      match.status = MatchStatus.FINISHED;
      match.simulatedAt = new Date();
    }

    const savedMatch = await this.matchRepository.save(match);

    await this.matchEventRepository.delete({ matchId: savedMatch.id });
    await this.matchTimelineRepository.delete({ matchId: savedMatch.id });
    await this.matchPlayerRatingRepository.delete({ matchId: savedMatch.id });

    const homePlayerByName = new Map(homePlayers.map((player) => [player.name, player]));
    const awayPlayerByName = new Map(awayPlayers.map((player) => [player.name, player]));

    if (simulation.events.length > 0) {
      await this.matchEventRepository.save(
        simulation.events.map((event) => {
          const mappedPlayer =
            event.team === 'home'
              ? homePlayerByName.get(event.playerName ?? '')
              : awayPlayerByName.get(event.playerName ?? '');

          return {
            matchId: savedMatch.id,
            minute: event.minute,
            type: event.type,
            clubId: event.team === 'home' ? fixture.homeClubId : fixture.awayClubId,
            playerId: mappedPlayer?.id ?? null,
            description: event.description,
          };
        }),
      );
    }

    if (simulation.timeline.length > 0) {
      await this.matchTimelineRepository.save(
        simulation.timeline.map((minuteState) => ({
          matchId: savedMatch.id,
          minute: minuteState.minute,
          homeScore: minuteState.homeScore,
          awayScore: minuteState.awayScore,
          commentary: minuteState.commentary,
        })),
      );
    }

    if (simulation.ratings.length > 0) {
      await this.matchPlayerRatingRepository.save(
        simulation.ratings
          .map((rating) => {
            const homePlayer = homePlayerByName.get(rating.playerName);
            const awayPlayer = awayPlayerByName.get(rating.playerName);
            const player = homePlayer ?? awayPlayer;
            if (!player?.clubId) {
              return null;
            }

            return {
              matchId: savedMatch.id,
              playerId: player.id,
              clubId: player.clubId,
              rating: rating.rating,
            };
          })
          .filter((item): item is { matchId: string; playerId: string; clubId: string; rating: number } => item !== null),
      );
    }

    const attendance = Math.max(5000, Math.floor((fixture.homeClub?.stadiumCapacity ?? 30000) * (0.55 + Math.random() * 0.35)));

    await this.financeService.registerTicketIncome({
      saveGameId,
      attendance,
      ticketPrice: 45,
      matchLabel: `${fixture.homeClub?.name ?? 'Mandante'} x ${fixture.awayClub?.name ?? 'Visitante'}`,
    });
  }

  private async recalculateStandingPositions(
    seasonId: string,
    stage: StandingStage,
    groupName: string | null,
  ) {
    const groupNameCondition = groupName === null ? IsNull() : groupName;

    const standings = await this.standingRepository.find({
      where: {
        seasonId,
        stage,
        groupName: groupNameCondition,
      },
      relations: ['club'],
      order: {
        points: 'DESC',
        goalDifference: 'DESC',
        goalsFor: 'DESC',
        club: { name: 'ASC' },
      },
    });

    standings.forEach((standing, index) => {
      standing.position = index + 1;
    });

    await this.standingRepository.save(standings);
  }

  private async applyFixtureResultToStandings(fixture: Fixture) {
    if (fixture.stage !== FixtureStage.LEAGUE && fixture.stage !== FixtureStage.GROUP) {
      return;
    }

    const standingStage =
      fixture.stage === FixtureStage.LEAGUE ? StandingStage.LEAGUE : StandingStage.GROUP;

    const [homeStanding, awayStanding] = await Promise.all([
      this.standingRepository.findOne({
        where: {
          seasonId: fixture.seasonId,
          clubId: fixture.homeClubId,
          stage: standingStage,
          groupName: fixture.groupName ?? IsNull(),
        },
      }),
      this.standingRepository.findOne({
        where: {
          seasonId: fixture.seasonId,
          clubId: fixture.awayClubId,
          stage: standingStage,
          groupName: fixture.groupName ?? IsNull(),
        },
      }),
    ]);

    if (!homeStanding || !awayStanding) {
      return;
    }

    const homeScore = fixture.homeScore ?? 0;
    const awayScore = fixture.awayScore ?? 0;

    homeStanding.played += 1;
    awayStanding.played += 1;

    homeStanding.goalsFor += homeScore;
    homeStanding.goalsAgainst += awayScore;
    awayStanding.goalsFor += awayScore;
    awayStanding.goalsAgainst += homeScore;

    homeStanding.goalDifference = homeStanding.goalsFor - homeStanding.goalsAgainst;
    awayStanding.goalDifference = awayStanding.goalsFor - awayStanding.goalsAgainst;

    if (homeScore > awayScore) {
      homeStanding.wins += 1;
      awayStanding.losses += 1;
      homeStanding.points += 3;
    } else if (homeScore < awayScore) {
      awayStanding.wins += 1;
      homeStanding.losses += 1;
      awayStanding.points += 3;
    } else {
      homeStanding.draws += 1;
      awayStanding.draws += 1;
      homeStanding.points += 1;
      awayStanding.points += 1;
    }

    await this.standingRepository.save([homeStanding, awayStanding]);
    await this.recalculateStandingPositions(
      fixture.seasonId,
      standingStage,
      fixture.groupName ?? null,
    );
  }

  private async ensureLeagueCompetitionSeason(save: SaveGame) {
    if (!save.clubId || !save.club?.leagueId) {
      throw new BadRequestException('Save sem clube selecionado para gerar competições');
    }

    const leagueId = save.club.leagueId;

    let competition = await this.competitionRepository.findOne({
      where: {
        leagueId,
        type: CompetitionType.LEAGUE,
      },
      relations: ['league'],
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
        saveGameId: save.id,
        competitionId: competition.id,
        seasonYear: save.currentSeasonYear,
      },
    });

    if (existingSeason) {
      return;
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
      saveGameId: save.id,
      seasonYear: save.currentSeasonYear,
      currentRound: 1,
      status: CompetitionSeasonStatus.ONGOING,
    });

    await this.standingRepository.save(
      clubs.map((club, index) => ({
        seasonId: season.id,
        clubId: club.id,
        stage: StandingStage.LEAGUE,
        groupName: null,
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

    const rounds = this.generateDoubleLegRoundRobin(clubs.map((club) => club.id));
    const seasonStartDate = new Date(`${save.currentDate}T00:00:00.000Z`);

    await this.fixtureRepository.save(
      rounds.flatMap((roundPairs, roundIndex) => {
        const matchDate = new Date(seasonStartDate);
        matchDate.setDate(seasonStartDate.getDate() + roundIndex * 7);

        return roundPairs.map((pair) => ({
          seasonId: season.id,
          round: roundIndex + 1,
          stage: FixtureStage.LEAGUE,
          groupName: null,
          knockoutRound: null,
          homeClubId: pair.homeClubId,
          awayClubId: pair.awayClubId,
          matchDate: this.toDateIso(matchDate),
          status: FixtureStatus.SCHEDULED,
          homeScore: null,
          awayScore: null,
        }));
      }),
    );
  }

  private async ensureContinentalCompetitionSeason(save: SaveGame) {
    let competition = await this.competitionRepository.findOne({
      where: {
        type: CompetitionType.CONTINENTAL,
        leagueId: IsNull(),
      },
    });

    if (!competition) {
      competition = await this.competitionRepository.save({
        name: 'Copa Continental',
        type: CompetitionType.CONTINENTAL,
        leagueId: null,
      });
    }

    const existingSeason = await this.seasonRepository.findOne({
      where: {
        saveGameId: save.id,
        competitionId: competition.id,
        seasonYear: save.currentSeasonYear,
      },
    });

    if (existingSeason) {
      return;
    }

    const clubs = await this.clubRepository.find({
      order: { budget: 'DESC', name: 'ASC' },
      take: 8,
    });

    if (clubs.length < 8) {
      return;
    }

    const season = await this.seasonRepository.save({
      competitionId: competition.id,
      saveGameId: save.id,
      seasonYear: save.currentSeasonYear,
      currentRound: 1,
      status: CompetitionSeasonStatus.ONGOING,
    });

    const groupA = clubs.slice(0, 4);
    const groupB = clubs.slice(4, 8);

    await this.standingRepository.save(
      [...groupA, ...groupB].map((club, index) => ({
        seasonId: season.id,
        clubId: club.id,
        stage: StandingStage.GROUP,
        groupName: index < 4 ? 'Grupo A' : 'Grupo B',
        position: index < 4 ? index + 1 : index - 3,
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

    const roundsA = this.generateSingleLegRoundRobin(groupA.map((club) => club.id));
    const roundsB = this.generateSingleLegRoundRobin(groupB.map((club) => club.id));
    const groupRoundCount = Math.max(roundsA.length, roundsB.length);
    const seasonStartDate = new Date(`${save.currentDate}T00:00:00.000Z`);

    const groupFixtures = Array.from({ length: groupRoundCount }).flatMap((_, index) => {
      const matchDate = new Date(seasonStartDate);
      matchDate.setDate(seasonStartDate.getDate() + index * 7);

      const fixturesA = (roundsA[index] ?? []).map((pair) => ({
        seasonId: season.id,
        round: index + 1,
        stage: FixtureStage.GROUP,
        groupName: 'Grupo A',
        knockoutRound: null,
        homeClubId: pair.homeClubId,
        awayClubId: pair.awayClubId,
        matchDate: this.toDateIso(matchDate),
        status: FixtureStatus.SCHEDULED,
        homeScore: null,
        awayScore: null,
      }));

      const fixturesB = (roundsB[index] ?? []).map((pair) => ({
        seasonId: season.id,
        round: index + 1,
        stage: FixtureStage.GROUP,
        groupName: 'Grupo B',
        knockoutRound: null,
        homeClubId: pair.homeClubId,
        awayClubId: pair.awayClubId,
        matchDate: this.toDateIso(matchDate),
        status: FixtureStatus.SCHEDULED,
        homeScore: null,
        awayScore: null,
      }));

      return [...fixturesA, ...fixturesB];
    });

    await this.fixtureRepository.save(groupFixtures);

    const semifinalDate = new Date(seasonStartDate);
    semifinalDate.setDate(seasonStartDate.getDate() + groupRoundCount * 7);

    const finalDate = new Date(semifinalDate);
    finalDate.setDate(semifinalDate.getDate() + 7);

    const a1 = groupA[0];
    const a2 = groupA[1];
    const b1 = groupB[0];
    const b2 = groupB[1];

    await this.fixtureRepository.save([
      {
        seasonId: season.id,
        round: groupRoundCount + 1,
        stage: FixtureStage.KNOCKOUT,
        groupName: null,
        knockoutRound: KnockoutRound.SEMIFINAL,
        homeClubId: a1.id,
        awayClubId: b2.id,
        matchDate: this.toDateIso(semifinalDate),
        status: FixtureStatus.SCHEDULED,
        homeScore: null,
        awayScore: null,
      },
      {
        seasonId: season.id,
        round: groupRoundCount + 1,
        stage: FixtureStage.KNOCKOUT,
        groupName: null,
        knockoutRound: KnockoutRound.SEMIFINAL,
        homeClubId: b1.id,
        awayClubId: a2.id,
        matchDate: this.toDateIso(semifinalDate),
        status: FixtureStatus.SCHEDULED,
        homeScore: null,
        awayScore: null,
      },
      {
        seasonId: season.id,
        round: groupRoundCount + 2,
        stage: FixtureStage.KNOCKOUT,
        groupName: null,
        knockoutRound: KnockoutRound.FINAL,
        homeClubId: a1.id,
        awayClubId: b1.id,
        matchDate: this.toDateIso(finalDate),
        status: FixtureStatus.SCHEDULED,
        homeScore: null,
        awayScore: null,
      },
    ]);
  }

  async setupSaveCompetitions(saveGameId: string) {
    const save = await this.ensureSaveExists(saveGameId);

    await this.ensureLeagueCompetitionSeason(save);
    await this.ensureContinentalCompetitionSeason(save);

    return this.getSaveCompetitions(saveGameId);
  }

  async finishPreviousSeasons(saveGameId: string, nextSeasonYear: number) {
    await this.seasonRepository
      .createQueryBuilder()
      .update(CompetitionSeason)
      .set({ status: CompetitionSeasonStatus.FINISHED })
      .where('save_game_id = :saveGameId', { saveGameId })
      .andWhere('season_year < :nextSeasonYear', { nextSeasonYear })
      .andWhere('status = :status', { status: CompetitionSeasonStatus.ONGOING })
      .execute();
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
      where: { seasonId, stage: StandingStage.LEAGUE },
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

  async getSeasonGroupStandings(seasonId: string) {
    const season = await this.seasonRepository.findOne({ where: { id: seasonId } });
    if (!season) {
      throw new NotFoundException('Temporada da competição não encontrada');
    }

    const standings = await this.standingRepository.find({
      where: { seasonId, stage: StandingStage.GROUP },
      relations: ['club'],
      order: {
        groupName: 'ASC',
        points: 'DESC',
        goalDifference: 'DESC',
        goalsFor: 'DESC',
        club: { name: 'ASC' },
      },
    });

    const grouped = new Map<string, typeof standings>();

    standings.forEach((standing) => {
      const key = standing.groupName ?? 'Sem grupo';
      const list = grouped.get(key) ?? [];
      list.push(standing);
      grouped.set(key, list);
    });

    return Array.from(grouped.entries()).map(([groupName, table]) => ({
      groupName,
      table: table.map((item, index) => ({ ...item, position: index + 1 })),
    }));
  }

  async getSeasonKnockout(seasonId: string) {
    const season = await this.seasonRepository.findOne({ where: { id: seasonId } });
    if (!season) {
      throw new NotFoundException('Temporada da competição não encontrada');
    }

    const fixtures = await this.fixtureRepository.find({
      where: { seasonId, stage: FixtureStage.KNOCKOUT },
      relations: ['homeClub', 'awayClub'],
      order: {
        round: 'ASC',
        matchDate: 'ASC',
      },
    });

    const grouped = new Map<string, Fixture[]>();

    fixtures.forEach((fixture) => {
      const key = fixture.knockoutRound ?? 'knockout';
      const list = grouped.get(key) ?? [];
      list.push(fixture);
      grouped.set(key, list);
    });

    return Array.from(grouped.entries()).map(([round, matches]) => ({
      round,
      matches,
    }));
  }

  async simulateFixtureById(fixtureId: string) {
    const fixture = await this.fixtureRepository.findOne({
      where: { id: fixtureId },
      relations: ['homeClub', 'awayClub'],
    });

    if (!fixture) {
      throw new NotFoundException('Fixture não encontrado');
    }

    if (fixture.status === FixtureStatus.PLAYED) {
      throw new BadRequestException('Partida já simulada');
    }

    const season = await this.seasonRepository.findOne({ where: { id: fixture.seasonId } });
    if (!season) {
      throw new NotFoundException('Temporada da competição não encontrada');
    }

    const save = await this.ensureSaveExists(season.saveGameId);

    const clubStrength = await this.getClubStrengthMap([fixture.homeClubId, fixture.awayClubId]);
    const playersByClub = await this.getPlayersByClubMap([fixture.homeClubId, fixture.awayClubId]);

    await this.persistMatchAndEvents(
      fixture,
      playersByClub,
      season.saveGameId,
      save.clubId,
      clubStrength.get(fixture.homeClubId) ?? 70,
      clubStrength.get(fixture.awayClubId) ?? 70,
    );

    await this.fixtureRepository.save(fixture);
    await this.applyFixtureResultToStandings(fixture);

    return {
      fixtureId: fixture.id,
      seasonId: fixture.seasonId,
      homeScore: fixture.homeScore,
      awayScore: fixture.awayScore,
      status: fixture.status,
    };
  }

  async simulateRound(seasonId: string, round?: number) {
    const season = await this.seasonRepository.findOne({ where: { id: seasonId } });

    if (!season) {
      throw new NotFoundException('Temporada da competição não encontrada');
    }

    const save = await this.ensureSaveExists(season.saveGameId);

    if (season.status === CompetitionSeasonStatus.FINISHED) {
      throw new BadRequestException('Temporada já finalizada');
    }

    const roundToSimulate = round ?? season.currentRound;
    if (!Number.isInteger(roundToSimulate) || roundToSimulate < 1) {
      throw new BadRequestException('Rodada inválida para simulação');
    }

    const fixtures = await this.fixtureRepository.find({
      where: {
        seasonId,
        round: roundToSimulate,
        status: FixtureStatus.SCHEDULED,
      },
      relations: ['homeClub', 'awayClub'],
      order: {
        matchDate: 'ASC',
      },
    });

    if (fixtures.length === 0) {
      throw new BadRequestException('Nenhuma partida pendente para esta rodada');
    }

    const clubStrength = await this.getClubStrengthMap(
      fixtures.flatMap((fixture) => [fixture.homeClubId, fixture.awayClubId]),
    );
    const playersByClub = await this.getPlayersByClubMap(
      fixtures.flatMap((fixture) => [fixture.homeClubId, fixture.awayClubId]),
    );

    for (const fixture of fixtures) {
      await this.persistMatchAndEvents(
        fixture,
        playersByClub,
        season.saveGameId,
        save.clubId,
        clubStrength.get(fixture.homeClubId) ?? 70,
        clubStrength.get(fixture.awayClubId) ?? 70,
      );
    }

    await this.fixtureRepository.save(fixtures);

    for (const fixture of fixtures) {
      await this.applyFixtureResultToStandings(fixture);
    }

    const maxRoundResult = await this.fixtureRepository
      .createQueryBuilder('fixture')
      .where('fixture.seasonId = :seasonId', { seasonId })
      .select('COALESCE(MAX(fixture.round), 0)', 'maxRound')
      .getRawOne<{ maxRound: string }>();

    const maxRound = Number(maxRoundResult?.maxRound ?? 0);
    const nextRound = roundToSimulate + 1;

    season.currentRound = Math.min(nextRound, maxRound || nextRound);
    if (nextRound > maxRound) {
      season.status = CompetitionSeasonStatus.FINISHED;
    }

    await this.seasonRepository.save(season);

    return {
      seasonId,
      round: roundToSimulate,
      currentRound: season.currentRound,
      status: season.status,
      matchesSimulated: fixtures.length,
      results: fixtures.map((fixture) => ({
        fixtureId: fixture.id,
        homeClubId: fixture.homeClubId,
        awayClubId: fixture.awayClubId,
        homeScore: fixture.homeScore,
        awayScore: fixture.awayScore,
      })),
    };
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

    if (query.stage) {
      qb.andWhere('fixture.stage = :stage', { stage: query.stage });
    }

    if (query.round) {
      qb.andWhere('fixture.round = :round', { round: query.round });
    }

    qb.orderBy('fixture.round', 'ASC').addOrderBy('fixture.matchDate', 'ASC').addOrderBy('homeClub.name', 'ASC');

    const fixtures = await qb.getMany();

    const roundsQb = this.fixtureRepository
      .createQueryBuilder('fixture')
      .where('fixture.seasonId = :seasonId', { seasonId });

    if (query.stage) {
      roundsQb.andWhere('fixture.stage = :stage', { stage: query.stage });
    }

    const rounds = await roundsQb
      .select('DISTINCT fixture.round', 'round')
      .orderBy('fixture.round', 'ASC')
      .getRawMany<{ round: string }>();

    return {
      data: fixtures,
      availableRounds: rounds.map((item) => Number(item.round)),
    };
  }

  async getFixtureById(fixtureId: string) {
    const fixture = await this.fixtureRepository.findOne({
      where: { id: fixtureId },
      relations: ['homeClub', 'awayClub', 'season'],
    });

    if (!fixture) {
      throw new NotFoundException('Fixture não encontrado');
    }

    return fixture;
  }

  async getTopScorers(seasonId: string, query: QueryTopScorersDto) {
    const season = await this.seasonRepository.findOne({
      where: { id: seasonId },
      relations: ['competition'],
    });

    if (!season) {
      throw new NotFoundException('Temporada da competição não encontrada');
    }

    let players: Player[] = [];

    if (season.competition.leagueId) {
      players = await this.playerRepository
        .createQueryBuilder('player')
        .leftJoinAndSelect('player.club', 'club')
        .where('club.leagueId = :leagueId', { leagueId: season.competition.leagueId })
        .orderBy('player.overall', 'DESC')
        .addOrderBy('player.potential', 'DESC')
        .take(query.limit ?? 10)
        .getMany();
    } else {
      const standings = await this.standingRepository.find({ where: { seasonId } });
      const clubIds = standings.map((item) => item.clubId);
      if (clubIds.length > 0) {
        players = await this.playerRepository.find({
          where: { clubId: In(clubIds) },
          relations: ['club'],
          order: { overall: 'DESC', potential: 'DESC' },
          take: query.limit ?? 10,
        });
      }
    }

    return players.map((player) => ({
      playerId: player.id,
      name: player.name,
      clubId: player.clubId,
      clubName: player.club?.name ?? 'Sem clube',
      goals: Math.max(0, Math.floor((player.overall - 60) / 5)),
    }));
  }
}
