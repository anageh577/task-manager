import { httpResource } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { APP_CONFIG } from '../config/app-config';
import type { Task, TaskFilters } from '../models';
import { DEFAULT_TASK_FILTERS } from '../models';
import { filterTasks, groupByStatus } from '../utils/task.utils';

@Injectable({ providedIn: 'root' })
export class TaskStore {
  private readonly config = inject(APP_CONFIG);
  private readonly resource = httpResource<Task[]>(() => `${this.config.apiUrl}/tasks`, {
    defaultValue: [],
  });
  private readonly filtersState = signal<TaskFilters>(DEFAULT_TASK_FILTERS);

  readonly tasks = computed(() => (this.resource.hasValue() ? this.resource.value() : []));
  readonly isLoading = this.resource.isLoading;
  readonly error = computed(() => {
    const error = this.resource.error();
    return error ? (error as Error).message : null;
  });
  /** True until the first response (success or failure) arrives; drives skeleton screens. */
  readonly isInitialLoad = computed(() => this.resource.status() === 'loading');
  readonly filters = this.filtersState.asReadonly();
  readonly filteredTasks = computed(() => filterTasks(this.tasks(), this.filters()));
  readonly columns = computed(() => groupByStatus(this.filteredTasks()));
}
