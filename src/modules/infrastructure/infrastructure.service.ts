import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinanceAccount } from '../finance/entities/finance-account.entity';
import { SaveGame } from '../save-game/entities/save-game.entity';
import { UpgradeInfrastructureDto } from './dto/upgrade-infrastructure.dto';
import { Infrastructure } from './entities/infrastructure.entity';

@Injectable()
export class InfrastructureService {
  private readonly maxLevel = 10;

  constructor(
    @InjectRepository(Infrastructure)
    private readonly infrastructureRepository: Repository<Infrastructure>,
    @InjectRepository(FinanceAccount)
    private readonly accountRepository: Repository<FinanceAccount>,
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

  async getBySave(saveGameId: string) {
    await this.ensureSaveExists(saveGameId);

    const existing = await this.infrastructureRepository.findOneBy({
      saveGameId,
    });
    if (existing) {
      return existing;
    }

    return this.infrastructureRepository.save({
      saveGameId,
      trainingLevel: 1,
      youthLevel: 1,
      medicalLevel: 1,
      stadiumLevel: 1,
    });
  }

  private getUpgradeCost(level: number) {
    return 500000 * level;
  }

  async upgrade(payload: UpgradeInfrastructureDto) {
    const infra = await this.getBySave(payload.saveGameId);
    const account = await this.accountRepository.findOneBy({
      saveGameId: payload.saveGameId,
    });

    if (!account) {
      throw new BadRequestException(
        'Conta financeira não encontrada para este save',
      );
    }

    const currentLevel =
      payload.type === 'training'
        ? infra.trainingLevel
        : payload.type === 'youth'
          ? infra.youthLevel
          : payload.type === 'medical'
            ? infra.medicalLevel
            : infra.stadiumLevel;

    if (currentLevel >= this.maxLevel) {
      throw new BadRequestException('Nível máximo já atingido');
    }

    const cost = this.getUpgradeCost(currentLevel + 1);
    if (Number(account.balance) < cost) {
      throw new BadRequestException('Saldo insuficiente para upgrade');
    }

    const updatePayload: Partial<Infrastructure> = {};
    if (payload.type === 'training')
      updatePayload.trainingLevel = currentLevel + 1;
    if (payload.type === 'youth') updatePayload.youthLevel = currentLevel + 1;
    if (payload.type === 'medical')
      updatePayload.medicalLevel = currentLevel + 1;
    if (payload.type === 'stadium')
      updatePayload.stadiumLevel = currentLevel + 1;

    await this.infrastructureRepository.update(infra.id, updatePayload);
    await this.accountRepository.update(account.id, {
      balance: Number(account.balance) - cost,
    });

    const updated = await this.infrastructureRepository.findOneBy({
      id: infra.id,
    });

    return {
      infrastructure: updated,
      upgradeCost: cost,
      remainingBalance: Number(account.balance) - cost,
    };
  }
}
