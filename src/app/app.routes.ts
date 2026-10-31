import type { Routes } from '@angular/router';
import { ShellComponent } from './layout/shell/shell.component';
import DashboardPage from './features/dashboard/dashboard.page';
import TasksPage from './features/tasks/tasks.page';
import CalendarPage from './features/calendar/calendar.page';

export const routes: Routes = [
  {
    path: '',
    component: ShellComponent,
    children: [
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
    ],
  },
];
