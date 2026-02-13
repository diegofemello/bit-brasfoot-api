import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateTransferListingDto } from './dto/create-transfer-listing.dto';
import { CreateTransferProposalDto } from './dto/create-transfer-proposal.dto';
import { QueryAiFeedDto } from './dto/query-ai-feed.dto';
import { QueryTransferMarketDto } from './dto/query-transfer-market.dto';
import { QueryTransferProposalsDto } from './dto/query-transfer-proposals.dto';
import { RespondTransferProposalDto } from './dto/respond-transfer-proposal.dto';
import { RunAiTransfersDto } from './dto/run-ai-transfers.dto';
import { TransferService } from './transfer.service';

@ApiTags('transfers')
@Controller('transfers')
export class TransferController {
  constructor(private readonly transferService: TransferService) {}

  @Get('market')
  listMarket(@Query() query: QueryTransferMarketDto) {
    return this.transferService.listMarket(query);
  }

  @Get('free-agents')
  listFreeAgents(@Query() query: QueryTransferMarketDto) {
    return this.transferService.listFreeAgents(query);
  }

  @Post('listings')
  createListing(@Body() payload: CreateTransferListingDto) {
    return this.transferService.createListing(payload);
  }

  @Delete('listings/:id')
  removeListing(@Param('id') id: string) {
    return this.transferService.removeListing(id);
  }

  @Post('proposals')
  createProposal(@Body() payload: CreateTransferProposalDto) {
    return this.transferService.createProposal(payload);
  }

  @Get('proposals')
  listProposals(@Query() query: QueryTransferProposalsDto) {
    return this.transferService.listProposals(query);
  }

  @Get('ai/news')
  listAiNews(@Query() query: QueryAiFeedDto) {
    return this.transferService.listAiNews(query);
  }

  @Get('ai/job-offers')
  listAiJobOffers(@Query() query: QueryAiFeedDto) {
    return this.transferService.listAiJobOffers(query);
  }

  @Patch('proposals/:id/respond')
  respondProposal(
    @Param('id') id: string,
    @Body() payload: RespondTransferProposalDto,
  ) {
    return this.transferService.respondProposal(id, payload);
  }

  @Post('ai/run')
  runAiTransfers(@Body() payload: RunAiTransfersDto) {
    return this.transferService.runAiTransferCycle(payload);
  }
}
