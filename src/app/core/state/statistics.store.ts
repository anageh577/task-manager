import { httpResource } from '@angular/common/http';
import { computed, inject, Injectable } from '@angular/core';
import { APP_CONFIG } from '../config/app-config';
import { TaskStore } from './task.store';
import type { Statistic, StatisticsResponse } from '@core/models';

/** Card definitions used when the statistics endpoint has not answered (or failed). */
export const DEFAULT_STATISTICS: readonly Statistic[] = [
  {
    id: 'stat-001',
    title: 'Total Tasks',
    icon: '📊',
    value: 0,
    change: '',
    changeLabel: '',
    changeType: 'neutral',
    color: '#1976D2',
  },
  {
    id: 'stat-002',
    title: 'Completed',
    icon: '✅',
    value: 0,
    change: '',
    changeLabel: '',
    changeType: 'neutral',
    color: '#388E3C',
  },
  {
    id: 'stat-003',
    title: 'In Progress',
    icon: '🔄',
    value: 0,
    change: '',
    changeLabel: '',
    changeType: 'neutral',
    color: '#FF6F00',
  },
  {
    id: 'stat-004',
    title: 'Overdue',
    icon: '⚠️',
    value: 0,
    change: '',
    changeLabel: '',
    changeType: 'neutral',
    color: '#D32F2F',
  },
];

/**
 * Dashboard statistic cards.
 *
 * The `/statistics` endpoint provides presentation metadata and trend labels
 * ("+12 this week"), while the headline `value` is derived live from the task list so the
 * cards stay consistent with the board after every create/update/delete.
 */
@Injectable({ providedIn: 'root' })
export class StatisticsStore {
  private readonly config = inject(APP_CONFIG);
  private readonly tasks = inject(TaskStore);

  private readonly resource = httpResource<StatisticsResponse>(
    () => `${this.config.apiUrl}/statistics`,
  );

  readonly isLoading = computed(
    () => this.tasks.isInitialLoad() || this.resource.status() === 'loading',
  );

  readonly cards = computed<Statistic[]>(() => {
    const remote = this.resource.hasValue() ? (this.resource.value()?.statistics ?? []) : [];
    const counts = this.tasks.statusCounts();
    const liveValues: Record<string, number> = {
      'stat-001': this.tasks.tasks().length,
      'stat-002': counts.done,
      'stat-003': counts.in_progress,
      'stat-004': this.tasks.overdueCount(),
    };

    return DEFAULT_STATISTICS.map((fallback) => ({
      ...fallback,
      ...remote.find((stat) => stat.id === fallback.id),
      value: liveValues[fallback.id] ?? 0,
    }));
  });

  reload(): void {
    this.resource.reload();
  }
}
