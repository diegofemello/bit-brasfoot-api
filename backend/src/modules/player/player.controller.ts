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
import { CreatePlayerDto } from './dto/create-player.dto';
import { QueryPlayerDto } from './dto/query-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';
import { PlayerService } from './player.service';

@ApiTags('players')
@Controller('players')
export class PlayerController {
  constructor(private readonly playerService: PlayerService) {}

  @Get()
  list(@Query() query: QueryPlayerDto) {
    return this.playerService.searchPlayers(query);
  }

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

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.playerService.findPlayerById(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() payload: UpdatePlayerDto) {
    return this.playerService.updatePlayer(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.playerService.removePlayer(id);
  }
}
