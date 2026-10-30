import { httpResource } from '@angular/common/http';
import { computed, inject, Injectable } from '@angular/core';
import { APP_CONFIG } from '../config/app-config';
import { errorMessage } from '../http/api-error';
import type { Assignee } from '../models';
import { uniqueAssignees } from '../utils/task.utils';
import { TaskStore } from './task.store';

/** Team members that tasks can be assigned to. */
@Injectable({ providedIn: 'root' })
export class UserStore {
  private readonly config = inject(APP_CONFIG);
  private readonly taskStore = inject(TaskStore);

  private readonly resource = httpResource<Assignee[]>(() => `${this.config.apiUrl}/users`, {
    defaultValue: [],
  });

  /** Falls back to the assignees found on tasks if the users endpoint is unavailable. */
  readonly users = computed<Assignee[]>(() => {
    const users = this.resource.hasValue() ? this.resource.value() : [];
    const source = users.length ? users : uniqueAssignees(this.taskStore.tasks());
    return [...source].sort((a, b) => a.name.localeCompare(b.name));
  });
  readonly isLoading = this.resource.isLoading;
  readonly error = computed(() => {
    const error = this.resource.error();
    return error ? errorMessage(error) : null;
  });

  reload(): void {
    this.resource.reload();
  }
}
