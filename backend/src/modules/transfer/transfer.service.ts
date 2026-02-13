import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { Club } from '../club/entities/club.entity';
import { FinanceAccount } from '../finance/entities/finance-account.entity';
import { Player, PlayerPosition } from '../player/entities/player.entity';
import { SaveGame } from '../save-game/entities/save-game.entity';
import { CreateTransferListingDto } from './dto/create-transfer-listing.dto';
import { CreateTransferProposalDto } from './dto/create-transfer-proposal.dto';
import { QueryTransferMarketDto } from './dto/query-transfer-market.dto';
import { QueryTransferProposalsDto } from './dto/query-transfer-proposals.dto';
import { RespondTransferProposalDto } from './dto/respond-transfer-proposal.dto';
import { RunAiTransfersDto } from './dto/run-ai-transfers.dto';
import { TransferListing } from './entities/transfer-listing.entity';
import {
  TransferProposal,
  TransferProposalStatus,
  TransferType,
} from './entities/transfer-proposal.entity';

@Injectable()
export class TransferService {
  private readonly squadLimit = 35;

  constructor(
    @InjectRepository(TransferListing)
    private readonly listingRepository: Repository<TransferListing>,
    @InjectRepository(TransferProposal)
    private readonly proposalRepository: Repository<TransferProposal>,
    @InjectRepository(Player)
    private readonly playerRepository: Repository<Player>,
    @InjectRepository(Club)
    private readonly clubRepository: Repository<Club>,
    @InjectRepository(SaveGame)
    private readonly saveGameRepository: Repository<SaveGame>,
    @InjectRepository(FinanceAccount)
    private readonly accountRepository: Repository<FinanceAccount>,
  ) {}

  private async ensureSaveExists(saveGameId: string) {
    const save = await this.saveGameRepository.findOneBy({ id: saveGameId });
    if (!save) {
      throw new NotFoundException('Save não encontrado');
    }
    return save;
  }

  private async ensurePlayerExists(playerId: string) {
    const player = await this.playerRepository.findOne({
      where: { id: playerId },
      relations: ['club'],
    });
    if (!player) {
      throw new NotFoundException('Jogador não encontrado');
    }
    return player;
  }

  private async ensureClubExists(clubId: string) {
    const club = await this.clubRepository.findOneBy({ id: clubId });
    if (!club) {
      throw new NotFoundException('Clube não encontrado');
    }
    return club;
  }

  private async validateSquadLimit(clubId: string) {
    const squadSize = await this.playerRepository.count({ where: { clubId } });
    if (squadSize >= this.squadLimit) {
      throw new BadRequestException('Limite de elenco atingido para o clube de destino');
    }
  }

  async createListing(payload: CreateTransferListingDto) {
    await this.ensureSaveExists(payload.saveGameId);
    const player = await this.ensurePlayerExists(payload.playerId);

    const existing = await this.listingRepository.findOne({ where: { playerId: payload.playerId } });
    if (existing) {
      throw new BadRequestException('Jogador já está na lista de transferências');
    }

    return this.listingRepository.save({
      saveGameId: payload.saveGameId,
      playerId: payload.playerId,
      clubId: player.clubId,
      askingPrice: payload.askingPrice,
      isLoanAvailable: payload.isLoanAvailable ?? false,
      isFreeAgent: player.clubId === null,
    });
  }

  async removeListing(listingId: string) {
    const listing = await this.listingRepository.findOneBy({ id: listingId });
    if (!listing) {
      throw new NotFoundException('Listagem não encontrada');
    }

    await this.listingRepository.delete(listingId);
    return { success: true, message: 'Jogador removido da lista de transferências' };
  }

