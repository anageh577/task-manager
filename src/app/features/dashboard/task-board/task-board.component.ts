import type { CdkDragDrop } from '@angular/cdk/drag-drop';
import { CdkDrag, CdkDragPlaceholder, CdkDropList, CdkDropListGroup } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import type { Task, TaskStatus } from '@core/models';
import { TASK_STATUSES } from '@core/models';
import { TranslatePipe } from '@ngx-translate/core';
import { EmptyStateComponent } from '@shared/ui/empty-state/empty-state.component';
import { SkeletonComponent } from '@shared/ui/skeleton/skeleton.component';
import type { TaskStatusChange } from '@shared/ui/task-card/task-card.component';
import { TaskCardComponent } from '@shared/ui/task-card/task-card.component';

export interface TaskMove {
  task: Task;
  status: TaskStatus;
  index: number;
}

/**
 * Kanban board (presentational). Drag & drop reorders within a column and moves between
 * columns; the result is emitted as a {@link TaskMove} for the container to persist.
 */
@Component({
  selector: 'app-task-board',
  imports: [
    CdkDrag,
    CdkDragPlaceholder,
    CdkDropList,
    CdkDropListGroup,
    MatButtonModule,
    EmptyStateComponent,
    SkeletonComponent,
    TaskCardComponent,
    TranslatePipe,
  ],
  templateUrl: './task-board.component.html',
  styleUrl: './task-board.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskBoardComponent {
  readonly columns = input.required<Record<TaskStatus, Task[]>>();
  /** Restricts the board to a single column (when a status filter is active). */
  readonly statusFilter = input<TaskStatus | null>(null);
  readonly loading = input(false);
  readonly today = input<Date>(new Date());

  readonly moved = output<TaskMove>();
  readonly edit = output<Task>();
  readonly delete = output<Task>();
  readonly statusChange = output<TaskStatusChange>();
  readonly addTask = output<TaskStatus>();

  protected readonly skeletonCards = [1, 2, 3];
  protected readonly visibleColumns = computed(() => {
    const only = this.statusFilter();
    return TASK_STATUSES.filter((status) => !only || status === only).map((status) => ({
      status,
      tasks: this.columns()[status],
    }));
  });

  protected drop(event: CdkDragDrop<TaskStatus, TaskStatus, Task>): void {
    if (event.previousContainer === event.container && event.previousIndex === event.currentIndex) {
      return;
    }
    this.moved.emit({
      task: event.item.data,
      status: event.container.data,
      index: event.currentIndex,
    });
  }
}
