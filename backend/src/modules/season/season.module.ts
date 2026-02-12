import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompetitionModule } from '../competition/competition.module';
import { SaveGame } from '../save-game/entities/save-game.entity';
import { SeasonController } from './season.controller';
import { SeasonService } from './season.service';

@Module({
  imports: [TypeOrmModule.forFeature([SaveGame]), CompetitionModule],
  controllers: [SeasonController],
  providers: [SeasonService],
})
export class SeasonModule {}
