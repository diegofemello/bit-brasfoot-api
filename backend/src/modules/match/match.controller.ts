import { Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MatchService } from './match.service';

@ApiTags('matches')
@Controller('matches')
export class MatchController {
  constructor(private readonly matchService: MatchService) {}

  @Post('fixtures/:fixtureId/simulate')
  simulateByFixture(@Param('fixtureId') fixtureId: string) {
    return this.matchService.simulateByFixture(fixtureId);
  }

  @Get('fixtures/:fixtureId')
  getByFixture(@Param('fixtureId') fixtureId: string) {
    return this.matchService.getByFixture(fixtureId);
  }

  @Get('fixtures/:fixtureId/live-text')
  getLiveTextByFixture(@Param('fixtureId') fixtureId: string) {
    return this.matchService.getLiveTextByFixture(fixtureId);
  }
}
