import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MatchEventType } from './entities/match-event.entity';
import { MatchRealtimeService } from './match-realtime.service';

describe('MatchRealtimeService', () => {
  it('reuses one bootstrap promise for concurrent joins', async () => {
    const detail = {
      match: {
        homePossession: 52,
        awayPossession: 48,
      },
      timeline: [
        {
          minute: 1,
          homeScore: 0,
          awayScore: 0,
          commentary: 'Começa o jogo',
        },
      ],
      events: [
        {
          minute: 1,
          type: MatchEventType.KICKOFF,
          description: 'Início de partida',
        },
      ],
      ratings: [],
    };

    const getByFixture = jest
      .fn()
      .mockRejectedValueOnce(
        new NotFoundException('Partida ainda não simulada para este fixture'),
      )
      .mockResolvedValue(detail);

    const matchServiceMock = {
      getByFixture,
      simulateByFixture: jest.fn().mockResolvedValue(undefined),
      clearCoachActionEvents: jest.fn().mockResolvedValue(undefined),
      appendCoachActionEvent: jest.fn().mockResolvedValue(undefined),
    } as any;

    const service = new MatchRealtimeService(matchServiceMock);

    await Promise.all([service.join('fixture-1'), service.join('fixture-1')]);

    expect(matchServiceMock.simulateByFixture).toHaveBeenCalledTimes(1);
    expect(getByFixture).toHaveBeenCalledTimes(2);
  });

  it('recovers when concurrent simulation already happened', async () => {
    const detail = {
      match: {
        homePossession: 55,
        awayPossession: 45,
      },
      timeline: [
        {
          minute: 1,
          homeScore: 0,
          awayScore: 0,
          commentary: 'Partida em andamento',
        },
      ],
      events: [],
      ratings: [],
    };

    const getByFixture = jest
      .fn()
      .mockRejectedValueOnce(
        new NotFoundException('Partida ainda não simulada para este fixture'),
      )
      .mockResolvedValueOnce(detail);

    const matchServiceMock = {
      getByFixture,
      simulateByFixture: jest
        .fn()
        .mockRejectedValue(new BadRequestException('Partida já simulada')),
      clearCoachActionEvents: jest.fn().mockResolvedValue(undefined),
      appendCoachActionEvent: jest.fn().mockResolvedValue(undefined),
    } as any;

    const service = new MatchRealtimeService(matchServiceMock);

    await expect(service.join('fixture-2')).resolves.toBeDefined();
    expect(getByFixture).toHaveBeenCalledTimes(2);
  });
});
