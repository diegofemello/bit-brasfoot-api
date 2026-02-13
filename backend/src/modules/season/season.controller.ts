import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RenewContractDto } from './dto/renew-contract.dto';
import { SeasonService } from './season.service';

@ApiTags('seasons')
@Controller('seasons')
export class SeasonController {
  constructor(private readonly seasonService: SeasonService) {}

  @Get('save/:saveGameId/contracts/expiring')
  listExpiringContracts(@Param('saveGameId') saveGameId: string) {
    return this.seasonService.listExpiringContracts(saveGameId);
  }

  @Post('save/:saveGameId/contracts/:playerId/renew')
  renewContract(
    @Param('saveGameId') saveGameId: string,
    @Param('playerId') playerId: string,
    @Body() payload: RenewContractDto,
  ) {
    return this.seasonService.renewContract(saveGameId, playerId, payload);
  }

  @Get('save/:saveGameId/last-summary')
  getLastSeasonSummary(@Param('saveGameId') saveGameId: string) {
    return this.seasonService.getLastSeasonSummary(saveGameId);
  }

  @Get('save/:saveGameId/youth')
  listYouth(@Param('saveGameId') saveGameId: string) {
    return this.seasonService.listYouthPlayers(saveGameId);
  }

  @Post('save/:saveGameId/youth/:playerId/promote')
  promoteYouth(
    @Param('saveGameId') saveGameId: string,
    @Param('playerId') playerId: string,
  ) {
    return this.seasonService.promoteYouthPlayer(saveGameId, playerId);
  }

  @Delete('save/:saveGameId/youth/:playerId')
  releaseYouth(
    @Param('saveGameId') saveGameId: string,
    @Param('playerId') playerId: string,
  ) {
    return this.seasonService.releaseYouthPlayer(saveGameId, playerId);
  }

  @Post('save/:saveGameId/advance-day')
  advanceDay(@Param('saveGameId') saveGameId: string) {
    return this.seasonService.advanceDay(saveGameId);
  }

  @Post('save/:saveGameId/advance-to-next-match')
  advanceToNextMatch(@Param('saveGameId') saveGameId: string) {
    return this.seasonService.advanceToNextMatch(saveGameId);
  }

  @Post('save/:saveGameId/advance')
  advance(@Param('saveGameId') saveGameId: string) {
    return this.seasonService.advanceSeason(saveGameId);
  }
}
