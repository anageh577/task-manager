import { httpResource } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { TaskApiService } from '../api/task-api.service';
import { APP_CONFIG, NOW } from '../config/app-config';
import type { Task, TaskDraft, TaskFilters, TaskStatus } from '../models';
import { DEFAULT_TASK_FILTERS, STATUS_LABELS } from '../models';
import {
  countByPriority,
  countByStatus,
  filterTasks,
  generateId,
  groupByStatus,
  nextOrderFor,
  orderBetween,
} from '../utils/task.utils';
import { errorMessage } from '@core/http/api-error';
import { ActivityStore } from './activity.store';
import { isOverdue } from '@core/utils/date.utils';

/**
 * Single source of truth for tasks.
 *
 * - Reads go through `httpResource` (cached by the HTTP interceptor).
 * - Derived state (filtering, board columns, counters) is exposed as `computed` signals.
 * - Mutations are optimistic: the local value is patched first and rolled back if the
 *   request fails. Errors are re-thrown as `ApiError` so the UI layer decides how to notify.
 */
@Injectable({ providedIn: 'root' })
export class TaskStore {
  private readonly api = inject(TaskApiService);
  private readonly activity = inject(ActivityStore);
  private readonly config = inject(APP_CONFIG);
  private readonly now = inject(NOW);

  private readonly resource = httpResource<Task[]>(() => `${this.config.apiUrl}/tasks`, {
    defaultValue: [],
  });
  private readonly filtersState = signal<TaskFilters>(DEFAULT_TASK_FILTERS);

  readonly tasks = computed(() => (this.resource.hasValue() ? this.resource.value() : []));
  readonly isLoading = this.resource.isLoading;
  readonly error = computed(() => {
    const error = this.resource.error();
    return error ? errorMessage(error) : null;
  });
  /** True until the first response (success or failure) arrives; drives skeleton screens. */
  readonly isInitialLoad = computed(() => this.resource.status() === 'loading');

  readonly filters = this.filtersState.asReadonly();
  readonly hasActiveFilters = computed(() => {
    const { search, status, priority, assigneeId } = this.filters();
    return (
      search.trim() !== '' ||
      status !== DEFAULT_TASK_FILTERS.status ||
      priority !== DEFAULT_TASK_FILTERS.priority ||
      assigneeId !== DEFAULT_TASK_FILTERS.assigneeId
    );
  });
  readonly filteredTasks = computed(() => filterTasks(this.tasks(), this.filters()));
  readonly columns = computed(() => groupByStatus(this.filteredTasks()));
  readonly statusCounts = computed(() => countByStatus(this.tasks()));
  readonly priorityCounts = computed(() => countByPriority(this.tasks()));
  readonly overdueCount = computed(() => {
    const today = this.now();
    return this.tasks().filter((task) => isOverdue(task, today)).length;
  });

  reload(): void {
    this.resource.reload();
  }

  updateFilters(changes: Partial<TaskFilters>): void {
    this.filtersState.update((current) => ({ ...current, ...changes }));
  }

  resetFilters(): void {
    this.filtersState.set(DEFAULT_TASK_FILTERS);
  }

  getById(id: string): Task | undefined {
    return this.tasks().find((task) => task.id === id);
  }

  async create(draft: TaskDraft): Promise<Task> {
    const timestamp = this.now().toISOString();
    const task: Task = {
      ...draft,
      id: generateId('task'),
      order: nextOrderFor(this.tasks(), draft.status),
      completedAt: draft.status === 'done' ? timestamp : null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await this.optimistic(
      (tasks) => [...tasks, task],
      () => firstValueFrom(this.api.create(task)),
    );
    this.activity.record('created', task);
    return task;
  }

  async update(id: string, draft: TaskDraft): Promise<void> {
    const existing = this.requireTask(id);
    const changes: Partial<Task> = {
      ...draft,
      ...this.statusSideEffects(existing, draft.status),
      updatedAt: this.now().toISOString(),
    };

    await this.persist(id, changes);
    this.recordActivity(existing, draft.status);
  }

  /**
   * Moves a task to `status` at `index` within the target (visible) column and persists
   * only the moved task by giving it a fractional `order` between its new neighbours.
   */
  async move(id: string, status: TaskStatus, index: number): Promise<void> {
    const existing = this.requireTask(id);
    const siblings = this.columns()[status].filter((task) => task.id !== id);
    const order = orderBetween(siblings[index - 1], siblings[index]);
    if (existing.status === status && existing.order === order) return;

    await this.persist(id, {
      status,
      order,
      ...this.statusSideEffects(existing, status),
      updatedAt: this.now().toISOString(),
    });
    if (existing.status !== status) this.recordActivity(existing, status);
  }

  async remove(id: string): Promise<void> {
    const existing = this.requireTask(id);
    await this.optimistic(
      (tasks) => tasks.filter((task) => task.id !== id),
      () => firstValueFrom(this.api.delete(id)),
    );
    this.activity.record('deleted', existing);
  }

  private persist(id: string, changes: Partial<Task>): Promise<unknown> {
    return this.optimistic(
      (tasks) => tasks.map((task) => (task.id === id ? { ...task, ...changes } : task)),
      () => firstValueFrom(this.api.update(id, changes)),
    );
  }

  /** Applies `apply` locally, runs `request`, and restores the previous snapshot on failure. */
  private async optimistic<T>(
    apply: (tasks: Task[]) => Task[],
    request: () => Promise<T>,
  ): Promise<T> {
    const snapshot = this.tasks();
    this.resource.value.set(apply(snapshot));
    try {
      return await request();
    } catch (error) {
      this.resource.value.set(snapshot);
      throw error;
    }
  }

  /** Keeps `completedAt` consistent with the status transition. */
  private statusSideEffects(
    task: Task,
    nextStatus: TaskStatus,
  ): Partial<Pick<Task, 'completedAt'>> {
    if (task.status === nextStatus) return {};
    return { completedAt: nextStatus === 'done' ? this.now().toISOString() : null };
  }

  private recordActivity(before: Task, nextStatus: TaskStatus): void {
    const after = this.requireTask(before.id);
    if (before.status === nextStatus) {
      this.activity.record('updated', after);
    } else if (nextStatus === 'done') {
      this.activity.record('completed', after);
    } else {
      this.activity.record(
        'status_changed',
        after,
        `${STATUS_LABELS[before.status]} → ${STATUS_LABELS[nextStatus]}`,
      );
    }
  }

  private requireTask(id: string): Task {
    const task = this.getById(id);
    if (!task) throw new Error(`Task "${id}" not found`);
    return task;
  }
}
