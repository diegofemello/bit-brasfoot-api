import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SaveGame } from '../save-game/entities/save-game.entity';
import { TacticController } from './tactic.controller';
import { TacticService } from './tactic.service';
import { Tactic } from './entities/tactic.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tactic, SaveGame])],
  controllers: [TacticController],
  providers: [TacticService],
  exports: [TacticService],
})
export class TacticModule {}
