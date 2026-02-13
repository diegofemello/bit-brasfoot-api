import { Injectable } from '@nestjs/common';
import { MatchEventType } from '../../match/entities/match-event.entity';

export type Mentality = 'defensive' | 'balanced' | 'attacking';
export type Pressing = 'low' | 'medium' | 'high';
export type Tempo = 'low' | 'normal' | 'high';

export interface TeamTactic {
  mentality: Mentality;
  pressing: Pressing;
  tempo: Tempo;
}

export interface GeneratorEvent {
  minute: number;
  team: 'home' | 'away';
  type: MatchEventType;
  playerName?: string;
  descriptionHint: string;
}

@Injectable()
export class EventGeneratorService {
  private randomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private probabilityByTactic(tactic: TeamTactic) {
    const mentalityBoost =
      tactic.mentality === 'attacking' ? 0.012 : tactic.mentality === 'defensive' ? -0.008 : 0;
    const tempoBoost = tactic.tempo === 'high' ? 0.006 : tactic.tempo === 'low' ? -0.004 : 0;
    return mentalityBoost + tempoBoost;
  }

  generateMinuteEvents(params: {
    minute: number;
    homeStrength: number;
    awayStrength: number;
    homeTactic: TeamTactic;
    awayTactic: TeamTactic;
    homePlayers: string[];
    awayPlayers: string[];
    homeGoals: number;
    awayGoals: number;
  }): GeneratorEvent[] {
    const {
      minute,
      homeStrength,
      awayStrength,
      homeTactic,
      awayTactic,
      homePlayers,
      awayPlayers,
      homeGoals,
      awayGoals,
    } = params;

    const events: GeneratorEvent[] = [];
    const baseGoalChance = 0.018;

    const homeGoalChance =
      baseGoalChance +
      (homeStrength - awayStrength) / 2600 +
      this.probabilityByTactic(homeTactic);

    const awayGoalChance =
      baseGoalChance +
      (awayStrength - homeStrength) / 2600 +
      this.probabilityByTactic(awayTactic);

    if (Math.random() < Math.max(0.004, homeGoalChance)) {
      const playerName = homePlayers[this.randomInt(0, Math.max(homePlayers.length - 1, 0))];
      events.push({
        minute,
        team: 'home',
        type: MatchEventType.GOAL,
        playerName,
        descriptionHint: 'goal',
      });
    }

    if (Math.random() < Math.max(0.004, awayGoalChance)) {
      const playerName = awayPlayers[this.randomInt(0, Math.max(awayPlayers.length - 1, 0))];
      events.push({
        minute,
        team: 'away',
        type: MatchEventType.GOAL,
        playerName,
        descriptionHint: 'goal',
      });
    }

    const cardChanceBase = 0.01;
    if (Math.random() < cardChanceBase) {
      const team = Math.random() < 0.5 ? 'home' : 'away';
      const players = team === 'home' ? homePlayers : awayPlayers;
      const playerName = players[this.randomInt(0, Math.max(players.length - 1, 0))];
      const type = Math.random() < 0.85 ? MatchEventType.YELLOW_CARD : MatchEventType.RED_CARD;
      events.push({ minute, team, type, playerName, descriptionHint: 'card' });
    }

    const injuryChance = 0.004;
    if (Math.random() < injuryChance) {
      const team = Math.random() < 0.5 ? 'home' : 'away';
      const players = team === 'home' ? homePlayers : awayPlayers;
      const playerName = players[this.randomInt(0, Math.max(players.length - 1, 0))];
      events.push({
        minute,
        team,
        type: MatchEventType.INJURY,
        playerName,
        descriptionHint: 'injury',
      });
    }

    if ([60, 70, 80].includes(minute)) {
      const homeLosing = homeGoals < awayGoals;
      const awayLosing = awayGoals < homeGoals;

      if (homeLosing || Math.random() < 0.15) {
        events.push({
          minute,
          team: 'home',
          type: MatchEventType.TACTIC_CHANGE,
          descriptionHint: 'tactic-change',
        });
      }

      if (awayLosing || Math.random() < 0.15) {
        events.push({
          minute,
          team: 'away',
          type: MatchEventType.TACTIC_CHANGE,
          descriptionHint: 'tactic-change',
        });
      }
    }

    if ([58, 68, 78].includes(minute)) {
      if (Math.random() < 0.55) {
        events.push({
          minute,
          team: 'home',
          type: MatchEventType.SUBSTITUTION,
          descriptionHint: 'substitution',
        });
      }

      if (Math.random() < 0.55) {
        events.push({
          minute,
          team: 'away',
          type: MatchEventType.SUBSTITUTION,
          descriptionHint: 'substitution',
        });
      }
    }

    return events;
  }
}
