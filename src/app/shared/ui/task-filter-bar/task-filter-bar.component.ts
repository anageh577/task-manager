import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { LanguageService } from '@core/i18n/language.service';
import type { All, Assignee, TaskFilters, TaskPriority, TaskStatus } from '@core/models';
import { ALL, TASK_PRIORITIES, TASK_STATUSES } from '@core/models';
import { TranslatePipe } from '@ngx-translate/core';

/** Status tabs + priority/assignee menus + "New Task" action. Purely presentational. */
@Component({
  selector: 'app-task-filter-bar',
  imports: [MatButtonModule, MatMenuModule, TranslatePipe],
  templateUrl: './task-filter-bar.component.html',
  styleUrl: './task-filter-bar.component.scss',
  host: { class: 'tm-panel' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskFilterBarComponent {
  private readonly language = inject(LanguageService);
  readonly filters = input.required<TaskFilters>();
  readonly users = input<Assignee[]>([]);
  readonly hasActiveFilters = input(false);

  readonly filtersChange = output<Partial<TaskFilters>>();
  readonly resetFilters = output<void>();
  readonly newTask = output<void>();

  protected readonly all = ALL;
  protected readonly statusTabs: { value: TaskStatus | All }[] = [
    { value: ALL },
    ...TASK_STATUSES.map((value) => ({ value })),
  ];
  protected readonly priorities = TASK_PRIORITIES;

  protected readonly priorityLabel = computed(() => {
    const priority = this.filters().priority;
    return priority === ALL
      ? this.language.text('filter.priority')
      : this.language.text('filter.priorityValue', {
          value: this.language.text(`priority.${priority}`),
        });
  });
  protected readonly assigneeLabel = computed(() => {
    const id = this.filters().assigneeId;
    const user = this.users().find((u) => u.id === id);
    return user
      ? this.language.text('filter.assigneeValue', { name: user.name.split(' ')[0] })
      : this.language.text('filter.assignee');
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
