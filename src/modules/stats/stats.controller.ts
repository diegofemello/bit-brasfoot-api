import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { StatsService } from './stats.service';

@ApiTags('stats')
@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('save/:saveGameId/season')
  getSeasonStats(
    @Param('saveGameId') saveGameId: string,
    @Query('seasonId') seasonId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.statsService.getSeasonStats(saveGameId, {
      seasonId,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('save/:saveGameId/rankings')
  getRankings(
    @Param('saveGameId') saveGameId: string,
    @Query('limit') limit?: string,
  ) {
    return this.statsService.getPlayerRankings(
      saveGameId,
      limit ? Number(limit) : undefined,
    );
  }

  @Get('save/:saveGameId/champions')
  getChampionsHistory(@Param('saveGameId') saveGameId: string) {
    return this.statsService.getChampionsHistory(saveGameId);
  }

  @Get('save/:saveGameId/records')
  getRecords(@Param('saveGameId') saveGameId: string) {
    return this.statsService.getRecords(saveGameId);
  }
}
