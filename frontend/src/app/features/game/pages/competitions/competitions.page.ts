import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';
import { GameStateService } from '../../../../core/services/game-state.service';

interface SaveCompetition {
  seasonId: string;
  competitionId: string;
  competitionName: string;
  competitionType: 'league' | 'cup' | 'continental';
  seasonYear: number;
  currentRound: number;
  totalRounds: number;
  status: 'ongoing' | 'finished';
}

interface Standing {
  id: string;
  position: number;
  points: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  club: {
    id: string;
    name: string;
  };
}

interface Fixture {
  id: string;
  round: number;
  matchDate: string;
  status: 'scheduled' | 'played';
  homeScore: number | null;
  awayScore: number | null;
  homeClub: {
    id: string;
    name: string;
  };
  awayClub: {
    id: string;
    name: string;
  };
}

interface FixtureResponse {
  data: Fixture[];
  availableRounds: number[];
}

interface TopScorer {
  playerId: string;
  name: string;
  clubId: string | null;
  clubName: string;
  goals: number;
}

@Component({
  selector: 'app-competitions-page',
  imports: [CommonModule, RouterLink],
  template: `
    <main class="min-h-screen bg-slate-950 text-slate-100">
      <section class="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-10">
        <div class="flex items-center justify-between">
          <h1 class="text-2xl font-bold">Competições</h1>
          <a routerLink="/dashboard" class="text-sm text-emerald-300 hover:text-emerald-200">Voltar</a>
        </div>

        @if (feedback()) {
          <p class="text-sm" [class.text-emerald-300]="!feedbackError()" [class.text-rose-300]="feedbackError()">
            {{ feedback() }}
          </p>
        }

        <div class="rounded-lg border border-slate-800 bg-slate-900 p-4">
          <div class="mb-3 flex items-center justify-between">
            <h2 class="text-lg font-semibold">Competições do save</h2>
            <button
              type="button"
              (click)="setupCompetitions()"
              class="rounded bg-emerald-500 px-3 py-1 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
            >
              Gerar calendário
            </button>
          </div>

          <div class="grid gap-2">
            @for (competition of competitions(); track competition.seasonId) {
              <button
                type="button"
                (click)="selectSeason(competition.seasonId)"
                class="rounded border px-3 py-2 text-left"
                [class.border-emerald-400]="selectedSeasonId() === competition.seasonId"
                [class.border-slate-700]="selectedSeasonId() !== competition.seasonId"
              >
                <p class="font-semibold">{{ competition.competitionName }}</p>
                <p class="text-xs text-slate-400">
                  Temporada {{ competition.seasonYear }} • Rodada {{ competition.currentRound }}/{{ competition.totalRounds }}
                </p>
              </button>
            }
            @if (competitions().length === 0) {
              <p class="text-sm text-slate-400">Nenhuma competição gerada para este save.</p>
            }
          </div>
        </div>

        @if (selectedCompetition()) {
          <div class="grid gap-6 lg:grid-cols-3">
            <div class="rounded-lg border border-slate-800 bg-slate-900 p-4 lg:col-span-2">
              <h3 class="mb-3 text-lg font-semibold">Tabela de classificação</h3>
              <div class="overflow-x-auto">
                <table class="w-full min-w-[760px] border-collapse text-sm">
                  <thead class="text-left text-xs text-slate-400">
                    <tr>
                      <th class="border-b border-slate-800 px-2 py-2">#</th>
                      <th class="border-b border-slate-800 px-2 py-2">Clube</th>
                      <th class="border-b border-slate-800 px-2 py-2">PTS</th>
                      <th class="border-b border-slate-800 px-2 py-2">J</th>
                      <th class="border-b border-slate-800 px-2 py-2">V</th>
                      <th class="border-b border-slate-800 px-2 py-2">E</th>
                      <th class="border-b border-slate-800 px-2 py-2">D</th>
                      <th class="border-b border-slate-800 px-2 py-2">GP</th>
                      <th class="border-b border-slate-800 px-2 py-2">GC</th>
                      <th class="border-b border-slate-800 px-2 py-2">SG</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (item of standings(); track item.id) {
                      <tr class="odd:bg-slate-950/60" [class.bg-emerald-500/10]="item.position <= 4" [class.bg-rose-500/10]="item.position > standings().length - 2">
                        <td class="px-2 py-2">{{ item.position }}</td>
                        <td class="px-2 py-2">{{ item.club.name }}</td>
                        <td class="px-2 py-2 font-semibold">{{ item.points }}</td>
                        <td class="px-2 py-2">{{ item.played }}</td>
                        <td class="px-2 py-2">{{ item.wins }}</td>
                        <td class="px-2 py-2">{{ item.draws }}</td>
                        <td class="px-2 py-2">{{ item.losses }}</td>
                        <td class="px-2 py-2">{{ item.goalsFor }}</td>
                        <td class="px-2 py-2">{{ item.goalsAgainst }}</td>
                        <td class="px-2 py-2">{{ item.goalDifference }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>

            <div class="rounded-lg border border-slate-800 bg-slate-900 p-4">
              <h3 class="mb-3 text-lg font-semibold">Artilharia</h3>
              <div class="grid gap-2">
                @for (item of topScorers(); track item.playerId) {
                  <div class="rounded bg-slate-950 px-3 py-2 text-sm">
                    <p class="font-semibold">{{ item.name }}</p>
                    <p class="text-xs text-slate-400">{{ item.clubName }}</p>
                    <p class="text-xs text-emerald-300">{{ item.goals }} gols</p>
                  </div>
                }
              </div>
            </div>
          </div>

          <div class="rounded-lg border border-slate-800 bg-slate-900 p-4">
            <div class="mb-3 flex items-center justify-between">
              <h3 class="text-lg font-semibold">Calendário de jogos</h3>
              <select
                [value]="selectedRound()"
                (change)="changeRound(+$any($event.target).value)"
                class="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
              >
                @for (round of rounds(); track round) {
                  <option [value]="round">Rodada {{ round }}</option>
                }
              </select>
            </div>

            <div class="grid gap-2">
              @for (fixture of fixtures(); track fixture.id) {
                <div class="flex items-center justify-between rounded bg-slate-950 px-3 py-2 text-sm">
                  <div class="text-xs text-slate-400">{{ fixture.matchDate }}</div>
                  <div class="font-semibold">{{ fixture.homeClub.name }} x {{ fixture.awayClub.name }}</div>
                  <div class="text-xs" [class.text-slate-400]="fixture.status === 'scheduled'" [class.text-emerald-300]="fixture.status === 'played'">
                    {{ fixture.status === 'scheduled' ? 'Agendado' : (fixture.homeScore + ' x ' + fixture.awayScore) }}
                  </div>
                </div>
              }
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div class="rounded-lg border border-slate-800 bg-slate-900 p-4">
              <h3 class="mb-2 text-sm font-semibold text-slate-300">Fase de grupos</h3>
              <p class="text-sm text-slate-400">Não aplicável para competição de liga nesta fase.</p>
            </div>
            <div class="rounded-lg border border-slate-800 bg-slate-900 p-4">
              <h3 class="mb-2 text-sm font-semibold text-slate-300">Chave mata-mata</h3>
              <p class="text-sm text-slate-400">Disponível nas próximas competições de copa.</p>
            </div>
          </div>
        }
      </section>
    </main>
  `,
})
export class CompetitionsPage {
  private readonly apiService = inject(ApiService);
  private readonly gameState = inject(GameStateService);
  private readonly router = inject(Router);

