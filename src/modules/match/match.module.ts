import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompetitionModule } from '../competition/competition.module';
import { MatchLiveGateway } from './match-live.gateway';
import { MatchRealtimeService } from './match-realtime.service';
import { MatchController } from './match.controller';
import { MatchService } from './match.service';
import { MatchEvent } from './entities/match-event.entity';
import { MatchPlayerRating } from './entities/match-player-rating.entity';
import { MatchTimeline } from './entities/match-timeline.entity';
import { Match } from './entities/match.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Match, MatchEvent, MatchTimeline, MatchPlayerRating]),
    CompetitionModule,
  ],
  controllers: [MatchController],
  providers: [MatchService, MatchRealtimeService, MatchLiveGateway],
})
export class MatchModule {}
