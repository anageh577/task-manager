import type { Routes } from '@angular/router';
import { ShellComponent } from './layout/shell/shell.component';
import DashboardPage from './features/dashboard/dashboard.page';
import TasksPage from './features/tasks/tasks.page';
import CalendarPage from './features/calendar/calendar.page';
import AnalyticsPage from './features/analytics/analytics.page';
import TeamPage from './features/team/team.page';
import SettingsPage from './features/settings/settings.page';
import NotFoundPage from './features/not-found/not-found.page';

export const routes: Routes = [
  {
    path: '',
    component: ShellComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        component: DashboardPage,
      },
      {
        path: 'tasks',
        component: TasksPage,
      },
      {
        path: 'calendar',
        component: CalendarPage,
      },
      {
        path: 'analytics',
        component: AnalyticsPage,
      },
      {
        path: 'team',
        component: TeamPage,
      },
      {
        path: 'settings',
        component: SettingsPage,
      },
      { path: '**', component: NotFoundPage },
    ],
  },
];
