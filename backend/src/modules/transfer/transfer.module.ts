import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Club } from '../club/entities/club.entity';
import { FinanceAccount } from '../finance/entities/finance-account.entity';
import { Player } from '../player/entities/player.entity';
import { SaveGame } from '../save-game/entities/save-game.entity';
import { TransferController } from './transfer.controller';
import { TransferService } from './transfer.service';
import { TransferListing } from './entities/transfer-listing.entity';
import { TransferProposal } from './entities/transfer-proposal.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TransferListing,
      TransferProposal,
      Player,
      Club,
      SaveGame,
      FinanceAccount,
    ]),
  ],
  controllers: [TransferController],
  providers: [TransferService],
  exports: [TransferService],
})
export class TransferModule {}
