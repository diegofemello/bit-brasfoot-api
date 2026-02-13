import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CompetitionService } from '../competition/competition.service';
import { MatchEvent, MatchEventType } from './entities/match-event.entity';
import { MatchPlayerRating } from './entities/match-player-rating.entity';
import { MatchTimeline } from './entities/match-timeline.entity';
import { Match } from './entities/match.entity';

@Injectable()
export class MatchService {
  constructor(
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
    @InjectRepository(MatchEvent)
    private readonly eventRepository: Repository<MatchEvent>,
    @InjectRepository(MatchTimeline)
    private readonly timelineRepository: Repository<MatchTimeline>,
    @InjectRepository(MatchPlayerRating)
    private readonly ratingRepository: Repository<MatchPlayerRating>,
    private readonly competitionService: CompetitionService,
  ) {}

  async simulateByFixture(fixtureId: string) {
    return this.competitionService.simulateFixtureById(fixtureId);
  }

  async getByFixture(fixtureId: string) {
    const match = await this.matchRepository.findOne({
      where: { fixtureId },
      relations: ['fixture', 'homeClub', 'awayClub'],
    });

    if (!match) {
      throw new NotFoundException('Partida ainda não simulada para este fixture');
    }

    const events = await this.eventRepository.find({
      where: { matchId: match.id },
      relations: ['club', 'player'],
      order: {
        minute: 'ASC',
        createdAt: 'ASC',
      },
    });

    const timeline = await this.timelineRepository.find({
      where: { matchId: match.id },
      order: { minute: 'ASC' },
    });

    const ratings = await this.ratingRepository.find({
      where: { matchId: match.id },
      relations: ['player'],
      order: {
        rating: 'DESC',
        createdAt: 'ASC',
      },
    });

    return {
      match,
      events,
      timeline,
      ratings,
    };
  }

  async getLiveTextByFixture(fixtureId: string) {
    const match = await this.matchRepository.findOne({ where: { fixtureId } });
    if (!match) {
      throw new NotFoundException('Partida ainda não simulada para este fixture');
    }

    const timeline = await this.timelineRepository.find({
      where: { matchId: match.id },
      order: { minute: 'ASC' },
    });

    return {
      fixtureId,
      matchId: match.id,
      timeline,
    };
  }

  async appendCoachActionEvent(params: {
    fixtureId: string;
    minute: number;
    team: 'home' | 'away';
    type: 'substitution' | 'tactic';
    description: string;
  }) {
    const match = await this.matchRepository.findOne({ where: { fixtureId: params.fixtureId } });

    if (!match) {
      throw new NotFoundException('Partida não encontrada para registrar ação do técnico');
    }

    const eventType =
      params.type === 'substitution' ? MatchEventType.SUBSTITUTION : MatchEventType.TACTIC_CHANGE;

    const event = this.eventRepository.create({
      matchId: match.id,
      minute: params.minute,
      type: eventType,
      clubId: params.team === 'home' ? match.homeClubId : match.awayClubId,
      playerId: null,
      description: params.description,
    });

    await this.eventRepository.save(event);
  }

  async clearCoachActionEvents(fixtureId: string) {
    const match = await this.matchRepository.findOne({ where: { fixtureId } });

    if (!match) {
      throw new NotFoundException('Partida não encontrada para limpar ações do técnico');
    }

    await this.eventRepository.delete({
      matchId: match.id,
      type: In([MatchEventType.SUBSTITUTION, MatchEventType.TACTIC_CHANGE]),
    });
  }
}
