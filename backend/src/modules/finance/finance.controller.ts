import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CreateFinanceTransactionDto } from './dto/create-finance-transaction.dto';
import { RegisterTicketIncomeDto } from './dto/register-ticket-income.dto';
import { FinanceService } from './finance.service';

@ApiTags('finances')
@Controller('finances')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('save/:saveGameId/account')
  getAccount(@Param('saveGameId') saveGameId: string) {
    return this.financeService.getOrCreateAccount(saveGameId);
  }

  @Get('save/:saveGameId/transactions')
  listTransactions(
    @Param('saveGameId') saveGameId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.financeService.listTransactions(saveGameId, pagination);
  }

  @Post('transactions')
  createTransaction(@Body() payload: CreateFinanceTransactionDto) {
    return this.financeService.createTransaction(payload);
  }

  @Post('tickets')
  registerTicketIncome(@Body() payload: RegisterTicketIncomeDto) {
    return this.financeService.registerTicketIncome(payload);
  }
}
