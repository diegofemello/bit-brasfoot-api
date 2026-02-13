import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Club } from '../club/entities/club.entity';
import { SaveGame } from '../save-game/entities/save-game.entity';
import { TransferModule } from '../transfer/transfer.module';
import { CareerController } from './career.controller';
import { CareerService } from './career.service';

@Module({
  imports: [TypeOrmModule.forFeature([SaveGame, Club]), TransferModule],
  controllers: [CareerController],
  providers: [CareerService],
})
export class CareerModule {}
