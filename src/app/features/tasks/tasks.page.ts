import { BreakpointObserver } from '@angular/cdk/layout';
import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  linkedSignal,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import type { PageEvent } from '@angular/material/paginator';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import type { Sort } from '@angular/material/sort';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { map } from 'rxjs';
import { NOW } from '@core/config/app-config';
import type { Task, TaskFilters, TaskStatus } from '@core/models';
import { STATUS_LABELS, TASK_PRIORITIES, TASK_STATUSES } from '@core/models';
import { TaskStore } from '@core/state/task.store';
import { UserStore } from '@core/state/user.store';
import { getDueInfo, parseIsoDate } from '@core/utils/date.utils';
import { TaskActionsService } from '@shared/task-dialogs/task-actions.service';
import { AvatarComponent } from '@shared/ui/avatar/avatar.component';
import { EmptyStateComponent } from '@shared/ui/empty-state/empty-state.component';
import { ErrorStateComponent } from '@shared/ui/error-state/error-state.component';
import { PriorityBadgeComponent } from '@shared/ui/priority-badge/priority-badge.component';
import { SkeletonComponent } from '@shared/ui/skeleton/skeleton.component';
import { TaskFilterBarComponent } from '@shared/ui/task-filter-bar/task-filter-bar.component';

type SortableColumn = 'title' | 'status' | 'priority' | 'dueDate' | 'assignee';

const PRIORITY_RANK = Object.fromEntries(TASK_PRIORITIES.map((p, i) => [p, i]));
const STATUS_RANK = Object.fromEntries(TASK_STATUSES.map((s, i) => [s, i]));

const SORT_ACCESSORS: Record<SortableColumn, (task: Task) => string | number> = {
  title: (task) => task.title.toLowerCase(),
  status: (task) => STATUS_RANK[task.status],
  priority: (task) => PRIORITY_RANK[task.priority],
  dueDate: (task) => task.dueDate,
  assignee: (task) => task.assignee.name,
};

export function sortTasks(tasks: readonly Task[], sort: Sort): Task[] {
  const accessor = SORT_ACCESSORS[sort.active as SortableColumn];
  if (!accessor || !sort.direction) return [...tasks];
  const factor = sort.direction === 'asc' ? 1 : -1;
  return [...tasks].sort((a, b) => {
    const [x, y] = [accessor(a), accessor(b)];
    return (x < y ? -1 : x > y ? 1 : 0) * factor;
  });
}

/** Tabular task list with sorting, pagination and inline status editing. */
@Component({
  selector: 'app-tasks-page',
  imports: [
    DatePipe,
    MatButtonModule,
    MatMenuModule,
    MatPaginatorModule,
    MatSelectModule,
    MatSortModule,
    MatTableModule,
    AvatarComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    PriorityBadgeComponent,
    SkeletonComponent,
    TaskFilterBarComponent,
  ],
  templateUrl: './tasks.page.html',
  styleUrl: './tasks.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TasksPage {
  protected readonly tasks = inject(TaskStore);
  protected readonly users = inject(UserStore);
  protected readonly actions = inject(TaskActionsService);
  private readonly today = inject(NOW);

  private readonly isCompact = toSignal(
    inject(BreakpointObserver)
      .observe('(max-width: 767.98px)')
      .pipe(map((state) => state.matches)),
    { initialValue: false },
  );

  protected readonly pageSizeOptions = [5, 10, 25];
  protected readonly statusOptions = TASK_STATUSES.map((value) => ({
    value,
    label: STATUS_LABELS[value],
  }));
  protected readonly trackById = (_: number, task: Task): string => task.id;

  protected readonly sort = signal<Sort>({ active: 'dueDate', direction: 'asc' });
  protected readonly pageSize = signal(10);
  /** Resets to the first page whenever the result set changes. */
  protected readonly pageIndex = linkedSignal({
    source: () => this.tasks.filteredTasks().length,
    computation: () => 0,
  });

  protected readonly displayedColumns = computed(() =>
    this.isCompact()
      ? ['title', 'status', 'actions']
      : ['title', 'status', 'priority', 'dueDate', 'assignee', 'actions'],
  );
  protected readonly sorted = computed(() => sortTasks(this.tasks.filteredTasks(), this.sort()));
  protected readonly page = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.sorted().slice(start, start + this.pageSize());
  });
  protected readonly loadError = computed(() =>
    this.tasks.tasks().length ? null : this.tasks.error(),
  );
  protected readonly skeletonRows = [1, 2, 3, 4, 5];

  protected dueInfo(task: Task) {
    return getDueInfo(task, this.today);
  }

  protected dueDate(task: Task): Date {
    return parseIsoDate(task.dueDate);
  }

  protected updateFilters(changes: Partial<TaskFilters>): void {
    this.tasks.updateFilters(changes);
  }

  protected onPage(event: PageEvent): void {
    this.pageSize.set(event.pageSize);
    this.pageIndex.set(event.pageIndex);
  }

  protected onStatusSelect(task: Task, status: TaskStatus): void {
    if (status !== task.status) void this.actions.changeStatus(task, status);
  }
}
