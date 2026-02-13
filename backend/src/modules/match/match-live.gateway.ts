import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { MatchRealtimeService } from './match-realtime.service';

@WebSocketGateway({
  namespace: '/match-live',
  cors: {
    origin: ['http://localhost:4200', 'http://127.0.0.1:4200'],
    credentials: true,
  },
})
export class MatchLiveGateway implements OnGatewayInit, OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly realtimeService: MatchRealtimeService) {}

  afterInit() {
    this.realtimeService.state$.subscribe(({ fixtureId, state }) => {
      this.server.to(this.roomName(fixtureId)).emit('match_state', state);
    });
  }

  handleConnection(client: Socket) {
    client.emit('match_connected', { ok: true });
  }

  @SubscribeMessage('join_match')
  async joinMatch(@ConnectedSocket() client: Socket, @MessageBody() payload: { fixtureId: string }) {
    try {
      const fixtureId = payload?.fixtureId;
      if (!fixtureId) {
        client.emit('match_error', { message: 'fixtureId é obrigatório.' });
        return;
      }

      await client.join(this.roomName(fixtureId));
      const state = await this.realtimeService.join(fixtureId);
      client.emit('match_state', state);
    } catch (error) {
      client.emit('match_error', { message: this.toMessage(error) });
    }
  }

  @SubscribeMessage('leave_match')
  async leaveMatch(@ConnectedSocket() client: Socket, @MessageBody() payload: { fixtureId: string }) {
    const fixtureId = payload?.fixtureId;
    if (!fixtureId) {
      return;
    }

    await client.leave(this.roomName(fixtureId));
  }

  @SubscribeMessage('match_control')
  async matchControl(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: {
      fixtureId: string;
      action: 'start' | 'pause' | 'resume' | 'step' | 'reset' | 'speed';
      speedMs?: number;
    },
  ) {
    try {
      const fixtureId = payload?.fixtureId;
      if (!fixtureId) {
        client.emit('match_error', { message: 'fixtureId é obrigatório.' });
        return;
      }

      if (payload.action === 'start') await this.realtimeService.start(fixtureId);
      if (payload.action === 'pause') await this.realtimeService.pause(fixtureId);
      if (payload.action === 'resume') await this.realtimeService.resume(fixtureId);
      if (payload.action === 'step') await this.realtimeService.step(fixtureId);
      if (payload.action === 'reset') await this.realtimeService.reset(fixtureId);
      if (payload.action === 'speed') {
        await this.realtimeService.setSpeed(fixtureId, payload.speedMs ?? 900);
      }
    } catch (error) {
      client.emit('match_error', { message: this.toMessage(error) });
    }
  }

  @SubscribeMessage('coach_action')
  async coachAction(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: {
      fixtureId: string;
      team: 'home' | 'away';
      type: 'substitution' | 'tactic';
      tactic?: 'defensive' | 'balanced' | 'attacking';
    },
  ) {
    try {
      const fixtureId = payload?.fixtureId;
      if (!fixtureId) {
        client.emit('match_error', { message: 'fixtureId é obrigatório.' });
        return;
      }

      await this.realtimeService.coachAction(fixtureId, {
        team: payload.team,
        type: payload.type,
        tactic: payload.tactic,
      });
    } catch (error) {
      client.emit('match_error', { message: this.toMessage(error) });
    }
  }

  private roomName(fixtureId: string) {
    return `match:${fixtureId}`;
  }

  private toMessage(error: unknown) {
    if (error instanceof Error) {
      return error.message;
    }
    return 'Erro inesperado no realtime da partida.';
  }
}
