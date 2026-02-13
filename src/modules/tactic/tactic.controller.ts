import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateTacticDto } from './dto/create-tactic.dto';
import { UpdateTacticDto } from './dto/update-tactic.dto';
import { TacticService } from './tactic.service';

@ApiTags('tactics')
@Controller('tactics')
export class TacticController {
  constructor(private readonly tacticService: TacticService) {}

  @Get('save/:saveGameId')
  getBySave(@Param('saveGameId') saveGameId: string) {
    return this.tacticService.getBySave(saveGameId);
  }

  @Post()
  create(@Body() payload: CreateTacticDto) {
    return this.tacticService.create(payload);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() payload: UpdateTacticDto) {
    return this.tacticService.update(id, payload);
  }
}
