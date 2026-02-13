import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { Subject } from 'rxjs';
import { MatchEventType } from './entities/match-event.entity';
import { MatchService } from './match.service';

type TeamSide = 'home' | 'away';
type LiveTactic = 'defensive' | 'balanced' | 'attacking';

export interface LiveCoachAction {
  minute: number;
  type: 'substitution' | 'tactic';
  team: TeamSide;
  text: string;
}

export interface LiveMatchState {
  fixtureId: string;
  minute: number;
  isPlaying: boolean;
  speedMs: number;
  score: {
    home: number;
    away: number;
  };
  tactics: {
    home: LiveTactic;
    away: LiveTactic;
  };
  momentum: {
    home: number;
    away: number;
  };
  ball: {
    x: number;
    y: number;
  };
  commentary: string | null;
  events: Array<{ minute: number; description: string }>;
  coachActions: LiveCoachAction[];
}

interface LiveSession {
  fixtureId: string;
  minute: number;
  isPlaying: boolean;
  speedMs: number;
  timer: ReturnType<typeof setInterval> | null;
  timeline: Array<{
    minute: number;
    homeScore: number;
    awayScore: number;
    commentary: string;
  }>;
  events: Array<{ minute: number; type: MatchEventType; description: string }>;
  homeTactic: LiveTactic;
  awayTactic: LiveTactic;
  homeMomentum: number;
  awayMomentum: number;
  homeMomentumUntil: number;
  awayMomentumUntil: number;
  coachActions: LiveCoachAction[];
  possession: {
    home: number;
    away: number;
  };
}

@Injectable()
export class MatchRealtimeService {
  private readonly sessions = new Map<string, LiveSession>();
  private readonly sessionInitialization = new Map<
    string,
    Promise<LiveSession>
  >();
  private readonly stateSubject = new Subject<{
    fixtureId: string;
    state: LiveMatchState;
  }>();
  private readonly logger = new Logger(MatchRealtimeService.name);
  readonly state$ = this.stateSubject.asObservable();

  constructor(private readonly matchService: MatchService) {}

  async join(fixtureId: string) {
    await this.ensureSession(fixtureId);
    return this.getState(fixtureId);
  }

  async start(fixtureId: string) {
    const session = await this.ensureSession(fixtureId);
    this.stopTimer(session);

    await this.matchService.clearCoachActionEvents(fixtureId);
    const detail = await this.matchService.getByFixture(fixtureId);

    session.minute = 1;
    session.timeline = detail.timeline.map((item) => ({
      minute: item.minute,
      homeScore: item.homeScore,
      awayScore: item.awayScore,
      commentary: item.commentary,
    }));
    session.events = detail.events.map((item) => ({
      minute: item.minute,
      type: item.type,
      description: item.description,
    }));
    session.coachActions = [];
    session.homeTactic = 'balanced';
    session.awayTactic = 'balanced';
    session.homeMomentum = 0;
    session.awayMomentum = 0;
    session.homeMomentumUntil = 0;
    session.awayMomentumUntil = 0;

    session.isPlaying = true;
    this.startTimer(session);
    this.emitState(session, this.eventsUntilMinute(session, session.minute));
    this.logger.log(
      JSON.stringify({
        event: 'realtime.start',
        fixtureId,
        minute: session.minute,
      }),
    );
    return this.toState(
      session,
      this.eventsUntilMinute(session, session.minute),
    );
  }

  async pause(fixtureId: string) {
    const session = await this.ensureSession(fixtureId);
    session.isPlaying = false;
    this.stopTimer(session);
    this.emitState(session, this.eventsUntilMinute(session, session.minute));
    return this.toState(
      session,
      this.eventsUntilMinute(session, session.minute),
    );
  }

  async resume(fixtureId: string) {
    const session = await this.ensureSession(fixtureId);
    session.isPlaying = true;
    this.startTimer(session);
    this.emitState(session, this.eventsUntilMinute(session, session.minute));
    return this.toState(
      session,
      this.eventsUntilMinute(session, session.minute),
    );
  }

  async step(fixtureId: string) {
    const session = await this.ensureSession(fixtureId);
    this.stepMinute(session);
    return this.toState(
      session,
      this.eventsUntilMinute(session, session.minute),
    );
  }

  async reset(fixtureId: string) {
    const session = await this.ensureSession(fixtureId);
    session.minute = 0;
    session.isPlaying = false;
    session.coachActions = [];
    session.homeMomentum = 0;
    session.awayMomentum = 0;
    session.homeMomentumUntil = 0;
    session.awayMomentumUntil = 0;
    this.stopTimer(session);
    this.emitState(session, this.eventsUntilMinute(session, session.minute));
    this.logger.log(JSON.stringify({ event: 'realtime.reset', fixtureId }));
    return this.toState(
      session,
      this.eventsUntilMinute(session, session.minute),
    );
  }

