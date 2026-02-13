import { Injectable } from '@nestjs/common';
import { MatchEventType } from '../../match/entities/match-event.entity';

interface RatingInput {
  players: Array<{ id: string; name: string }>;
  events: Array<{ type: MatchEventType; playerName?: string }>;
  teamScored: number;
  teamConceded: number;
  won: boolean;
}

@Injectable()
export class RatingService {
  calculateRatings(input: RatingInput) {
    const base = 6.5;
    const goalBonus = 0.9;
    const yellowPenalty = 0.2;
    const redPenalty = 0.8;

    return input.players.map((player) => {
      let rating = base;

      const playerEvents = input.events.filter(
        (event) => event.playerName === player.name,
      );
      playerEvents.forEach((event) => {
        if (event.type === MatchEventType.GOAL) rating += goalBonus;
        if (event.type === MatchEventType.YELLOW_CARD) rating -= yellowPenalty;
        if (event.type === MatchEventType.RED_CARD) rating -= redPenalty;
      });

      rating += Math.min(1, input.teamScored * 0.1);
      rating -= Math.min(1, input.teamConceded * 0.08);
      if (input.won) rating += 0.3;

      return {
        playerId: player.id,
        playerName: player.name,
        rating: Math.max(4.5, Math.min(10, Number(rating.toFixed(1)))),
      };
    });
  }
}
