import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Club } from '../club/entities/club.entity';
import { ClubService } from '../club/club.service';
import { CountryService } from '../country/country.service';
import { LeagueService } from '../league/league.service';
import { PlayerPosition } from '../player/entities/player.entity';
import { PlayerService } from '../player/player.service';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);
  private readonly worldSeed = [
    {
      country: { name: 'Brasil', code: 'BRA', flagEmoji: '🇧🇷' },
      league: { name: 'Brasileirão Série A', division: 1, teamCount: 20 },
      clubs: [
        { name: 'Flamengo', abbreviation: 'FLA', stadiumName: 'Maracanã', stadiumCapacity: 78838, budget: 50000000 },
        { name: 'Palmeiras', abbreviation: 'PAL', stadiumName: 'Allianz Parque', stadiumCapacity: 43713, budget: 45000000 },
        { name: 'Corinthians', abbreviation: 'COR', stadiumName: 'Neo Química Arena', stadiumCapacity: 49205, budget: 40000000 },
        { name: 'São Paulo', abbreviation: 'SAO', stadiumName: 'Morumbi', stadiumCapacity: 66795, budget: 38000000 },
      ],
    },
    {
      country: { name: 'Argentina', code: 'ARG', flagEmoji: '🇦🇷' },
      league: { name: 'Liga Profesional Argentina', division: 1, teamCount: 28 },
      clubs: [
        { name: 'River Plate', abbreviation: 'RIV', stadiumName: 'Monumental', stadiumCapacity: 84567, budget: 42000000 },
        { name: 'Boca Juniors', abbreviation: 'BOC', stadiumName: 'La Bombonera', stadiumCapacity: 54000, budget: 41000000 },
        { name: 'Racing Club', abbreviation: 'RAC', stadiumName: 'El Cilindro', stadiumCapacity: 51389, budget: 28000000 },
        { name: 'San Lorenzo', abbreviation: 'SLO', stadiumName: 'Nuevo Gasómetro', stadiumCapacity: 47964, budget: 24000000 },
      ],
    },
    {
      country: { name: 'Inglaterra', code: 'ENG', flagEmoji: '🏴' },
      league: { name: 'Premier League', division: 1, teamCount: 20 },
      clubs: [
        { name: 'Manchester City', abbreviation: 'MCI', stadiumName: 'Etihad Stadium', stadiumCapacity: 53400, budget: 120000000 },
        { name: 'Liverpool', abbreviation: 'LIV', stadiumName: 'Anfield', stadiumCapacity: 61276, budget: 95000000 },
        { name: 'Arsenal', abbreviation: 'ARS', stadiumName: 'Emirates Stadium', stadiumCapacity: 60704, budget: 90000000 },
        { name: 'Chelsea', abbreviation: 'CHE', stadiumName: 'Stamford Bridge', stadiumCapacity: 40341, budget: 85000000 },
      ],
    },
    {
      country: { name: 'Espanha', code: 'ESP', flagEmoji: '🇪🇸' },
      league: { name: 'LaLiga', division: 1, teamCount: 20 },
      clubs: [
        { name: 'Real Madrid', abbreviation: 'RMA', stadiumName: 'Santiago Bernabéu', stadiumCapacity: 81044, budget: 130000000 },
        { name: 'Barcelona', abbreviation: 'BAR', stadiumName: 'Spotify Camp Nou', stadiumCapacity: 99354, budget: 125000000 },
        { name: 'Atlético de Madrid', abbreviation: 'ATM', stadiumName: 'Metropolitano', stadiumCapacity: 70460, budget: 80000000 },
        { name: 'Sevilla', abbreviation: 'SEV', stadiumName: 'Ramón Sánchez Pizjuán', stadiumCapacity: 43883, budget: 50000000 },
      ],
    },
    {
      country: { name: 'Itália', code: 'ITA', flagEmoji: '🇮🇹' },
      league: { name: 'Serie A', division: 1, teamCount: 20 },
      clubs: [
        { name: 'Juventus', abbreviation: 'JUV', stadiumName: 'Allianz Stadium', stadiumCapacity: 41507, budget: 90000000 },
        { name: 'Inter de Milão', abbreviation: 'INT', stadiumName: 'San Siro', stadiumCapacity: 75923, budget: 95000000 },
        { name: 'Milan', abbreviation: 'MIL', stadiumName: 'San Siro', stadiumCapacity: 75923, budget: 90000000 },
        { name: 'Napoli', abbreviation: 'NAP', stadiumName: 'Diego Armando Maradona', stadiumCapacity: 54726, budget: 65000000 },
      ],
    },
    {
      country: { name: 'Alemanha', code: 'GER', flagEmoji: '🇩🇪' },
      league: { name: 'Bundesliga', division: 1, teamCount: 18 },
      clubs: [
        { name: 'Bayern München', abbreviation: 'BAY', stadiumName: 'Allianz Arena', stadiumCapacity: 75000, budget: 120000000 },
        { name: 'Borussia Dortmund', abbreviation: 'BVB', stadiumName: 'Signal Iduna Park', stadiumCapacity: 81365, budget: 85000000 },
        { name: 'RB Leipzig', abbreviation: 'RBL', stadiumName: 'Red Bull Arena', stadiumCapacity: 47069, budget: 70000000 },
        { name: 'Bayer Leverkusen', abbreviation: 'B04', stadiumName: 'BayArena', stadiumCapacity: 30210, budget: 65000000 },
      ],
    },
  ] as const;

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

      let totalLeagues = 0;
      let totalClubs = 0;
      let totalPlayers = 0;

      for (const worldItem of this.worldSeed) {
        const country = await this.countryService.createCountry(worldItem.country);
        const league = await this.leagueService.createLeague({
          name: worldItem.league.name,
          countryId: country.id,
          division: worldItem.league.division,
          teamCount: worldItem.league.teamCount,
        });

        totalLeagues++;
        this.logger.log(`Liga criada: ${league.name} (${country.name})`);

        const createdClubs: Club[] = [];
        for (const clubData of worldItem.clubs) {
          const club = await this.clubService.createClub({
            ...clubData,
            leagueId: league.id,
          });

          createdClubs.push(club);
          totalClubs++;
        }

        for (let clubIndex = 0; clubIndex < createdClubs.length; clubIndex++) {
          const club = createdClubs[clubIndex];
          const playerTemplates = [
            { position: PlayerPosition.GK, overall: 75, potential: 84 },
            { position: PlayerPosition.CB, overall: 77, potential: 85 },
            { position: PlayerPosition.CM, overall: 78, potential: 86 },
            { position: PlayerPosition.ST, overall: 80, potential: 88 },
          ];

          for (let playerIndex = 0; playerIndex < playerTemplates.length; playerIndex++) {
            const template = playerTemplates[playerIndex];
            const base = clubIndex * 4 + playerIndex + 1;
            const ageByTemplate = [23, 27, 31, 34];
            await this.playerService.createPlayer({
              name: `${club.abbreviation} Player ${base}`,
              age: ageByTemplate[playerIndex] ?? 27,
              nationality: worldItem.country.code,
              position: template.position,
              overall: template.overall + (playerIndex % 2),
              potential: template.potential + (clubIndex % 2),
              clubId: club.id,
              value: 1500000 + base * 350000,
              salary: 12000 + base * 1400,
            });
            totalPlayers++;
          }
        }
      }

      this.logger.log(
        `Seed criado: ${this.worldSeed.length} países, ${totalLeagues} ligas, ${totalClubs} clubes, ${totalPlayers} jogadores`,
      );

      this.logger.log('Seed concluído com sucesso!');
    } catch (error) {
      this.logger.error('Erro durante o seed:', error);
      throw error;
    }
  }
}
