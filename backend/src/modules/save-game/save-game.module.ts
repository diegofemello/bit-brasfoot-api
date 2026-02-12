import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Club } from '../club/entities/club.entity';
import { SaveGame } from './entities/save-game.entity';
import { SaveGameController } from './save-game.controller';
import { SaveGameService } from './save-game.service';

@Module({
  imports: [TypeOrmModule.forFeature([SaveGame, Club])],
  controllers: [SaveGameController],
  providers: [SaveGameService],
  exports: [SaveGameService, TypeOrmModule],
})
export class SaveGameModule {}
