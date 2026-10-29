import { ChangeDetectionStrategy, Component } from '@angular/core';
import type { Assignee, Statistic, Task, TaskStatus } from '@core/models';
import { DEFAULT_TASK_FILTERS } from '@core/models';
import { TaskBoardComponent } from './task-board/task-board.component';
import { StatCardComponent } from '@shared/ui/stat-card/stat-card.component';
import { TaskFilterBarComponent } from '@shared/ui/task-filter-bar/task-filter-bar.component';
/**
 * @TODO: Replace with actual data from the API
 */
const JOHN: Assignee = {
  id: 'user-001',
  name: 'John Doe',
  avatar: 'JD',
  email: 'john.doe@company.com',
};

const SARAH: Assignee = {
  id: 'user-002',
  name: 'Sarah Smith',
  avatar: 'SS',
  email: 'sarah.smith@company.com',
};

const MIKE: Assignee = {
  id: 'user-003',
  name: 'Mike Johnson',
  avatar: 'MJ',
  email: 'mike.johnson@company.com',
};

const EMILY: Assignee = {
  id: 'user-004',
  name: 'Emily Davis',
  avatar: 'ED',
  email: 'emily.davis@company.com',
};

const USERS: Assignee[] = [JOHN, SARAH, MIKE, EMILY];

const TASKS: Task[] = [
  {
    id: 'task-001',
    title: 'Design new homepage layout',
    description:
      'Create wireframes and mockups for the new homepage redesign with modern UI elements',
    status: 'todo',
    priority: 'high',
    dueDate: '2026-10-31',
    assignee: JOHN,
    tags: ['Design'],
    order: 0,
    createdAt: '2026-10-27T20:02:24.393Z',
    updatedAt: '2026-10-29T21:02:24.393Z',
  },
  {
    id: 'task-015',
    title: 'Prepare Q4 budget report',
    description: 'Compile and analyze financial data for quarterly budget presentation',
    status: 'todo',
    priority: 'high',
    dueDate: '2026-10-27',
    assignee: SARAH,
    tags: ['Finance'],
    order: 1,
    createdAt: '2026-10-13T20:02:24.393Z',
    updatedAt: '2026-10-29T21:02:24.393Z',
  },
  {
    id: 'task-005',
    title: 'Implement user authentication',
    description: 'Add JWT-based authentication system with refresh tokens',
    status: 'in_progress',
    priority: 'high',
    dueDate: '2026-11-01',
    assignee: JOHN,
    tags: ['Backend'],
    order: 0,
    createdAt: '2026-10-22T20:02:24.393Z',
    updatedAt: '2026-10-29T21:02:24.393Z',
  },
  {
    id: 'task-008',
    title: 'Add dark mode support',
    description: 'Implement theme toggle with dark/light mode preferences',
    status: 'in_progress',
    priority: 'medium',
    dueDate: '2026-11-04',
    assignee: EMILY,
    tags: ['Frontend'],
    order: 1,
    createdAt: '2026-10-20T20:02:24.393Z',
    updatedAt: '2026-10-28T20:02:24.393Z',
  },
  {
    id: 'task-009',
    title: 'Fix critical login bug',
    description: 'Resolved issue preventing users from logging in on mobile devices',
    status: 'done',
    priority: 'high',
    dueDate: '2026-10-28',
    completedAt: '2026-10-29T21:02:24.393Z',
    assignee: MIKE,
    tags: ['Bug Fix'],
    order: 0,
    createdAt: '2026-10-27T20:02:24.393Z',
    updatedAt: '2026-10-29T21:02:24.393Z',
  },
  {
    id: 'task-010',
    title: 'Setup CI/CD pipeline',
    description: 'Configured GitHub Actions for automated testing and deployment',
    status: 'done',
    priority: 'medium',
    dueDate: '2026-10-27',
    completedAt: '2026-10-28T20:02:24.393Z',
    assignee: JOHN,
    tags: ['DevOps'],
    order: 1,
    createdAt: '2026-10-20T20:02:24.393Z',
    updatedAt: '2026-10-28T20:02:24.393Z',
  },
];

const COLUMNS: Record<TaskStatus, Task[]> = {
  todo: TASKS.filter((task) => task.status === 'todo'),
  in_progress: TASKS.filter((task) => task.status === 'in_progress'),
  done: TASKS.filter((task) => task.status === 'done'),
};

const STATS: Statistic[] = [
  {
    id: 'stat-001',
    title: 'Total Tasks',
    icon: '📊',
    value: TASKS.length,
    change: '+2',
    changeLabel: 'this week',
    changeType: 'positive',
    color: '#1976D2',
  },
  {
    id: 'stat-002',
    title: 'Completed',
    icon: '✅',
    value: COLUMNS.done.length,
    change: '+1',
    changeLabel: 'today',
    changeType: 'positive',
    color: '#388E3C',
  },
  {
    id: 'stat-003',
    title: 'In Progress',
    icon: '🔄',
    value: COLUMNS.in_progress.length,
    change: '0',
    changeLabel: 'Same as yesterday',
    changeType: 'neutral',
    color: '#FF6F00',
  },
  {
    id: 'stat-004',
    title: 'Overdue',
    icon: '⚠️',
    value: 1,
    change: '+1',
    changeLabel: 'today',
    changeType: 'negative',
    color: '#D32F2F',
  },
];

/** Dashboard container: statistics, filters and the Kanban board. */
@Component({
  selector: 'app-dashboard-page',
  imports: [StatCardComponent, TaskBoardComponent, TaskFilterBarComponent],
  templateUrl: './dashboard.page.html',
  styles: `
    .stats {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 16px;

      @media (max-width: 1199.98px) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      @media (max-width: 399.98px) {
        grid-template-columns: minmax(0, 1fr);
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DashboardPage {
  /**
   * @TODO: Replace with actual data from the API
   */
  protected readonly statistics = STATS;
  protected readonly users = USERS;
  protected readonly columns = COLUMNS;
  protected readonly filters = DEFAULT_TASK_FILTERS;
}
