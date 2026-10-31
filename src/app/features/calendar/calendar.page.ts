import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { NOW } from '../../core/config/app-config';
import type { Task } from '../../core/models';
import { TaskStore } from '../../core/state/task.store';
import { isOverdue, parseIsoDate } from '../../core/utils/date.utils';
import { TaskActionsService } from '../../shared/task-dialogs/task-actions.service';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { SkeletonComponent } from '../../shared/ui/skeleton/skeleton.component';
import type { TaskStatusChange } from '../../shared/ui/task-card/task-card.component';
import { TaskCardComponent } from '../../shared/ui/task-card/task-card.component';

export interface AgendaGroup {
  key: string;
  date: Date | null;
  title: string;
  tasks: Task[];
}

/**
 * Groups tasks into an agenda: an "Overdue" bucket first, then one bucket per due date
 * in chronological order. Completed tasks are included only when requested.
 */
export function buildAgenda(
  tasks: readonly Task[],
  today: Date,
  includeDone: boolean,
): AgendaGroup[] {
  const visible = tasks.filter((task) => includeDone || task.status !== 'done');
  const overdue = visible.filter((task) => isOverdue(task, today));
  const byDate = new Map<string, Task[]>();
  for (const task of visible) {
    if (overdue.includes(task)) continue;
    byDate.set(task.dueDate, [...(byDate.get(task.dueDate) ?? []), task]);
  }

  const groups: AgendaGroup[] = [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, items]) => ({ key, date: parseIsoDate(key), title: '', tasks: items }));

  return overdue.length
    ? [{ key: 'overdue', date: null, title: 'Overdue', tasks: overdue }, ...groups]
    : groups;
}

/** Agenda-style calendar of upcoming due dates. */
@Component({
  selector: 'app-calendar-page',
  imports: [
    DatePipe,
    MatSlideToggleModule,
    EmptyStateComponent,
    SkeletonComponent,
    TaskCardComponent,
  ],
  template: `
    <div class="tm-page">
      <header class="tm-page-header">
        <div>
          <h1>Calendar</h1>
          <p>Upcoming work grouped by due date.</p>
        </div>
        <mat-slide-toggle [checked]="includeDone()" (change)="includeDone.set($event.checked)">
          Show completed
        </mat-slide-toggle>
      </header>

      @if (tasks.isInitialLoad()) {
        <app-skeleton height="160px" radius="8px" />
      } @else {
        @for (group of agenda(); track group.key) {
          <section
            class="group"
            [class.overdue]="!group.date"
            [attr.aria-labelledby]="'group-' + group.key"
          >
            <h2 [id]="'group-' + group.key">
              @if (group.date) {
                {{ group.date | date: 'EEEE, MMM d' }}
              } @else {
                ⚠️ {{ group.title }}
              }
              <span class="count">{{ group.tasks.length }}</span>
            </h2>
            <div class="cards">
              @for (task of group.tasks; track task.id) {
                <app-task-card
                  [task]="task"
                  [today]="today"
                  (edit)="actions.openEdit($event)"
                  (delete)="actions.confirmDelete($event)"
                  (statusChange)="onStatusChange($event)"
                />
              }
            </div>
          </section>
        } @empty {
          <app-empty-state
            icon="🎉"
            title="Nothing scheduled"
            message="There are no upcoming tasks."
          />
        }
      }
    </div>
  `,
  styles: `
    .group h2 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      font-size: 14px;
      font-weight: 600;
    }
    .group.overdue h2 {
      color: var(--tm-danger);
    }
    .count {
      padding: 1px 8px;
      font-size: 11px;
      color: var(--tm-text-subtle);
      background: var(--tm-surface-muted);
      border-radius: 999px;
    }
    .cards {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 12px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class CalendarPage {
  protected readonly tasks = inject(TaskStore);
  protected readonly actions = inject(TaskActionsService);
  protected readonly today = inject(NOW);
  protected readonly includeDone = signal(false);

  protected readonly agenda = computed(() =>
    buildAgenda(this.tasks.tasks(), this.today, this.includeDone()),
  );

  protected onStatusChange({ task, status }: TaskStatusChange): void {
    void this.actions.changeStatus(task, status);
  }
}
