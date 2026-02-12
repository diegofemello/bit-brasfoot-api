import { Module } from '@nestjs/common';
import { CommentaryService } from './services/commentary.service';
import { EventGeneratorService } from './services/event-generator.service';
import { RatingService } from './services/rating.service';
import { SimulationService } from './services/simulation.service';

@Module({
  providers: [SimulationService, EventGeneratorService, CommentaryService, RatingService],
  exports: [SimulationService],
})
export class MatchEngineModule {}
