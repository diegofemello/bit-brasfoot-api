import { Routes } from '@angular/router';
import { LoadGamePage } from './features/main-menu/pages/load-game/load-game.page';
import { MainMenuPage } from './features/main-menu/pages/main-menu/main-menu.page';
import { NewGamePage } from './features/main-menu/pages/new-game/new-game.page';

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
    path: 'load-game',
    component: LoadGamePage,
  },
  {
    path: '**',
    redirectTo: 'menu',
  },
];
