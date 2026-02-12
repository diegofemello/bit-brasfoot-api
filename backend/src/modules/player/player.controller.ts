import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CreatePlayerDto } from './dto/create-player.dto';
import { PlayerService } from './player.service';

@ApiTags('players')
@Controller('players')
export class PlayerController {
  constructor(private readonly playerService: PlayerService) {}

  @Get('club/:clubId')
  listByClub(
    @Param('clubId') clubId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.playerService.listByClub(clubId, pagination);
  }

  @Post()
  create(@Body() payload: CreatePlayerDto) {
    return this.playerService.createPlayer(payload);
  }
}
