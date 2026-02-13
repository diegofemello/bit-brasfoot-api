import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { QueryAiFeedDto } from '../transfer/dto/query-ai-feed.dto';
import { CareerService } from './career.service';

@ApiTags('career')
@Controller('career')
export class CareerController {
  constructor(private readonly careerService: CareerService) {}

  @Get('save/:saveGameId')
  getOverview(@Param('saveGameId') saveGameId: string) {
    return this.careerService.getOverview(saveGameId);
  }

  @Get('save/:saveGameId/history')
  getHistory(@Param('saveGameId') saveGameId: string) {
    return this.careerService.getHistory(saveGameId);
  }

  @Get('save/:saveGameId/offers')
  getOffers(@Param('saveGameId') saveGameId: string, @Query() query: QueryAiFeedDto) {
    return this.careerService.getOffers(saveGameId, {
      ...query,
      saveGameId,
    });
  }

  @Post('save/:saveGameId/offers/:clubId/accept')
  acceptOffer(@Param('saveGameId') saveGameId: string, @Param('clubId') clubId: string) {
    return this.careerService.acceptOffer(saveGameId, clubId);
  }

  @Post('save/:saveGameId/resign')
  resign(@Param('saveGameId') saveGameId: string) {
    return this.careerService.resign(saveGameId);
  }
}
