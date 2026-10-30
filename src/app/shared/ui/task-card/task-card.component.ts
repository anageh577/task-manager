import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import type { Task, TaskStatus } from '@core/models';
import { STATUS_LABELS, TASK_STATUSES } from '@core/models';

import { AvatarComponent } from '../avatar/avatar.component';
import { PriorityBadgeComponent } from '../priority-badge/priority-badge.component';

export interface TaskStatusChange {
  task: Task;
  status: TaskStatus;
}

/** Presentational task card (board item). Emits user intents; owns no state. */
@Component({
  selector: 'app-task-card',
  imports: [MatButtonModule, MatMenuModule, AvatarComponent, PriorityBadgeComponent],
  templateUrl: './task-card.component.html',
  styleUrl: './task-card.component.scss',
  host: {
    '[class.overdue]': 'due().tone === "overdue"',
    '[attr.aria-labelledby]': 'titleId()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskCardComponent {
  readonly task = input.required<Task>();
  readonly today = input<Date>(new Date());

  readonly edit = output<Task>();
  readonly delete = output<Task>();
  readonly statusChange = output<TaskStatusChange>();

  /**
   * @TODO: Implement due info calculation
   */
  protected readonly due = computed(() => {
    return {
      icon: '',
      label: '',
      tone: '',
    };
  });
  protected readonly assigneeHandle = computed(() => `@${this.task().assignee.name}`);
  protected readonly titleId = computed(() => `task-title-${this.task().id}`);
  protected readonly moveTargets = computed(() =>
    TASK_STATUSES.filter((status) => status !== this.task().status).map((status) => ({
      status,
      label: STATUS_LABELS[status],
    })),
  );
}
