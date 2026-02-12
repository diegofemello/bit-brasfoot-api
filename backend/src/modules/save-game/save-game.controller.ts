import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CreateSaveGameDto } from './dto/create-save-game.dto';
import { SaveGameService } from './save-game.service';

@ApiTags('save-games')
@Controller('save-games')
export class SaveGameController {
  constructor(private readonly saveGameService: SaveGameService) {}

  @Post()
  create(@Body() payload: CreateSaveGameDto) {
    return this.saveGameService.createSave(payload);
  }

  @Get('user/:userId')
  listByUser(
    @Param('userId') userId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.saveGameService.listByUser(userId, pagination);
  }
}
