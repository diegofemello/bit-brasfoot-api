import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';

interface Fixture {
  id: string;
  matchDate: string;
  status: 'scheduled' | 'played';
  homeScore: number | null;
  awayScore: number | null;
  homeClub: { id: string; name: string };
  awayClub: { id: string; name: string };
}

interface MatchDetail {
  match: {
    id: string;
    homeScore: number;
    awayScore: number;
    homePossession: number;
    awayPossession: number;
    homeShots: number;
    awayShots: number;
  };
  timeline: Array<{ minute: number; homeScore: number; awayScore: number; commentary: string }>;
  events: Array<{ minute: number; description: string }>;
  ratings: Array<{ rating: number; player: { name: string } }>;
}

@Component({
  selector: 'app-match-day-page',
  imports: [CommonModule, RouterLink],
  template: `
    <main class="min-h-screen bg-slate-950 px-6 py-8 text-slate-100">
      <section class="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <div class="flex items-center justify-between">
          <h1 class="text-2xl font-bold">Dia de Jogo</h1>
          <a routerLink="/competitions" class="text-sm text-emerald-300 hover:text-emerald-200">Voltar</a>
        </div>

        @if (fixture()) {
          <div class="rounded-lg border border-slate-800 bg-slate-900 p-4">
            <p class="text-sm text-slate-400">{{ fixture()?.matchDate }}</p>
            <h2 class="mt-1 text-xl font-semibold">
              {{ fixture()?.homeClub?.name }} x {{ fixture()?.awayClub?.name }}
            </h2>

            @if (fixture()?.status === 'played' && detail()) {
              <p class="mt-2 text-lg font-bold text-emerald-300">
                {{ detail()?.match?.homeScore }} x {{ detail()?.match?.awayScore }}
              </p>
            }

            @if (fixture()?.status === 'scheduled') {
              <button
                type="button"
                (click)="simulate()"
                [disabled]="simulating()"
                class="mt-3 rounded bg-emerald-500 px-3 py-1 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Simular partida
              </button>
            }
          </div>
        }

        @if (message()) {
          <p class="text-sm" [class.text-rose-300]="isError()" [class.text-emerald-300]="!isError()">{{ message() }}</p>
        }

        @if (detail()) {
          <div class="grid gap-5 lg:grid-cols-3">
            <div class="rounded-lg border border-slate-800 bg-slate-900 p-4 lg:col-span-2">
              <h3 class="mb-3 text-lg font-semibold">Partida ao vivo (texto)</h3>
              <div class="max-h-[420px] space-y-2 overflow-y-auto rounded bg-slate-950 p-3">
                @for (item of detail()?.timeline || []; track item.minute) {
                  <div class="text-sm">
                    <span class="font-semibold text-emerald-300">{{ item.minute }}'</span>
                    <span class="ml-2">{{ item.commentary }}</span>
                    <span class="ml-2 text-xs text-slate-400">({{ item.homeScore }} x {{ item.awayScore }})</span>
                  </div>
                }
              </div>
            </div>

            <div class="rounded-lg border border-slate-800 bg-slate-900 p-4">
              <h3 class="mb-3 text-lg font-semibold">Pós-jogo</h3>
              <div class="space-y-1 text-sm">
                <p>Posse: {{ detail()?.match?.homePossession }}% x {{ detail()?.match?.awayPossession }}%</p>
                <p>Finalizações: {{ detail()?.match?.homeShots }} x {{ detail()?.match?.awayShots }}</p>
              </div>

              <h4 class="mt-4 text-sm font-semibold text-slate-300">Destaques (notas)</h4>
              <div class="mt-2 space-y-1 text-sm">
                @for (rating of topRatings(); track rating.player.name) {
                  <p>{{ rating.player.name }} — {{ rating.rating }}</p>
                }
              </div>
            </div>
          </div>

          <div class="rounded-lg border border-slate-800 bg-slate-900 p-4">
            <h3 class="mb-2 text-lg font-semibold">Timeline de eventos</h3>
            <div class="space-y-1 text-sm">
              @for (event of detail()?.events || []; track event.description + event.minute) {
                <p><span class="text-emerald-300">{{ event.minute }}'</span> {{ event.description }}</p>
              }
            </div>
          </div>
        }
      </section>
    </main>
  `,
})
export class MatchDayPage {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);

  readonly fixture = signal<Fixture | null>(null);
  readonly detail = signal<MatchDetail | null>(null);
  readonly simulating = signal(false);
  readonly message = signal<string | null>(null);
  readonly isError = signal(false);

  ngOnInit() {
    const fixtureId = this.route.snapshot.paramMap.get('fixtureId');
    if (!fixtureId) return;

    this.loadFixture(fixtureId);
    this.loadDetail(fixtureId, false);
  }

  topRatings() {
    return [...(this.detail()?.ratings ?? [])].sort((a, b) => b.rating - a.rating).slice(0, 8);
  }

  simulate() {
    const fixtureId = this.fixture()?.id;
    if (!fixtureId) return;

    this.simulating.set(true);
    this.api.post(`matches/fixtures/${fixtureId}/simulate`, {}).subscribe({
      next: () => {
        this.message.set('Partida simulada com sucesso.');
        this.isError.set(false);
        this.loadFixture(fixtureId);
        this.loadDetail(fixtureId, true);
        this.simulating.set(false);
      },
      error: () => {
        this.message.set('Falha ao simular a partida.');
        this.isError.set(true);
        this.simulating.set(false);
      },
    });
  }

  private loadFixture(fixtureId: string) {
    this.api.get<Fixture>(`competitions/fixtures/${fixtureId}`).subscribe({
      next: (fixture) => this.fixture.set(fixture),
    });
  }

  private loadDetail(fixtureId: string, notifyError: boolean) {
    this.api.getSilently<MatchDetail>(`matches/fixtures/${fixtureId}`).subscribe({
      next: (detail) => this.detail.set(detail),
      error: () => {
        if (notifyError) {
          this.message.set('Partida ainda sem detalhes disponíveis.');
          this.isError.set(true);
        }
      },
    });
  }
}
