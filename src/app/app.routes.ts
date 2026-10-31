import type { Routes } from '@angular/router';

/**
 * Every page is a separate chunk. `PreloadAllModules` (see `app.config.ts`) fetches them
 * after the first paint, so navigation stays instant without paying for them up front.
 */
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/shell/shell.component').then((m) => m.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.page').then((m) => m.default),
      },
      {
        path: 'tasks',
        loadComponent: () => import('./features/tasks/tasks.page').then((m) => m.default),
      },
      {
        path: 'calendar',
        loadComponent: () => import('./features/calendar/calendar.page').then((m) => m.default),
      },
      {
        path: 'analytics',
        loadComponent: () => import('./features/analytics/analytics.page').then((m) => m.default),
      },
      {
        path: 'team',
        loadComponent: () => import('./features/team/team.page').then((m) => m.default),
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/settings/settings.page').then((m) => m.default),
      },
      {
        path: '**',
        loadComponent: () => import('./features/not-found/not-found.page').then((m) => m.default),
      },
    ],
  },
];
