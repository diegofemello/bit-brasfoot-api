import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompetitionModule } from '../competition/competition.module';
import { Club } from '../club/entities/club.entity';
import { CompetitionSeason } from '../competition/entities/competition-season.entity';
import { Fixture } from '../competition/entities/fixture.entity';
import { Player } from '../player/entities/player.entity';
import { SaveGame } from '../save-game/entities/save-game.entity';
import { SeasonController } from './season.controller';
import { PlayerAgingService } from './services/player-aging.service';
import { PlayerEvolutionService } from './services/player-evolution.service';
import { PromotionRelegationService } from './services/promotion-relegation.service';
import { RetirementService } from './services/retirement.service';
import { YouthAcademyService } from './services/youth-academy.service';
import { SeasonService } from './season.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([SaveGame, Player, Club, Fixture, CompetitionSeason]),
    CompetitionModule,
  ],
  controllers: [SeasonController],
  providers: [
    SeasonService,
    PlayerEvolutionService,
    PlayerAgingService,
    RetirementService,
    PromotionRelegationService,
    YouthAcademyService,
  ],
})
export class SeasonModule {}
