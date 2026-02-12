import { Body, Controller, Get, Post, Query } from '@nestjs/common';
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
    // TODO: Na Fase 1, extrair userId do token JWT via Guard/Decorator
    return this.saveGameService.createSave(payload);
  }

  @Get()
  listAll(@Query() pagination: PaginationDto) {
    // TODO: Na Fase 1, filtrar por userId do token automaticamente
    return this.saveGameService.listAll(pagination);
  }
}
