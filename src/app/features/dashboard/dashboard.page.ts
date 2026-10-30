import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import type { Assignee, Statistic, TaskStatus } from '@core/models';
import { ALL, DEFAULT_TASK_FILTERS } from '@core/models';
import { TaskStore } from '@core/state';
import { StatCardComponent } from '@shared/ui/stat-card/stat-card.component';
import { TaskFilterBarComponent } from '@shared/ui/task-filter-bar/task-filter-bar.component';
import { TaskBoardComponent } from './task-board/task-board.component';
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

const STATS: Statistic[] = [
  {
    id: 'stat-001',
    title: 'Total Tasks',
    icon: '📊',
    value: 0,
    change: '+2',
    changeLabel: 'this week',
    changeType: 'positive',
    color: '#1976D2',
  },
  {
    id: 'stat-002',
    title: 'Completed',
    icon: '✅',
    value: 0,
    change: '+1',
    changeLabel: 'today',
    changeType: 'positive',
    color: '#388E3C',
  },
  {
    id: 'stat-003',
    title: 'In Progress',
    icon: '🔄',
    value: 0,
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
  protected readonly filters = DEFAULT_TASK_FILTERS;
  protected readonly tasksStore = inject(TaskStore);

  protected readonly today = signal(new Date());

  protected readonly statusFilter = computed<TaskStatus | null>(() => {
    const status = this.tasksStore.filters().status;
    return status === ALL ? null : status;
  });
  /** Only block the board when there is nothing to show; stale data beats an error screen. */
  protected readonly loadError = computed(() =>
    this.tasksStore.tasks().length ? null : this.tasksStore.error(),
  );
}
