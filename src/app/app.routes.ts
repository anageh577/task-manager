import type { Routes } from '@angular/router';
import { ShellComponent } from './layout/shell/shell.component';
import DashboardPage from './features/dashboard/dashboard.page';

export const routes: Routes = [
  {
    path: '',
    component: ShellComponent,
    children: [
      {
        path: 'dashboard',
        component: DashboardPage,
      },
    ],
  },
];
