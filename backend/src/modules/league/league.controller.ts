import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CreateLeagueDto } from './dto/create-league.dto';
import { LeagueService } from './league.service';

@ApiTags('leagues')
@Controller('leagues')
export class LeagueController {
  constructor(private readonly leagueService: LeagueService) {}

  @Get()
  listAll(@Query() pagination: PaginationDto) {
    return this.leagueService.listAll(pagination);
  }

  @Get('country/:countryId')
  listByCountry(
    @Param('countryId') countryId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.leagueService.listByCountry(countryId, pagination);
  }

  @Post()
  create(@Body() payload: CreateLeagueDto) {
    return this.leagueService.createLeague(payload);
  }
}
