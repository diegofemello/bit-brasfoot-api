import { Routes } from '@angular/router';
import { DashboardPage } from './features/game/pages/dashboard/dashboard.page';
import { CompetitionsPage } from './features/game/pages/competitions/competitions.page';
import { FinancesPage } from './features/game/pages/finances/finances.page';
import { InfrastructurePage } from './features/game/pages/infrastructure/infrastructure.page';
import { MatchDayPage } from './features/game/pages/match-day/match-day.page';
import { PlayerDetailPage } from './features/game/pages/player-detail/player-detail.page';
import { SquadPage } from './features/game/pages/squad/squad.page';
import { TacticsPage } from './features/game/pages/tactics/tactics.page';
import { TransfersPage } from './features/game/pages/transfers/transfers.page';
import { LoadGamePage } from './features/main-menu/pages/load-game/load-game.page';
import { MainMenuPage } from './features/main-menu/pages/main-menu/main-menu.page';
import { NewGamePage } from './features/main-menu/pages/new-game/new-game.page';
import { SelectClubPage } from './features/main-menu/pages/select-club/select-club.page';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'menu',
  },
  {
    path: 'menu',
    component: MainMenuPage,
  },
  {
    path: 'new-game',
    component: NewGamePage,
  },
  {
    path: 'select-club',
    component: SelectClubPage,
  },
  {
    path: 'load-game',
    component: LoadGamePage,
  },
  {
    path: 'dashboard',
    component: DashboardPage,
  },
  {
    path: 'squad',
    component: SquadPage,
  },
  {
    path: 'players/:id',
    component: PlayerDetailPage,
  },
  {
    path: 'tactics',
    component: TacticsPage,
  },
  {
    path: 'finances',
    component: FinancesPage,
  },
  {
    path: 'infrastructure',
    component: InfrastructurePage,
  },
  {
    path: 'transfers',
    component: TransfersPage,
  },
  {
    path: 'competitions',
    component: CompetitionsPage,
  },
  {
    path: 'match-day/:fixtureId',
    component: MatchDayPage,
  },
  {
    path: '**',
    redirectTo: 'menu',
  },
];