  async setSpeed(fixtureId: string, speedMs: number) {
    const session = await this.ensureSession(fixtureId);
    session.speedMs = Math.max(160, Math.min(1500, speedMs));
    if (session.isPlaying) {
      this.startTimer(session);
    }
    this.emitState(session, this.eventsUntilMinute(session, session.minute));
    return this.toState(
      session,
      this.eventsUntilMinute(session, session.minute),
    );
  }

  async coachAction(
    fixtureId: string,
    payload: {
      team: TeamSide;
      type: 'substitution' | 'tactic';
      tactic?: LiveTactic;
    },
  ) {
    const session = await this.ensureSession(fixtureId);
    const minute = Math.max(1, session.minute);
    let description = '';

    if (payload.type === 'substitution') {
      if (payload.team === 'home') {
        session.homeMomentum += 1.2;
        session.homeMomentumUntil = minute + 8;
      } else {
        session.awayMomentum += 1.2;
        session.awayMomentumUntil = minute + 8;
      }

      description = `Substituição no ${payload.team === 'home' ? 'mandante' : 'visitante'}: pressão extra por 8 minutos.`;

      session.coachActions.push({
        minute,
        type: 'substitution',
        team: payload.team,
        text: description,
      });

      session.events.push({
        minute,
        type: MatchEventType.SUBSTITUTION,
        description,
      });
    }

    if (payload.type === 'tactic') {
      const next = payload.tactic ?? 'balanced';
      if (payload.team === 'home') {
        session.homeTactic = next;
        session.homeMomentum += 0.6;
        session.homeMomentumUntil = Math.max(
          session.homeMomentumUntil,
          minute + 6,
        );
      } else {
        session.awayTactic = next;
        session.awayMomentum += 0.6;
        session.awayMomentumUntil = Math.max(
          session.awayMomentumUntil,
          minute + 6,
        );
      }

      description = `${payload.team === 'home' ? 'Mandante' : 'Visitante'} alterou tática para ${next} (efeito imediato no ritmo).`;

      session.coachActions.push({
        minute,
        type: 'tactic',
        team: payload.team,
        text: description,
      });

      session.events.push({
        minute,
        type: MatchEventType.TACTIC_CHANGE,
        description,
      });
    }

    await this.matchService.appendCoachActionEvent({
      fixtureId,
      minute,
      team: payload.team,
      type: payload.type,
      description,
    });

    this.emitState(session, this.eventsUntilMinute(session, session.minute));
    return this.toState(
      session,
      this.eventsUntilMinute(session, session.minute),
    );
  }

  getState(fixtureId: string) {
    const session = this.sessions.get(fixtureId);
    if (!session) {
      throw new NotFoundException(
        'Sessão ao vivo não iniciada para este fixture',
      );
    }
    return this.toState(
      session,
      this.eventsUntilMinute(session, session.minute),
    );
  }

  private async ensureSession(fixtureId: string) {
    const existing = this.sessions.get(fixtureId);
    if (existing) {
      return existing;
    }

    const initializing = this.sessionInitialization.get(fixtureId);
    if (initializing) {
      return initializing;
    }

    const bootstrapPromise = this.bootstrapSession(fixtureId).finally(() => {
      this.sessionInitialization.delete(fixtureId);
    });

    this.sessionInitialization.set(fixtureId, bootstrapPromise);
    return bootstrapPromise;
  }

  private async bootstrapSession(fixtureId: string) {
    const existing = this.sessions.get(fixtureId);
    if (existing) {
      return existing;
    }

    try {
      const detail = await this.matchService.getByFixture(fixtureId);
      const session = this.createSessionFromDetail(fixtureId, detail);
      this.sessions.set(fixtureId, session);
      this.emitState(session, []);
      this.logger.log(
        JSON.stringify({ event: 'realtime.bootstrap.reused_match', fixtureId }),
      );
      return session;
    } catch (error) {
      if (!(error instanceof NotFoundException)) {
        throw error;
      }

      try {
        await this.matchService.simulateByFixture(fixtureId);
      } catch (simulationError) {
        if (!this.isFixtureAlreadySimulatedError(simulationError)) {
          throw simulationError;
        }

        this.logger.warn(
          JSON.stringify({
            event: 'realtime.bootstrap.race_recovered',
            fixtureId,
          }),
        );

        const reloadedDetail = await this.matchService.getByFixture(fixtureId);
        const reloadedSession = this.createSessionFromDetail(
          fixtureId,
          reloadedDetail,
        );
        this.sessions.set(fixtureId, reloadedSession);
        this.emitState(reloadedSession, []);
        return reloadedSession;
      }

      const detail = await this.matchService.getByFixture(fixtureId);
      const session = this.createSessionFromDetail(fixtureId, detail);
      this.sessions.set(fixtureId, session);
      this.emitState(session, []);
      this.logger.log(
        JSON.stringify({
          event: 'realtime.bootstrap.simulated_match',
          fixtureId,
        }),
      );
      return session;
    }
  }

