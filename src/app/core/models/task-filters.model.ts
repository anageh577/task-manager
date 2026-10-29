import type { TaskPriority, TaskStatus } from './task.model';

export const ALL = 'all' as const;
export type All = typeof ALL;

export interface TaskFilters {
  search: string;
  status: TaskStatus | All;
  priority: TaskPriority | All;
  assigneeId: string | All;
}

export const DEFAULT_TASK_FILTERS: TaskFilters = {
  search: '',
  status: ALL,
  priority: ALL,
  assigneeId: ALL,
};
