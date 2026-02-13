import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Club } from '../club/entities/club.entity';
import { FinanceModule } from '../finance/finance.module';
import { MatchEngineModule } from '../match-engine/match-engine.module';
import { MatchEvent } from '../match/entities/match-event.entity';
import { MatchPlayerRating } from '../match/entities/match-player-rating.entity';
import { MatchTimeline } from '../match/entities/match-timeline.entity';
import { Match } from '../match/entities/match.entity';
import { Player } from '../player/entities/player.entity';
import { SaveGame } from '../save-game/entities/save-game.entity';
import { Tactic } from '../tactic/entities/tactic.entity';
import { CompetitionController } from './competition.controller';
import { CompetitionService } from './competition.service';
import { CompetitionSeason } from './entities/competition-season.entity';
import { Competition } from './entities/competition.entity';
import { Fixture } from './entities/fixture.entity';
import { Standing } from './entities/standing.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Competition,
      CompetitionSeason,
      Standing,
      Fixture,
      Match,
      MatchEvent,
      MatchTimeline,
      MatchPlayerRating,
      SaveGame,
      Club,
      Player,
      Tactic,
    ]),
    MatchEngineModule,
    FinanceModule,
  ],
  controllers: [CompetitionController],
  providers: [CompetitionService],
  exports: [CompetitionService],
})
export class CompetitionModule {}
