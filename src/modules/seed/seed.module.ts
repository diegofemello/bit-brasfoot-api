import { Module } from '@nestjs/common';
import { ClubModule } from '../club/club.module';
import { CountryModule } from '../country/country.module';
import { LeagueModule } from '../league/league.module';
import { PlayerModule } from '../player/player.module';
import { SeedService } from './seed.service';

@Module({
  imports: [CountryModule, LeagueModule, ClubModule, PlayerModule],
  providers: [SeedService],
})
export class SeedModule {}
