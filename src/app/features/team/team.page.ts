import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { NOW } from '@core/config/app-config';
import type { Assignee } from '@core/models';
import { DEFAULT_TASK_FILTERS } from '@core/models';
import { TaskStore } from '@core/state/task.store';
import { UserStore } from '@core/state/user.store';
import { isOverdue } from '@core/utils/date.utils';
import { countByStatus } from '@core/utils/task.utils';
import { AvatarComponent } from '@shared/ui/avatar/avatar.component';
import { EmptyStateComponent } from '@shared/ui/empty-state/empty-state.component';
import { ErrorStateComponent } from '@shared/ui/error-state/error-state.component';
import { SkeletonComponent } from '@shared/ui/skeleton/skeleton.component';

export interface TeamMemberSummary {
  user: Assignee;
  todo: number;
  inProgress: number;
  done: number;
  overdue: number;
  total: number;
  completion: number;
}

/** Team members with their workload; links into the task list filtered by assignee. */
@Component({
  selector: 'app-team-page',
  imports: [
    MatButtonModule,
    MatProgressBarModule,
    AvatarComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    SkeletonComponent,
  ],
  templateUrl: './team.page.html',
  styleUrl: './team.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TeamPage {
  protected readonly users = inject(UserStore);
  private readonly tasks = inject(TaskStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly today = inject(NOW);

  /** `?userId=` limits the roster to one member. Missing means everyone. */
  private readonly userId = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('userId'))),
    { initialValue: this.route.snapshot.queryParamMap.get('userId') },
  );

  protected readonly members = computed<TeamMemberSummary[]>(() => {
    const userId = this.userId() ?? new URLSearchParams(globalThis.location.search).get('userId');
    const roster = this.users.users().filter((user) => !userId || user.id === userId);
    return roster.map((user) => {
      const own = this.tasks.tasks().filter((task) => task.assignee.id === user.id);
      const counts = countByStatus(own);
      return {
        user,
        todo: counts.todo,
        inProgress: counts.in_progress,
        done: counts.done,
        overdue: own.filter((task) => isOverdue(task, this.today())).length,
        total: own.length,
        completion: own.length ? Math.round((counts.done / own.length) * 100) : 0,
      };
    });
  });

  protected viewTasks(user: Assignee): void {
    this.tasks.updateFilters({ ...DEFAULT_TASK_FILTERS, assigneeId: user.id });
    void this.router.navigate(['/tasks'], {
      queryParams: {
        userId: user.id,
      },
    });
  }
}
