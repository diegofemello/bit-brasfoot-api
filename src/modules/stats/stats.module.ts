import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Club } from '../club/entities/club.entity';
import { CompetitionSeason } from '../competition/entities/competition-season.entity';
import { Fixture } from '../competition/entities/fixture.entity';
import { Standing } from '../competition/entities/standing.entity';
import { MatchEvent } from '../match/entities/match-event.entity';
import { Match } from '../match/entities/match.entity';
import { Player } from '../player/entities/player.entity';
import { SaveGame } from '../save-game/entities/save-game.entity';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SaveGame,
      CompetitionSeason,
      Standing,
      Fixture,
      Match,
      MatchEvent,
      Player,
      Club,
    ]),
  ],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}