  readonly competitions = signal<SaveCompetition[]>([]);
  readonly selectedSeasonId = signal<string | null>(null);
  readonly standings = signal<Standing[]>([]);
  readonly fixtures = signal<Fixture[]>([]);
  readonly rounds = signal<number[]>([]);
  readonly selectedRound = signal<number>(1);
  readonly topScorers = signal<TopScorer[]>([]);

  readonly feedback = signal<string | null>(null);
  readonly feedbackError = signal(false);

  readonly selectedCompetition = computed(() =>
    this.competitions().find((competition) => competition.seasonId === this.selectedSeasonId()) ?? null,
  );

  ngOnInit() {
    if (!this.gameState.selectedSaveGameId()) {
      void this.router.navigateByUrl('/dashboard');
      return;
    }

    this.loadCompetitions();
  }

  loadCompetitions() {
    const saveGameId = this.gameState.selectedSaveGameId();
    if (!saveGameId) return;

    this.apiService.get<SaveCompetition[]>(`competitions/save/${saveGameId}`).subscribe({
      next: (competitions) => {
        this.competitions.set(competitions);
        const firstSeasonId = competitions[0]?.seasonId ?? null;
        this.selectedSeasonId.set(firstSeasonId);
        if (firstSeasonId) {
          this.loadSeasonData(firstSeasonId);
        }
      },
      error: () => this.setFeedback('Falha ao carregar competições.', true),
    });
  }

