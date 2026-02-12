import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UpgradeInfrastructureDto } from './dto/upgrade-infrastructure.dto';
import { InfrastructureService } from './infrastructure.service';

@ApiTags('infrastructures')
@Controller('infrastructures')
export class InfrastructureController {
  constructor(private readonly infrastructureService: InfrastructureService) {}

  @Get('save/:saveGameId')
  getBySave(@Param('saveGameId') saveGameId: string) {
    return this.infrastructureService.getBySave(saveGameId);
  }

  @Post('upgrade')
  upgrade(@Body() payload: UpgradeInfrastructureDto) {
    return this.infrastructureService.upgrade(payload);
  }
}
