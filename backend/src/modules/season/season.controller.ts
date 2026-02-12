import { Controller, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SeasonService } from './season.service';

@ApiTags('seasons')
@Controller('seasons')
export class SeasonController {
  constructor(private readonly seasonService: SeasonService) {}

  @Post('save/:saveGameId/advance')
  advance(@Param('saveGameId') saveGameId: string) {
    return this.seasonService.advanceSeason(saveGameId);
  }
}
