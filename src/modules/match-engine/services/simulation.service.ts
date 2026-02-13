import { Injectable } from '@nestjs/common';
import { MatchEventType } from '../../match/entities/match-event.entity';
import { CommentaryService } from './commentary.service';
import { EventGeneratorService, TeamTactic } from './event-generator.service';
import { RatingService } from './rating.service';

interface SimulationTeamInput {
  clubId: string;
  clubName: string;
  strength: number;
  players: Array<{ id: string; name: string }>;
  tactic: TeamTactic;
}

interface SimulationInput {
  home: SimulationTeamInput;
  away: SimulationTeamInput;
}

@Injectable()
export class SimulationService {
  constructor(
    private readonly eventGenerator: EventGeneratorService,
    private readonly commentaryService: CommentaryService,
    private readonly ratingService: RatingService,
  ) {}

  simulateMatch(input: SimulationInput) {
    let homeScore = 0;
    let awayScore = 0;

    const events: Array<{
      minute: number;
      type: MatchEventType;
      team: 'home' | 'away';
      playerName?: string;
      description: string;
    }> = [];

    const timeline: Array<{
      minute: number;
      homeScore: number;
      awayScore: number;
      commentary: string;
    }> = [];

    for (let minute = 1; minute <= 90; minute += 1) {
      const generatedEvents = this.eventGenerator.generateMinuteEvents({
        minute,
        homeStrength: input.home.strength,
        awayStrength: input.away.strength,
        homeTactic: input.home.tactic,
        awayTactic: input.away.tactic,
        homePlayers: input.home.players.map((player) => player.name),
        awayPlayers: input.away.players.map((player) => player.name),
        homeGoals: homeScore,
        awayGoals: awayScore,
      });

      generatedEvents.forEach((event) => {
        if (event.type === MatchEventType.GOAL) {
          if (event.team === 'home') homeScore += 1;
          if (event.team === 'away') awayScore += 1;
        }

        const clubName =
          event.team === 'home' ? input.home.clubName : input.away.clubName;
        const description = this.commentaryService.eventCommentary({
          type: event.type,
          clubName,
          playerName: event.playerName,
          homeScore,
          awayScore,
        });

        events.push({
          minute: event.minute,
          type: event.type,
          team: event.team,
          playerName: event.playerName,
          description,
        });
      });

      timeline.push({
        minute,
        homeScore,
        awayScore,
        commentary: this.commentaryService.minuteCommentary(
          minute,
          input.home.clubName,
          input.away.clubName,
        ),
      });
    }

    const homeRatings = this.ratingService.calculateRatings({
      players: input.home.players,
      events: events.filter((event) => event.team === 'home'),
      teamScored: homeScore,
      teamConceded: awayScore,
      won: homeScore > awayScore,
    });

    const awayRatings = this.ratingService.calculateRatings({
      players: input.away.players,
      events: events.filter((event) => event.team === 'away'),
      teamScored: awayScore,
      teamConceded: homeScore,
      won: awayScore > homeScore,
    });

    const strengthBias = (input.home.strength - input.away.strength) / 2.2;
    const tacticBias =
      this.tacticPossessionBias(input.home.tactic) -
      this.tacticPossessionBias(input.away.tactic);
    const scoreBias = (homeScore - awayScore) * 1.4;
    const randomBias = (Math.random() - 0.5) * 8;

    const homePossession = Math.max(
      35,
      Math.min(
        65,
        Math.round(50 + strengthBias + tacticBias - scoreBias + randomBias),
      ),
    );
    const awayPossession = 100 - homePossession;

    return {
      homeScore,
      awayScore,
      events,
      timeline,
      ratings: [...homeRatings, ...awayRatings],
      stats: {
        homePossession,
        awayPossession,
        homeShots: Math.max(2, Math.round(homeScore * 2 + homePossession / 10)),
        awayShots: Math.max(2, Math.round(awayScore * 2 + awayPossession / 10)),
      },
    };
  }

  private tacticPossessionBias(tactic: TeamTactic) {
    const mentalityBias =
      tactic.mentality === 'attacking'
        ? 2
        : tactic.mentality === 'defensive'
          ? -2
          : 0;
    const pressingBias =
      tactic.pressing === 'high' ? 1.4 : tactic.pressing === 'low' ? -1.2 : 0;
    const tempoBias =
      tactic.tempo === 'high' ? 0.8 : tactic.tempo === 'low' ? -0.6 : 0;

    return mentalityBias + pressingBias + tempoBias;
  }
}
