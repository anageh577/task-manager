import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NOW } from '@core/config/app-config';
import type { TaskFilters, TaskStatus } from '@core/models';
import { ALL } from '@core/models';
import { StatisticsStore } from '@core/state/statistics.store';
import { TaskStore } from '@core/state/task.store';
import { UserStore } from '@core/state/user.store';
import { TaskActionsService } from '@shared/task-dialogs/task-actions.service';
import { ErrorStateComponent } from '@shared/ui/error-state/error-state.component';
import { StatCardComponent } from '@shared/ui/stat-card/stat-card.component';
import type { TaskStatusChange } from '@shared/ui/task-card/task-card.component';
import { TaskFilterBarComponent } from '@shared/ui/task-filter-bar/task-filter-bar.component';
import type { TaskMove } from './task-board/task-board.component';
import { TaskBoardComponent } from './task-board/task-board.component';

/** Dashboard container: statistics, filters and the Kanban board. */
@Component({
  selector: 'app-dashboard-page',
  imports: [ErrorStateComponent, StatCardComponent, TaskBoardComponent, TaskFilterBarComponent],
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
  protected readonly tasks = inject(TaskStore);
  protected readonly statistics = inject(StatisticsStore);
  protected readonly users = inject(UserStore);
  protected readonly actions = inject(TaskActionsService);
  protected readonly today = inject(NOW);

  constructor() {
    this.tasks.reloadIfStale();
  }

  protected readonly statusFilter = computed<TaskStatus | null>(() => {
    const status = this.tasks.filters().status;
    return status === ALL ? null : status;
  });
  /** Only block the board when there is nothing to show; stale data beats an error screen. */
  protected readonly loadError = computed(() =>
    this.tasks.tasks().length ? null : this.tasks.error(),
  );
  protected readonly resultsAnnouncement = computed(() =>
    this.tasks.hasActiveFilters()
      ? `${this.tasks.filteredTasks().length} tasks match the filters`
      : '',
  );

  protected updateFilters(changes: Partial<TaskFilters>): void {
    this.tasks.updateFilters(changes);
  }

  protected onMove({ task, status, index }: TaskMove): void {
    void this.actions.move(task, status, index);
  }

  protected onStatusChange({ task, status }: TaskStatusChange): void {
    void this.actions.changeStatus(task, status);
  }
}
