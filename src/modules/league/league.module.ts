import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { League } from './entities/league.entity';
import { LeagueController } from './league.controller';
import { LeagueService } from './league.service';

@Module({
  imports: [TypeOrmModule.forFeature([League])],
  controllers: [LeagueController],
  providers: [LeagueService],
  exports: [LeagueService],
})
export class LeagueModule {}
