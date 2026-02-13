import { CommonModule } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';
import { LiveTactic, MatchLiveSocketService } from '../../../../core/services/match-live-socket.service';

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

type TeamSide = 'home' | 'away';

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

            @if (detail()) {
              <p class="mt-2 text-lg font-bold text-emerald-300">
                {{ currentHomeScore() }} x {{ currentAwayScore() }}
              </p>
              <p class="text-xs text-slate-400">Minuto {{ visibleMinute() }} / 90</p>
            }

            @if (fixture()?.status === 'scheduled') {
              <button
                type="button"
                (click)="simulate()"
                [disabled]="simulating() || isPlaying()"
                class="mt-3 rounded bg-emerald-500 px-3 py-1 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Iniciar transmissão ao vivo
              </button>
            }
          </div>
        }

        @if (message()) {
          <p class="text-sm" [class.text-rose-300]="isError()" [class.text-emerald-300]="!isError()">{{ message() }}</p>
        }

        @if (detail()) {
          <div class="rounded-lg border border-slate-800 bg-slate-900 p-4">
            <h3 class="mb-3 text-lg font-semibold">Partida ao vivo — Animação 2D</h3>
            <div class="rounded border border-slate-800 bg-emerald-950/20 p-3">
              <div class="relative h-48 overflow-hidden rounded border border-emerald-700/40 bg-emerald-900/20">
                <div class="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-emerald-400/40"></div>
                <div class="absolute left-6 top-1/2 h-16 w-8 -translate-y-1/2 border border-emerald-400/50"></div>
                <div class="absolute right-6 top-1/2 h-16 w-8 -translate-y-1/2 border border-emerald-400/50"></div>
                <div class="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-400/40"></div>

                <div class="absolute left-8 top-8 h-2 w-2 rounded-full bg-sky-300"></div>
                <div class="absolute left-12 top-24 h-2 w-2 rounded-full bg-sky-300"></div>
                <div class="absolute left-20 top-16 h-2 w-2 rounded-full bg-sky-300"></div>

                <div class="absolute right-8 top-8 h-2 w-2 rounded-full bg-amber-300"></div>
                <div class="absolute right-12 top-24 h-2 w-2 rounded-full bg-amber-300"></div>
                <div class="absolute right-20 top-16 h-2 w-2 rounded-full bg-amber-300"></div>

                <div
                  class="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow"
                  [style.left.%]="ballPosition()"
                  [style.top.%]="ballVerticalPosition()"
                  style="transition: left 550ms ease, top 550ms ease"
                ></div>
              </div>

              <div class="mt-3 flex items-center justify-between text-xs text-slate-300">
                <span>Minuto {{ visibleMinute() }}'</span>
                <span>Tática casa: {{ homeTactic() }}</span>
                <span>Tática fora: {{ awayTactic() }}</span>
              </div>

              <div class="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  (click)="togglePlayback()"
                  class="rounded bg-emerald-500 px-3 py-1 text-xs font-semibold text-slate-950 hover:bg-emerald-400"
                >
                  {{ isPlaying() ? 'Pausar' : 'Iniciar' }}
                </button>
                <button
                  type="button"
                  (click)="stepMinute()"
                  class="rounded bg-slate-700 px-3 py-1 text-xs font-semibold hover:bg-slate-600"
                >
                  +1 min
                </button>
                <button
                  type="button"
                  (click)="resetPlayback()"
                  class="rounded bg-slate-700 px-3 py-1 text-xs font-semibold hover:bg-slate-600"
                >
                  Reiniciar
                </button>

                <div class="ml-2 flex items-center gap-1 text-xs">
                  <span class="text-slate-400">Velocidade</span>
                  <button
                    type="button"
                    (click)="setPlaybackSpeed(900)"
                    class="rounded px-2 py-1"
                    [class.bg-sky-500]="playbackSpeed() === 900"
                    [class.bg-slate-700]="playbackSpeedMs() !== 900"
                  >
                    1x
                  </button>
                  <button
                    type="button"
                    (click)="setPlaybackSpeed(500)"
                    class="rounded px-2 py-1"
                    [class.bg-sky-500]="playbackSpeed() === 500"
                    [class.bg-slate-700]="playbackSpeedMs() !== 500"
                  >
                    2x
                  </button>
                  <button
                    type="button"
                    (click)="setPlaybackSpeed(280)"
                    class="rounded px-2 py-1"
                    [class.bg-sky-500]="playbackSpeed() === 280"
                    [class.bg-slate-700]="playbackSpeedMs() !== 280"
                  >
                    3x
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="grid gap-5 lg:grid-cols-3">
            <div class="rounded-lg border border-slate-800 bg-slate-900 p-4 lg:col-span-2">
              <h3 class="mb-3 text-lg font-semibold">Partida ao vivo (texto)</h3>
              <div id="live-timeline" class="max-h-[420px] space-y-2 overflow-y-auto rounded bg-slate-950 p-3">
                @for (item of visibleTimeline(); track item.minute) {
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
              @if (isFinished()) {
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
              } @else {
                <p class="text-sm text-slate-400">Estatísticas finais serão exibidas ao término da simulação.</p>
              }

              <h4 class="mt-5 text-sm font-semibold text-slate-300">Ações do técnico (ao vivo)</h4>
              <div class="mt-2 grid gap-2">
                <button
                  type="button"
                  (click)="requestSubstitution('home')"
                  class="rounded bg-slate-700 px-3 py-1 text-left text-xs font-semibold hover:bg-slate-600"
                >
                  Substituição mandante
                </button>

                <button
                  type="button"
                  (click)="requestSubstitution('away')"
                  class="rounded bg-slate-700 px-3 py-1 text-left text-xs font-semibold hover:bg-slate-600"
                >
                  Substituição visitante
                </button>

                <button
                  type="button"
                  (click)="toggleHomeTactic()"
                  class="rounded bg-slate-700 px-3 py-1 text-left text-xs font-semibold hover:bg-slate-600"
                >
                  Trocar tática do mandante
                </button>

                <button
                  type="button"
                  (click)="toggleAwayTactic()"
                  class="rounded bg-slate-700 px-3 py-1 text-left text-xs font-semibold hover:bg-slate-600"
                >
                  Trocar tática do visitante
                </button>
              </div>
            </div>
          </div>

          <div class="rounded-lg border border-slate-800 bg-slate-900 p-4">
            <h3 class="mb-2 text-lg font-semibold">Timeline de eventos</h3>
            <div class="space-y-1 text-sm">
              @for (event of visibleEvents(); track event.minute + '-' + $index) {
                <p><span class="text-emerald-300">{{ event.minute }}'</span> {{ event.description }}</p>
              }
              @for (action of visibleCoachActions(); track action.minute + '-' + $index + '-' + action.type) {
                <p>
                  <span class="text-sky-300">{{ action.minute }}'</span>
                  {{ action.text }}
                </p>
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
  private readonly matchLiveSocket = inject(MatchLiveSocketService);

  readonly fixture = signal<Fixture | null>(null);
  readonly detail = signal<MatchDetail | null>(null);
  readonly simulating = signal(false);
  readonly message = signal<string | null>(null);
  readonly isError = signal(false);
  readonly loadingDetail = signal(false);
  readonly sessionStarted = signal(false);

  readonly liveState = this.matchLiveSocket.state;
  readonly socketError = this.matchLiveSocket.lastError;
  readonly preferredHomeTactic = signal<LiveTactic>('balanced');
  readonly preferredAwayTactic = signal<LiveTactic>('balanced');

  private readonly timelineScrollEffect = effect(() => {
    const minute = this.visibleMinute();
    if (minute <= 0) {
      return;
    }

    queueMicrotask(() => {
      const container = document.getElementById('live-timeline');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    });
  });

  ngOnInit() {
    const fixtureId = this.route.snapshot.paramMap.get('fixtureId');
    if (!fixtureId) return;

    this.loadStoredPlan(fixtureId);
    this.loadFixture(fixtureId);

    this.matchLiveSocket.joinMatch(fixtureId);
    setTimeout(() => {
      this.matchLiveSocket.control(fixtureId, 'reset');
      this.sessionStarted.set(false);
    }, 180);

    setTimeout(() => {
      if (!this.detail()) {
        this.loadDetail(fixtureId, false);
      }
    }, 250);
  }

  ngOnDestroy() {
    const fixtureId = this.fixture()?.id;
    if (fixtureId) {
      this.matchLiveSocket.control(fixtureId, 'pause');
    }
    this.matchLiveSocket.disconnect();
    this.timelineScrollEffect.destroy();
  }

  topRatings() {
    return [...(this.detail()?.ratings ?? [])].sort((a, b) => b.rating - a.rating).slice(0, 8);
  }

  currentHomeScore() {
    if (!this.sessionStarted()) return 0;
    return this.liveState()?.score.home ?? this.detail()?.match.homeScore ?? 0;
  }

  currentAwayScore() {
    if (!this.sessionStarted()) return 0;
    return this.liveState()?.score.away ?? this.detail()?.match.awayScore ?? 0;
  }

  isFinished() {
    return this.sessionStarted() && this.visibleMinute() >= 90;
  }

  visibleMinute() {
    if (!this.sessionStarted()) return 0;
    return this.liveState()?.minute ?? 0;
  }

  isPlaying() {
    return this.liveState()?.isPlaying ?? false;
  }

  playbackSpeed() {
    return this.liveState()?.speedMs ?? 900;
  }

  playbackSpeedMs() {
    return this.playbackSpeed();
  }

  homeTactic() {
    return this.liveState()?.tactics.home ?? 'balanced';
  }

  awayTactic() {
    return this.liveState()?.tactics.away ?? 'balanced';
  }

  visibleTimeline() {
    if (!this.sessionStarted()) return [];
    const minute = this.visibleMinute();
    return (this.detail()?.timeline ?? []).filter((item) => item.minute <= minute);
  }

  visibleEvents() {
    if (!this.sessionStarted()) return [];
    return this.liveState()?.events ?? [];
  }

  visibleCoachActions() {
    if (!this.sessionStarted()) return [];
    return this.liveState()?.coachActions ?? [];
  }

  ballPosition() {
    return this.liveState()?.ball.x ?? 50;
  }

  ballVerticalPosition() {
    return this.liveState()?.ball.y ?? 50;
  }

  requestSubstitution(side: TeamSide) {
    if (!this.sessionStarted()) return;
    const fixtureId = this.fixture()?.id;
    if (!fixtureId) return;

    this.matchLiveSocket.coachAction(fixtureId, {
      team: side,
      type: 'substitution',
    });
  }

  toggleHomeTactic() {
    if (!this.sessionStarted()) return;
    const fixtureId = this.fixture()?.id;
    if (!fixtureId) return;

    this.matchLiveSocket.coachAction(fixtureId, {
      team: 'home',
      type: 'tactic',
      tactic: this.nextTactic(this.homeTactic()),
    });
  }

  toggleAwayTactic() {
    if (!this.sessionStarted()) return;
    const fixtureId = this.fixture()?.id;
    if (!fixtureId) return;

    this.matchLiveSocket.coachAction(fixtureId, {
      team: 'away',
      type: 'tactic',
      tactic: this.nextTactic(this.awayTactic()),
    });
  }

  togglePlayback() {
    const fixtureId = this.fixture()?.id;
    if (!fixtureId) return;

    if (this.isPlaying()) {
      this.matchLiveSocket.control(fixtureId, 'pause');
      return;
    }

    const action = this.visibleMinute() > 1 ? 'resume' : 'start';
    this.matchLiveSocket.control(fixtureId, action);
    this.sessionStarted.set(true);

    if (!this.detail()) {
      this.loadDetail(fixtureId, false);
    }
  }

  stepMinute() {
    const fixtureId = this.fixture()?.id;
    if (!fixtureId) return;

    this.matchLiveSocket.control(fixtureId, 'step');
    this.sessionStarted.set(true);

    if (!this.detail()) {
      this.loadDetail(fixtureId, false);
    }
  }

  resetPlayback() {
    const fixtureId = this.fixture()?.id;
    if (!fixtureId) return;

    this.matchLiveSocket.control(fixtureId, 'reset');
    this.sessionStarted.set(false);
  }

  setPlaybackSpeed(value: number) {
    const fixtureId = this.fixture()?.id;
    if (!fixtureId) return;
    this.matchLiveSocket.control(fixtureId, 'speed', value);
  }

  simulate() {
    const fixtureId = this.fixture()?.id;
    if (!fixtureId) return;

    this.simulating.set(true);
    this.matchLiveSocket.control(fixtureId, 'start');
    this.sessionStarted.set(true);
    this.loadDetail(fixtureId, false);
    this.message.set('Transmissão iniciada pelo backend em tempo real.');
    this.isError.set(false);
    setTimeout(() => {
      this.loadFixture(fixtureId);
      this.simulating.set(false);
    }, 250);
  }

  private loadFixture(fixtureId: string) {
    this.api.get<Fixture>(`competitions/fixtures/${fixtureId}`).subscribe({
      next: (fixture) => {
        this.fixture.set(fixture);
        if (fixture.status === 'played' || this.liveState()) {
          this.loadDetail(fixtureId, false);
          return;
        }

        this.detail.set(null);
      },
    });
  }

  private loadDetail(fixtureId: string, notifyError: boolean) {
    if (this.loadingDetail()) {
      return;
    }

    this.loadingDetail.set(true);
    this.api.getSilently<MatchDetail>(`matches/fixtures/${fixtureId}`).subscribe({
      next: (detail) => {
        this.detail.set(detail);
        this.loadingDetail.set(false);
      },
      error: () => {
        if (notifyError) {
          this.message.set('Partida ainda sem detalhes disponíveis.');
          this.isError.set(true);
        }
        this.loadingDetail.set(false);
      },
    });
  }

  private nextTactic(current: LiveTactic): LiveTactic {
    if (current === 'defensive') return 'balanced';
    if (current === 'balanced') return 'attacking';
    return 'defensive';
  }

  private loadStoredPlan(fixtureId: string) {
    const raw = window.localStorage.getItem(`bitfoot.matchplan.${fixtureId}`);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as {
        homeMentality?: LiveTactic;
        awayMentality?: LiveTactic;
      };
      if (parsed.homeMentality) this.preferredHomeTactic.set(parsed.homeMentality);
      if (parsed.awayMentality) this.preferredAwayTactic.set(parsed.awayMentality);
    } catch {
      this.message.set('Plano tático local inválido, usando padrão realtime do backend.');
    }
  }
}
