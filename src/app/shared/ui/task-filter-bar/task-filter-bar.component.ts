import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import type { All, Assignee, TaskFilters, TaskPriority, TaskStatus } from '@core/models';
import { ALL, PRIORITY_LABELS, STATUS_LABELS, TASK_PRIORITIES, TASK_STATUSES } from '@core/models';

/** Status tabs + priority/assignee menus + "New Task" action. Purely presentational. */
@Component({
  selector: 'app-task-filter-bar',
  imports: [MatButtonModule, MatMenuModule],
  templateUrl: './task-filter-bar.component.html',
  styleUrl: './task-filter-bar.component.scss',
  host: { class: 'tm-panel' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskFilterBarComponent {
  readonly filters = input.required<TaskFilters>();
  readonly users = input<Assignee[]>([]);
  readonly hasActiveFilters = input(false);

  readonly filtersChange = output<Partial<TaskFilters>>();
  readonly resetFilters = output<void>();
  readonly newTask = output<void>();

  protected readonly all = ALL;
  protected readonly statusTabs: { value: TaskStatus | All; label: string }[] = [
    { value: ALL, label: 'All' },
    ...TASK_STATUSES.map((value) => ({ value, label: STATUS_LABELS[value] })),
  ];
  protected readonly priorities = TASK_PRIORITIES.map((value) => ({
    value,
    label: PRIORITY_LABELS[value],
  }));

  protected readonly priorityLabel = computed(() => {
    const priority = this.filters().priority;
    return priority === ALL ? 'Priority' : `Priority: ${PRIORITY_LABELS[priority]}`;
  });
  protected readonly assigneeLabel = computed(() => {
    const id = this.filters().assigneeId;
    const user = this.users().find((u) => u.id === id);
    return user ? `Assignee: ${user.name.split(' ')[0]}` : 'Assignee';
  });

  protected setStatus(status: TaskStatus | All): void {
    this.filtersChange.emit({ status });
  }

  protected setPriority(priority: TaskPriority | All): void {
    this.filtersChange.emit({ priority });
  }

  protected setAssignee(assigneeId: string): void {
    this.filtersChange.emit({ assigneeId });
  }
}
