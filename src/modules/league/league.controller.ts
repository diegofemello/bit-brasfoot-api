import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CreateLeagueDto } from './dto/create-league.dto';
import { UpdateLeagueDto } from './dto/update-league.dto';
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

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.leagueService.findLeagueById(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() payload: UpdateLeagueDto) {
    return this.leagueService.updateLeague(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.leagueService.removeLeague(id);
  }
}
