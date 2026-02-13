import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SaveGame } from '../save-game/entities/save-game.entity';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { FinanceAccount } from './entities/finance-account.entity';
import { FinanceTransaction } from './entities/finance-transaction.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([FinanceAccount, FinanceTransaction, SaveGame]),
  ],
  controllers: [FinanceController],
  providers: [FinanceService],
  exports: [FinanceService],
})
export class FinanceModule {}