  async listMarket(query: QueryTransferMarketDto) {
    const qb = this.listingRepository
      .createQueryBuilder('listing')
      .leftJoinAndSelect('listing.player', 'player')
      .leftJoinAndSelect('listing.club', 'club')
      .where('listing.isFreeAgent = false');

    if (query.saveGameId) {
      qb.andWhere('listing.saveGameId = :saveGameId', { saveGameId: query.saveGameId });
    }

    if (query.name) {
      qb.andWhere('LOWER(player.name) LIKE :name', { name: `%${query.name.toLowerCase()}%` });
    }

    if (query.position) {
      qb.andWhere('player.position = :position', { position: query.position });
    }

    if (query.minOverall !== undefined) {
      qb.andWhere('player.overall >= :minOverall', { minOverall: query.minOverall });
    }

    if (query.maxOverall !== undefined) {
      qb.andWhere('player.overall <= :maxOverall', { maxOverall: query.maxOverall });
    }

    if (query.minValue !== undefined) {
      qb.andWhere('player.value >= :minValue', { minValue: query.minValue });
    }

    if (query.maxValue !== undefined) {
      qb.andWhere('player.value <= :maxValue', { maxValue: query.maxValue });
    }

    const sortBy = query.sortBy ?? 'overall';
    const sortOrder = query.sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    qb.orderBy(`player.${sortBy}`, sortOrder as 'ASC' | 'DESC');
    qb.skip((query.page - 1) * query.limit).take(query.limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async listFreeAgents(query: QueryTransferMarketDto) {
    const qb = this.listingRepository
      .createQueryBuilder('listing')
      .leftJoinAndSelect('listing.player', 'player')
      .where('listing.isFreeAgent = true');

    if (query.saveGameId) {
      qb.andWhere('listing.saveGameId = :saveGameId', { saveGameId: query.saveGameId });
    }

    if (query.name) {
      qb.andWhere('LOWER(player.name) LIKE :name', { name: `%${query.name.toLowerCase()}%` });
    }

    qb.orderBy('player.overall', 'DESC');
    qb.skip((query.page - 1) * query.limit).take(query.limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  private async validateProposal(payload: CreateTransferProposalDto, player: Player) {
    if (payload.fromClubId && payload.toClubId && payload.fromClubId === payload.toClubId) {
      throw new BadRequestException('Não é permitido negociar jogador com o mesmo clube');
    }

    if (payload.type === TransferType.PURCHASE || payload.type === TransferType.SALE) {
      if (!payload.amount || payload.amount <= 0) {
        throw new BadRequestException('Proposta de compra/venda requer valor maior que zero');
      }
    }

    if (payload.type === TransferType.SWAP && !payload.swapPlayerId) {
      throw new BadRequestException('Troca requer jogador de troca');
    }

    if (payload.toClubId) {
      await this.validateSquadLimit(payload.toClubId);
    }

    if (payload.type === TransferType.PURCHASE && payload.toClubId) {
      const account = await this.accountRepository.findOneBy({ saveGameId: payload.saveGameId });
      if (account && payload.amount && Number(account.balance) < payload.amount) {
        throw new BadRequestException('Saldo insuficiente para efetuar a compra');
      }
    }

    if (payload.type === TransferType.RELEASE && player.clubId === null) {
      throw new BadRequestException('Jogador já está livre no mercado');
    }
  }

  private async hasOpenProposal(
    saveGameId: string,
    playerId: string,
    fromClubId: string | null,
    toClubId: string | null,
  ) {
    const qb = this.proposalRepository
      .createQueryBuilder('proposal')
      .where('proposal.saveGameId = :saveGameId', { saveGameId })
      .andWhere('proposal.playerId = :playerId', { playerId })
      .andWhere('proposal.status IN (:...statuses)', {
        statuses: [TransferProposalStatus.PENDING, TransferProposalStatus.COUNTERED],
      });

    if (fromClubId === null) {
      qb.andWhere('proposal.fromClubId IS NULL');
    } else {
      qb.andWhere('proposal.fromClubId = :fromClubId', { fromClubId });
    }

    if (toClubId === null) {
      qb.andWhere('proposal.toClubId IS NULL');
    } else {
      qb.andWhere('proposal.toClubId = :toClubId', { toClubId });
    }

    const total = await qb.getCount();

    return total > 0;
  }

  private async hasAnyOpenProposalForPlayer(saveGameId: string, playerId: string) {
    const total = await this.proposalRepository.count({
      where: {
        saveGameId,
        playerId,
        status: In([TransferProposalStatus.PENDING, TransferProposalStatus.COUNTERED]),
      },
    });

    return total > 0;
  }

  private orderByWeakestPosition(players: Player[]) {
    const averagesByPosition = new Map<PlayerPosition, number>();
    const positions = new Set(players.map((item) => item.position));

    positions.forEach((position) => {
      const group = players.filter((item) => item.position === position);
      const average =
        group.reduce((sum, player) => sum + player.overall, 0) / Math.max(group.length, 1);
      averagesByPosition.set(position, average);
    });

    return [...averagesByPosition.entries()]
      .sort((a, b) => a[1] - b[1])
      .map(([position]) => position);
  }

  private suggestedAmount(player: Player) {
    const floor = Math.max(200_000, Math.round(player.value * 0.75));
    const ceiling = Math.max(floor, Math.round(player.value * 1.2));
    const spread = ceiling - floor;
    return floor + Math.round(Math.random() * spread);
  }

  async runAiTransferCycle(payload: RunAiTransfersDto) {
    const save = await this.ensureSaveExists(payload.saveGameId);
    if (!save.clubId) {
      throw new BadRequestException('Save sem clube gerenciado para executar IA de transferências');
    }

    const targetOffers = payload.offers ?? 6;
    const managedClubId = save.clubId;

    const allClubs = await this.clubRepository.find({ order: { name: 'ASC' } });
    const aiClubs = allClubs.filter((club) => club.id !== managedClubId);

    const createdProposals: Array<{
      proposalId: string;
      type: TransferType;
      playerName: string;
      fromClubId: string | null;
      toClubId: string | null;
      amount: number | null;
    }> = [];

    const managedPlayers = await this.playerRepository.find({
      where: { clubId: managedClubId },
      order: { overall: 'DESC', value: 'DESC' },
      take: 12,
    });

    for (const aiClub of aiClubs) {
      if (createdProposals.length >= targetOffers) {
        break;
      }

      const aiSquad = await this.playerRepository.find({
        where: { clubId: aiClub.id },
        order: { overall: 'DESC' },
      });

      if (aiSquad.length === 0) {
        continue;
      }

      const weakestPositions = this.orderByWeakestPosition(aiSquad);
      const preferredPositions = weakestPositions.slice(0, 2);

      let candidate: Player | null = null;
      for (const position of preferredPositions) {
        candidate = await this.playerRepository.findOne({
          where: {
            clubId: Not(aiClub.id),
            position,
            overall: Not(In([1])),
          },
          order: { overall: 'DESC', value: 'ASC' },
        });

        if (candidate) {
          break;
        }
      }

      if (!candidate || !candidate.clubId) {
        continue;
      }

      const duplicate = await this.hasOpenProposal(
        payload.saveGameId,
        candidate.id,
        candidate.clubId,
        aiClub.id,
      );
      const duplicateByPlayer = await this.hasAnyOpenProposalForPlayer(payload.saveGameId, candidate.id);
      if (duplicate || duplicateByPlayer) {
        continue;
      }

      try {
        const created = await this.createProposal({
          saveGameId: payload.saveGameId,
          playerId: candidate.id,
          fromClubId: candidate.clubId,
          toClubId: aiClub.id,
          type: TransferType.PURCHASE,
          amount: this.suggestedAmount(candidate),
          note: 'Proposta automática gerada pela IA.',
        });

        if (created) {
          createdProposals.push({
            proposalId: created.id,
            type: created.type,
            playerName: created.player?.name ?? candidate.name,
            fromClubId: created.fromClubId,
            toClubId: created.toClubId,
            amount: created.amount,
          });
        }
      } catch {
        continue;
      }
    }

    for (const managedPlayer of managedPlayers.slice(0, 5)) {
      if (createdProposals.length >= targetOffers) {
        break;
      }

      const interestedClub = aiClubs[Math.floor(Math.random() * aiClubs.length)];
      if (!interestedClub) {
        break;
      }

      const duplicate = await this.hasOpenProposal(
        payload.saveGameId,
        managedPlayer.id,
        managedClubId,
        interestedClub.id,
      );
      const duplicateByPlayer = await this.hasAnyOpenProposalForPlayer(payload.saveGameId, managedPlayer.id);
      if (duplicate || duplicateByPlayer) {
        continue;
      }

      try {
        const created = await this.createProposal({
          saveGameId: payload.saveGameId,
          playerId: managedPlayer.id,
          fromClubId: managedClubId,
          toClubId: interestedClub.id,
          type: TransferType.SALE,
          amount: this.suggestedAmount(managedPlayer),
          note: 'Oferta automática de clube da IA.',
        });

        if (created) {
          createdProposals.push({
            proposalId: created.id,
            type: created.type,
            playerName: created.player?.name ?? managedPlayer.name,
            fromClubId: created.fromClubId,
            toClubId: created.toClubId,
            amount: created.amount,
          });
        }
      } catch {
        continue;
      }
    }

    return {
      saveGameId: payload.saveGameId,
      managedClubId,
      requestedOffers: targetOffers,
      createdOffers: createdProposals.length,
      proposals: createdProposals,
    };
  }

  async createProposal(payload: CreateTransferProposalDto) {
    await this.ensureSaveExists(payload.saveGameId);
    const player = await this.ensurePlayerExists(payload.playerId);

    if (payload.fromClubId) {
      await this.ensureClubExists(payload.fromClubId);
    }

    if (payload.toClubId) {
      await this.ensureClubExists(payload.toClubId);
    }

    await this.validateProposal(payload, player);

    const proposal = await this.proposalRepository.save({
      saveGameId: payload.saveGameId,
      playerId: payload.playerId,
      fromClubId: payload.fromClubId ?? player.clubId,
      toClubId: payload.toClubId ?? null,
      type: payload.type,
      amount: payload.amount ?? null,
      swapPlayerId: payload.swapPlayerId ?? null,
      status: TransferProposalStatus.PENDING,
      responseNote: payload.note ?? null,
    });

    if (payload.type === TransferType.RELEASE) {
      await this.playerRepository.update(player.id, { clubId: null });
      await this.listingRepository.upsert(
        {
          saveGameId: payload.saveGameId,
          playerId: player.id,
          clubId: null,
          askingPrice: 0,
          isLoanAvailable: false,
          isFreeAgent: true,
        },
        ['playerId'],
      );
      await this.proposalRepository.update(proposal.id, { status: TransferProposalStatus.ACCEPTED });
    }

    return this.proposalRepository.findOne({
      where: { id: proposal.id },
      relations: ['player', 'fromClub', 'toClub', 'swapPlayer'],
    });
  }

  async listProposals(query: QueryTransferProposalsDto) {
    const saveGame = await this.ensureSaveExists(query.saveGameId);
    const managedClubId = saveGame.clubId;

    const qb = this.proposalRepository
      .createQueryBuilder('proposal')
      .leftJoinAndSelect('proposal.player', 'player')
      .leftJoinAndSelect('proposal.fromClub', 'fromClub')
      .leftJoinAndSelect('proposal.toClub', 'toClub')
      .orderBy('proposal.createdAt', 'DESC');

    qb.where('proposal.saveGameId = :saveGameId', { saveGameId: query.saveGameId });

    if (query.scope === 'sent' && managedClubId) {
      qb.andWhere('proposal.toClubId = :managedClubId', { managedClubId });
      qb.andWhere('proposal.status IN (:...statuses)', {
        statuses: [TransferProposalStatus.PENDING, TransferProposalStatus.COUNTERED],
      });
    }

    if (query.scope === 'received' && managedClubId) {
      qb.andWhere('proposal.fromClubId = :managedClubId', { managedClubId });
      qb.andWhere('proposal.status IN (:...statuses)', {
        statuses: [TransferProposalStatus.PENDING, TransferProposalStatus.COUNTERED],
      });
    }

    if (query.scope === 'history') {
      qb.andWhere('proposal.status IN (:...statuses)', {
        statuses: [TransferProposalStatus.ACCEPTED, TransferProposalStatus.REJECTED, TransferProposalStatus.CANCELED],
      });
    }

    qb.skip((query.page - 1) * query.limit).take(query.limit);
    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  private async applyAcceptedTransfer(proposal: TransferProposal) {
    const player = await this.ensurePlayerExists(proposal.playerId);

    if (proposal.type === TransferType.PURCHASE || proposal.type === TransferType.SALE || proposal.type === TransferType.LOAN) {
      if (!proposal.toClubId) {
        throw new BadRequestException('Transferência aceita sem clube de destino');
      }

      await this.validateSquadLimit(proposal.toClubId);
      await this.playerRepository.update(player.id, { clubId: proposal.toClubId });

      if (proposal.type === TransferType.PURCHASE && proposal.amount) {
        const account = await this.accountRepository.findOneBy({ saveGameId: proposal.saveGameId });
        if (account) {
          if (Number(account.balance) < proposal.amount) {
            throw new BadRequestException('Saldo insuficiente para concluir compra');
          }
          await this.accountRepository.update(account.id, {
            balance: Number(account.balance) - proposal.amount,
          });
        }
      }
    }

    if (proposal.type === TransferType.SWAP) {
      if (!proposal.toClubId || !proposal.swapPlayerId) {
        throw new BadRequestException('Troca incompleta');
      }

      const swapPlayer = await this.ensurePlayerExists(proposal.swapPlayerId);
      const originClubId = player.clubId;

      await this.validateSquadLimit(proposal.toClubId);
      if (originClubId) {
        await this.validateSquadLimit(originClubId);
      }

      await this.playerRepository.update(player.id, { clubId: proposal.toClubId });
      await this.playerRepository.update(swapPlayer.id, { clubId: originClubId });
    }

    await this.listingRepository.delete({ playerId: proposal.playerId });
  }

  async respondProposal(proposalId: string, payload: RespondTransferProposalDto) {
    const proposal = await this.proposalRepository.findOne({ where: { id: proposalId } });
    if (!proposal) {
      throw new NotFoundException('Proposta não encontrada');
    }

    if (proposal.status !== TransferProposalStatus.PENDING && proposal.status !== TransferProposalStatus.COUNTERED) {
      throw new BadRequestException('Proposta já finalizada');
    }

    if (payload.action === 'reject') {
      await this.proposalRepository.update(proposalId, {
        status: TransferProposalStatus.REJECTED,
        responseNote: payload.note ?? null,
      });
    }

    if (payload.action === 'cancel') {
      await this.proposalRepository.update(proposalId, {
        status: TransferProposalStatus.CANCELED,
        responseNote: payload.note ?? null,
      });
    }

    if (payload.action === 'counter') {
      if (payload.counterAmount === undefined) {
        throw new BadRequestException('Contraproposta requer valor de contraproposta');
      }

      await this.proposalRepository.update(proposalId, {
        status: TransferProposalStatus.COUNTERED,
        amount: payload.counterAmount,
        responseNote: payload.note ?? null,
      });
    }

    if (payload.action === 'accept') {
      await this.applyAcceptedTransfer(proposal);
      await this.proposalRepository.update(proposalId, {
        status: TransferProposalStatus.ACCEPTED,
        responseNote: payload.note ?? null,
      });
    }

    return this.proposalRepository.findOne({
      where: { id: proposalId },
      relations: ['player', 'fromClub', 'toClub', 'swapPlayer'],
    });
  }
}