  private isFixtureAlreadySimulatedError(error: unknown) {
    return error instanceof BadRequestException;
  }

  private createSessionFromDetail(
    fixtureId: string,
    detail: Awaited<ReturnType<MatchService['getByFixture']>>,
  ): LiveSession {
    return {
      fixtureId,
      minute: 0,
      isPlaying: false,
      speedMs: 900,
      timer: null,
      timeline: detail.timeline.map((item) => ({
        minute: item.minute,
        homeScore: item.homeScore,
        awayScore: item.awayScore,
        commentary: item.commentary,
      })),
      events: detail.events.map((item) => ({
        minute: item.minute,
        type: item.type,
        description: item.description,
      })),
      homeTactic: 'balanced',
      awayTactic: 'balanced',
      homeMomentum: 0,
      awayMomentum: 0,
      homeMomentumUntil: 0,
      awayMomentumUntil: 0,
      coachActions: [],
      possession: {
        home: detail.match.homePossession,
        away: detail.match.awayPossession,
      },
    };
  }

  private startTimer(session: LiveSession) {
    this.stopTimer(session);

    session.timer = setInterval(() => {
      this.stepMinute(session);
      if (session.minute >= 90) {
        this.stopTimer(session);
        session.isPlaying = false;
      }
    }, session.speedMs);
  }

  private stopTimer(session: LiveSession) {
    if (!session.timer) return;
    clearInterval(session.timer);
    session.timer = null;
  }

  private stepMinute(session: LiveSession) {
    if (session.minute >= 90) {
      return;
    }

    session.minute += 1;
    this.applyMomentumDecay(session);
    this.emitState(session, this.eventsUntilMinute(session, session.minute));
  }

  private applyMomentumDecay(session: LiveSession) {
    if (session.minute >= session.homeMomentumUntil) {
      session.homeMomentum = Math.max(0, session.homeMomentum - 0.35);
    }

    if (session.minute >= session.awayMomentumUntil) {
      session.awayMomentum = Math.max(0, session.awayMomentum - 0.35);
    }
  }

  private eventsUntilMinute(session: LiveSession, minute: number) {
    return session.events
      .filter((item) => item.minute <= minute)
      .map((item) => ({ minute: item.minute, description: item.description }));
  }

  private emitState(
    session: LiveSession,
    events: Array<{ minute: number; description: string }>,
  ) {
    this.stateSubject.next({
      fixtureId: session.fixtureId,
      state: this.toState(session, events),
    });
  }

  private toState(
    session: LiveSession,
    events: Array<{ minute: number; description: string }>,
  ): LiveMatchState {
    const minuteState =
      [...session.timeline]
        .reverse()
        .find((item) => item.minute <= session.minute) ?? session.timeline[0];

    const score = {
      home: minuteState?.homeScore ?? 0,
      away: minuteState?.awayScore ?? 0,
    };

    const possessionBias =
      (session.possession.home - session.possession.away) * 0.28;
    const scoreBias = (score.home - score.away) * 2.2;
    const tacticBias =
      this.tacticBias(session.homeTactic) - this.tacticBias(session.awayTactic);
    const momentumBias = (session.homeMomentum - session.awayMomentum) * 6;
    const wave = Math.sin(session.minute / 5) * 16;

    let ballX = Math.max(
      5,
      Math.min(
        95,
        50 + possessionBias + scoreBias + tacticBias + momentumBias + wave,
      ),
    );
    let ballY = 50 + Math.sin(session.minute / 4) * 18;

    const goalAtMinute = session.events.find(
      (item) =>
        item.minute === session.minute && item.type === MatchEventType.GOAL,
    );
    if (goalAtMinute) {
      ballX = goalAtMinute.description.toLowerCase().includes('visitante')
        ? 8
        : 92;
      ballY = 50;
    }

    return {
      fixtureId: session.fixtureId,
      minute: session.minute,
      isPlaying: session.isPlaying,
      speedMs: session.speedMs,
      score,
      commentary:
        session.minute <= 0 ? null : (minuteState?.commentary ?? null),
      events,
      tactics: {
        home: session.homeTactic,
        away: session.awayTactic,
      },
      momentum: {
        home: Number(session.homeMomentum.toFixed(2)),
        away: Number(session.awayMomentum.toFixed(2)),
      },
      ball: {
        x: Number(ballX.toFixed(2)),
        y: Number(ballY.toFixed(2)),
      },
      coachActions: session.coachActions.filter(
        (item) => item.minute <= session.minute,
      ),
    };
  }

  private tacticBias(tactic: LiveTactic) {
    if (tactic === 'attacking') return 4;
    if (tactic === 'defensive') return -4;
    return 0;
  }
}
