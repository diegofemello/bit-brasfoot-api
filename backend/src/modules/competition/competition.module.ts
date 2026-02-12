import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Club } from '../club/entities/club.entity';
import { Player } from '../player/entities/player.entity';
import { SaveGame } from '../save-game/entities/save-game.entity';
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
      SaveGame,
      Club,
      Player,
    ]),
  ],
  controllers: [CompetitionController],
  providers: [CompetitionService],
  exports: [CompetitionService],
})
export class CompetitionModule {}
