import { Routes } from '@angular/router';
import { DashboardPage } from './features/game/pages/dashboard/dashboard.page';
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
    path: '**',
    redirectTo: 'menu',
  },
];
