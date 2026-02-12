import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { QuerySeasonFixturesDto } from './dto/query-season-fixtures.dto';
import { QueryTopScorersDto } from './dto/query-top-scorers.dto';
import { CompetitionService } from './competition.service';

@ApiTags('competitions')
@Controller('competitions')
export class CompetitionController {
  constructor(private readonly competitionService: CompetitionService) {}

  @Post('save/:saveGameId/setup')
  setup(@Param('saveGameId') saveGameId: string) {
    return this.competitionService.setupSaveCompetitions(saveGameId);
  }

  @Get('save/:saveGameId')
  getSaveCompetitions(@Param('saveGameId') saveGameId: string) {
    return this.competitionService.getSaveCompetitions(saveGameId);
  }

  @Get('seasons/:seasonId/standings')
  getStandings(@Param('seasonId') seasonId: string) {
    return this.competitionService.getSeasonStandings(seasonId);
  }

  @Get('seasons/:seasonId/fixtures')
  getFixtures(@Param('seasonId') seasonId: string, @Query() query: QuerySeasonFixturesDto) {
    return this.competitionService.getSeasonFixtures(seasonId, query);
  }

  @Get('seasons/:seasonId/top-scorers')
  getTopScorers(@Param('seasonId') seasonId: string, @Query() query: QueryTopScorersDto) {
    return this.competitionService.getTopScorers(seasonId, query);
  }
}
