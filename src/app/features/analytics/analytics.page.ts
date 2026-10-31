import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NOW } from '../../core/config/app-config';
import { PRIORITY_LABELS, STATUS_LABELS, TASK_PRIORITIES, TASK_STATUSES } from '../../core/models';
import { ActivityStore } from '@core/state/activity.store';
import { TaskStore } from '@core/state/task.store';
import { UserStore } from '@core/state/user.store';
import { ActivityFeedComponent } from '@shared/ui/activity-feed/activity-feed.component';
import { ChartComponent } from '@shared/ui/chart/chart.component';
import { ErrorStateComponent } from '@shared/ui/error-state/error-state.component';
import { SkeletonComponent } from '@shared/ui/skeleton/skeleton.component';

const STATUS_COLORS = ['#1976D2', '#FF6F00', '#388E3C'];
const PRIORITY_COLORS = ['#D32F2F', '#F57C00', '#388E3C'];

/** Task analytics: distribution charts, workload and the recent activity feed. */
@Component({
  selector: 'app-analytics-page',
  imports: [ActivityFeedComponent, ChartComponent, ErrorStateComponent, SkeletonComponent],
  templateUrl: './analytics.page.html',
  styleUrl: './analytics.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AnalyticsPage {
  protected readonly tasks = inject(TaskStore);
  protected readonly activity = inject(ActivityStore);
  private readonly users = inject(UserStore);
  protected readonly now = inject(NOW);

  protected readonly statusChart = computed(() => ({
    labels: TASK_STATUSES.map((s) => STATUS_LABELS[s]),
    values: TASK_STATUSES.map((s) => this.tasks.statusCounts()[s]),
    colors: STATUS_COLORS,
  }));

  protected readonly priorityChart = computed(() => ({
    labels: TASK_PRIORITIES.map((p) => PRIORITY_LABELS[p]),
    values: TASK_PRIORITIES.map((p) => this.tasks.priorityCounts()[p]),
    colors: PRIORITY_COLORS,
  }));

  /** Open (not done) tasks per team member. */
  protected readonly workloadChart = computed(() => {
    const open = this.tasks.tasks().filter((task) => task.status !== 'done');
    const users = this.users.users();
    return {
      labels: users.map((u) => u.name),
      values: users.map((u) => open.filter((task) => task.assignee.id === u.id).length),
      colors: users.map(() => '#1976D2'),
    };
  });

  protected readonly completionRate = computed(() => {
    const total = this.tasks.tasks().length;
    return total ? Math.round((this.tasks.statusCounts().done / total) * 100) : 0;
  });
}
