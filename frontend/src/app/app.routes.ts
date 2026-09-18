import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/trials/pages/trials-search.page').then((m) => m.TrialsSearchPage),
  },
  {
    path: 'trials/:trialId',
    loadComponent: () =>
      import('./features/trials/pages/trial-details.page').then((m) => m.TrialDetailsPage),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
