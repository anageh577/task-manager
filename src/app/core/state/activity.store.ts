import { httpResource } from '@angular/common/http';
import { computed, inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { TaskApiService } from '../api/task-api.service';
import { APP_CONFIG, CURRENT_USER, NOW } from '../config/app-config';
import type { Activity, ActivityType, Task } from '../models';
import { generateId } from '../utils/task.utils';
import { errorMessage } from '@core/http/api-error';
import { registerForRefresh } from '@core/services/data-refresh.service';

export const ACTIVITY_FEED_LIMIT = 20;

/** Recent activity feed: loaded from the API and appended to locally as the user mutates tasks. */
@Injectable({ providedIn: 'root' })
export class ActivityStore {
  private readonly api = inject(TaskApiService);
  private readonly config = inject(APP_CONFIG);
  private readonly currentUser = inject(CURRENT_USER);
  private readonly now = inject(NOW);

  private readonly resource = httpResource<Activity[]>(
    () => ({
      url: `${this.config.apiUrl}/activities`,
      params: { _sort: 'timestamp', _order: 'desc', _limit: ACTIVITY_FEED_LIMIT },
    }),
    { defaultValue: [] },
  );

  readonly activities = computed(() =>
    this.resource.hasValue() ? this.resource.value().slice(0, ACTIVITY_FEED_LIMIT) : [],
  );
  readonly isLoading = this.resource.isLoading;
  readonly error = computed(() => {
    const error = this.resource.error();
    return error ? errorMessage(error) : null;
  });

  constructor() {
    registerForRefresh(() => this.reload());
  }

  reload(): void {
    this.resource.reload();
  }

  /**
   * Prepends an entry to the feed immediately and persists it in the background.
   * The feed is non-critical, so a failed write is logged rather than surfaced.
   */
  record(type: ActivityType, task: Pick<Task, 'id' | 'title'>, detail?: string): Activity {
    const activity: Activity = {
      id: generateId('act'),
      type,
      taskId: task.id,
      taskTitle: task.title,
      actor: this.currentUser.name,
      timestamp: this.now().toISOString(),
      ...(detail ? { detail } : {}),
    };
    this.resource.value.update((current) => [activity, ...(current ?? [])]);
    firstValueFrom(this.api.logActivity(activity)).catch((error: unknown) =>
      console.warn('Failed to persist activity', error),
    );
    return activity;
  }
}
