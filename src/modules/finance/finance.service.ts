import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { SaveGame } from '../save-game/entities/save-game.entity';
import { CreateFinanceTransactionDto } from './dto/create-finance-transaction.dto';
import { RegisterTicketIncomeDto } from './dto/register-ticket-income.dto';
import { FinanceAccount } from './entities/finance-account.entity';
import {
  FinanceTransaction,
  FinanceTransactionType,
} from './entities/finance-transaction.entity';

@Injectable()
export class FinanceService {
  constructor(
    @InjectRepository(FinanceAccount)
    private readonly accountRepository: Repository<FinanceAccount>,
    @InjectRepository(FinanceTransaction)
    private readonly transactionRepository: Repository<FinanceTransaction>,
    @InjectRepository(SaveGame)
    private readonly saveGameRepository: Repository<SaveGame>,
  ) {}

  private async ensureSaveExists(saveGameId: string) {
    const saveGame = await this.saveGameRepository.findOneBy({
      id: saveGameId,
    });
    if (!saveGame) {
      throw new NotFoundException('Save não encontrado');
    }
  }

  async getOrCreateAccount(saveGameId: string) {
    await this.ensureSaveExists(saveGameId);

    const existing = await this.accountRepository.findOneBy({ saveGameId });
    if (existing) {
      return existing;
    }

    return this.accountRepository.save({
      saveGameId,
      balance: 30000000,
      monthlyIncome: 2000000,
      monthlyExpense: 1200000,
    });
  }

  async listTransactions(saveGameId: string, pagination: PaginationDto) {
    await this.ensureSaveExists(saveGameId);

    const [data, total] = await this.transactionRepository.findAndCount({
      where: { saveGameId },
      order: { createdAt: 'DESC' },
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
    });

    return {
      data,
      meta: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
      },
    };
  }

  async createTransaction(payload: CreateFinanceTransactionDto) {
    const account = await this.getOrCreateAccount(payload.saveGameId);

    if (
      payload.type === FinanceTransactionType.EXPENSE &&
      account.balance < payload.amount
    ) {
      throw new BadRequestException(
        'Saldo insuficiente para registrar a despesa',
      );
    }

    const transaction = await this.transactionRepository.save(payload);
    const delta =
      payload.type === FinanceTransactionType.INCOME
        ? payload.amount
        : -payload.amount;

    await this.accountRepository.update(account.id, {
      balance: Number(account.balance) + delta,
    });

    return transaction;
  }

  async registerTicketIncome(payload: RegisterTicketIncomeDto) {
    const amount = payload.attendance * payload.ticketPrice;

    return this.createTransaction({
      saveGameId: payload.saveGameId,
      type: FinanceTransactionType.INCOME,
      category: 'ticket',
      amount,
      description: `Bilheteria: ${payload.matchLabel}`,
    });
  }
}
