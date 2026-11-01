import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import type { Task, TaskStatus } from '@core/models';
import { TASK_STATUSES } from '@core/models';
import { TranslatePipe } from '@ngx-translate/core';
import { getDueInfo, type DueTone } from '@core/utils/date.utils';

/** Decorative due-date glyphs. Inline so they inherit `currentColor` from the tone. */
const DUE_ICON_PATHS: Record<DueTone, string> = {
  overdue:
    'M8.9 1.7a1 1 0 0 0-1.8 0L1.2 13.1A1 1 0 0 0 2.1 14.5h11.8a1 1 0 0 0 .9-1.4L8.9 1.7zM8 5.2c.3 0 .5.2.5.5v3.6a.5.5 0 0 1-1 0V5.7c0-.3.2-.5.5-.5zm0 7.1a.7.7 0 1 1 0-1.4.7.7 0 0 1 0 1.4z',
  completed:
    'M8 1.4a6.6 6.6 0 1 0 0 13.2A6.6 6.6 0 0 0 8 1.4zm3.1 5.1-3.4 3.7a.7.7 0 0 1-1 .1L5 8.7a.7.7 0 1 1 .9-1.1l1.1 1 2.9-3.2a.7.7 0 1 1 1.1.9z',
  upcoming:
    'M5 1.5a.7.7 0 0 1 .7.7V3h4.6v-.8a.7.7 0 0 1 1.4 0V3H13a1.5 1.5 0 0 1 1.5 1.5V13A1.5 1.5 0 0 1 13 14.5H3A1.5 1.5 0 0 1 1.5 13V4.5A1.5 1.5 0 0 1 3 3h1.3v-.8a.7.7 0 0 1 .7-.7zM3 6.2v6.3c0 .3.2.5.5.5h9a.5.5 0 0 0 .5-.5V6.2H3z',
};

import { AvatarComponent } from '../avatar/avatar.component';
import { PriorityBadgeComponent } from '../priority-badge/priority-badge.component';

export interface TaskStatusChange {
  task: Task;
  status: TaskStatus;
}

/** Presentational task card (board item). Emits user intents; owns no state. */
@Component({
  selector: 'app-task-card',
  imports: [MatButtonModule, MatMenuModule, AvatarComponent, PriorityBadgeComponent, TranslatePipe],
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

  protected readonly due = computed(() => getDueInfo(this.task(), this.today()));
  protected readonly dueIcon = computed(() => DUE_ICON_PATHS[this.due().tone]);
  protected readonly assigneeHandle = computed(() => {
    const [first] = this.task().assignee.name.trim().split(/\s+/);
    return `@${first}`;
  });
  protected readonly titleId = computed(() => `task-title-${this.task().id}`);
  protected readonly moveTargets = computed(() =>
    TASK_STATUSES.filter((status) => status !== this.task().status),
  );
}