  setupCompetitions() {
    const saveGameId = this.gameState.selectedSaveGameId();
    if (!saveGameId) return;

    this.apiService.post<SaveCompetition[]>(`competitions/save/${saveGameId}/setup`, {}).subscribe({
      next: () => {
        this.setFeedback('Calendário e competição gerados com sucesso.', false);
        this.loadCompetitions();
      },
      error: (err) => this.setFeedback(this.extractErrorMessage(err, 'Falha ao gerar calendário.'), true),
    });
  }

  selectSeason(seasonId: string) {
    this.selectedSeasonId.set(seasonId);
    this.loadSeasonData(seasonId);
  }

  changeRound(round: number) {
    this.selectedRound.set(round);
    const seasonId = this.selectedSeasonId();
    if (!seasonId) return;

    this.loadFixtures(seasonId, round);
  }

  private loadSeasonData(seasonId: string) {
    this.loadStandings(seasonId);
    this.loadFixtures(seasonId);
    this.loadTopScorers(seasonId);
  }

  private loadStandings(seasonId: string) {
    this.apiService.get<Standing[]>(`competitions/seasons/${seasonId}/standings`).subscribe({
      next: (standings) => this.standings.set(standings),
      error: () => this.setFeedback('Falha ao carregar classificação.', true),
    });
  }

  private loadFixtures(seasonId: string, round?: number) {
    this.apiService
      .get<FixtureResponse>(`competitions/seasons/${seasonId}/fixtures`, {
        round: round ?? this.selectedRound(),
      })
      .subscribe({
        next: (response) => {
          this.fixtures.set(response.data);
          this.rounds.set(response.availableRounds);

          if (!round && response.availableRounds.length > 0) {
            const firstRound = response.availableRounds[0];
            this.selectedRound.set(firstRound);
            this.loadFixtures(seasonId, firstRound);
          }
        },
        error: () => this.setFeedback('Falha ao carregar calendário.', true),
      });
  }

  private loadTopScorers(seasonId: string) {
    this.apiService
      .get<TopScorer[]>(`competitions/seasons/${seasonId}/top-scorers`, {
        limit: 10,
      })
      .subscribe({
        next: (topScorers) => this.topScorers.set(topScorers),
        error: () => this.setFeedback('Falha ao carregar artilharia.', true),
      });
  }

  private setFeedback(message: string, isError: boolean) {
    this.feedback.set(message);
    this.feedbackError.set(isError);
  }

  private extractErrorMessage(err: unknown, fallback: string) {
    const message = (err as { error?: { error?: { message?: string | string[] } } })?.error?.error?.message;
    if (Array.isArray(message) && message.length > 0) {
      return message[0];
    }
    if (typeof message === 'string' && message.length > 0) {
      return message;
    }
    return fallback;
  }
}
