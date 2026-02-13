import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinanceAccount } from '../finance/entities/finance-account.entity';
import { SaveGame } from '../save-game/entities/save-game.entity';
import { InfrastructureController } from './infrastructure.controller';
import { InfrastructureService } from './infrastructure.service';
import { Infrastructure } from './entities/infrastructure.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Infrastructure, FinanceAccount, SaveGame]),
  ],
  controllers: [InfrastructureController],
  providers: [InfrastructureService],
  exports: [InfrastructureService],
})
export class InfrastructureModule {}
