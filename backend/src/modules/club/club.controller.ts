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
import { ClubService } from './club.service';
import { CreateClubDto } from './dto/create-club.dto';
import { UpdateClubDto } from './dto/update-club.dto';

@ApiTags('clubs')
@Controller('clubs')
export class ClubController {
  constructor(private readonly clubService: ClubService) {}

  @Get()
  listAll(@Query() pagination: PaginationDto) {
    return this.clubService.listAll(pagination);
  }

  @Get('league/:leagueId')
  listByLeague(
    @Param('leagueId') leagueId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.clubService.listByLeague(leagueId, pagination);
  }

  @Post()
  create(@Body() payload: CreateClubDto) {
    return this.clubService.createClub(payload);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clubService.findClubById(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() payload: UpdateClubDto) {
    return this.clubService.updateClub(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.clubService.removeClub(id);
  }
}
