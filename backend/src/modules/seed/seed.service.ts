import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClubService } from '../club/club.service';
import { CountryService } from '../country/country.service';
import { LeagueService } from '../league/league.service';
import { PlayerPosition } from '../player/entities/player.entity';
import { PlayerService } from '../player/player.service';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly countryService: CountryService,
    private readonly leagueService: LeagueService,
    private readonly clubService: ClubService,
    private readonly playerService: PlayerService,
  ) {}

  async onModuleInit() {
    const autoSeed = this.configService.get('AUTO_SEED', 'false');
    if (autoSeed === 'true') {
      this.logger.log('AUTO_SEED habilitado. Executando seed...');
      await this.seed();
    }
  }

  async seed() {
    this.logger.log('Iniciando seed do banco de dados...');

    try {
      // Verificar se já existe seed
      const existingCountries = await this.countryService.findPaginated(
        { page: 1, limit: 1 },
        {},
      );
      if (existingCountries.meta.total > 0) {
        this.logger.log('Dados já existem no banco. Seed ignorado.');
        return;
      }

      // 1. Criar Brasil
      const brazil = await this.countryService.createCountry({
        name: 'Brasil',
        code: 'BRA',
        flagEmoji: '🇧🇷',
      });
      this.logger.log(`País criado: ${brazil.name}`);

      // 2. Criar Brasileirão Série A
      const brasileirao = await this.leagueService.createLeague({
        name: 'Brasileirão Série A',
        countryId: brazil.id,
        division: 1,
        teamCount: 20,
      });
      this.logger.log(`Liga criada: ${brasileirao.name}`);

      // 3. Criar 4 clubes brasileiros icônicos
      const clubs = await Promise.all([
        this.clubService.createClub({
          name: 'Flamengo',
          abbreviation: 'FLA',
          leagueId: brasileirao.id,
          stadiumName: 'Maracanã',
          stadiumCapacity: 78838,
          budget: 50000000,
        }),
        this.clubService.createClub({
          name: 'Palmeiras',
          abbreviation: 'PAL',
          leagueId: brasileirao.id,
          stadiumName: 'Allianz Parque',
          stadiumCapacity: 43713,
          budget: 45000000,
        }),
        this.clubService.createClub({
          name: 'Corinthians',
          abbreviation: 'COR',
          leagueId: brasileirao.id,
          stadiumName: 'Neo Química Arena',
          stadiumCapacity: 49205,
          budget: 40000000,
        }),
        this.clubService.createClub({
          name: 'São Paulo',
          abbreviation: 'SAO',
          leagueId: brasileirao.id,
          stadiumName: 'Morumbi',
          stadiumCapacity: 66795,
          budget: 38000000,
        }),
      ]);
      this.logger.log(`${clubs.length} clubes criados`);

      // 4. Criar jogadores para cada clube (3 por clube como exemplo)
      const playerTemplates = [
        { position: PlayerPosition.GK, overall: 75, potential: 85 },
        { position: PlayerPosition.CB, overall: 78, potential: 88 },
        { position: PlayerPosition.ST, overall: 82, potential: 90 },
      ];

      const playerNames = [
        ['Santos Silva', 'Rodrigo Alves', 'Gabriel Mendes'],
        ['João Costa', 'Lucas Ferreira', 'Pedro Oliveira'],
        ['Marcos Souza', 'Rafael Lima', 'Bruno Cardoso'],
        ['Diego Martins', 'Felipe Rocha', 'André Pereira'],
      ];

      let totalPlayers = 0;
      for (let i = 0; i < clubs.length; i++) {
        const club = clubs[i];
        for (let j = 0; j < playerTemplates.length; j++) {
          const template = playerTemplates[j];
          await this.playerService.createPlayer({
            name: playerNames[i][j],
            age: 20 + Math.floor(Math.random() * 10),
            nationality: 'BRA',
            position: template.position,
            overall: template.overall + Math.floor(Math.random() * 5),
            potential: template.potential,
            clubId: club.id,
            value: 1000000 + Math.floor(Math.random() * 5000000),
            salary: 10000 + Math.floor(Math.random() * 50000),
          });
          totalPlayers++;
        }
      }
      this.logger.log(`${totalPlayers} jogadores criados`);

      this.logger.log('Seed concluído com sucesso!');
    } catch (error) {
      this.logger.error('Erro durante o seed:', error);
    }
  }
}
