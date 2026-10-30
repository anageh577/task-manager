import type { Assignee, Task, TaskFilters, TaskPriority, TaskStatus } from '../models';
import { ALL, TASK_PRIORITIES, TASK_STATUSES } from '../models';

/** Spacing between `order` values when tasks are appended to a column. */
export const ORDER_STEP = 1000;

/** Case-insensitive match of the search term against title, description and tags. */
export function matchesSearch(task: Task, search: string): boolean {
  const term = search.trim().toLowerCase();
  if (!term) return true;
  return (
    task.title.toLowerCase().includes(term) ||
    task.description.toLowerCase().includes(term) ||
    task.tags.some((tag) => tag.toLowerCase().includes(term))
  );
}

export function filterTasks(tasks: readonly Task[], filters: TaskFilters): Task[] {
  return tasks.filter(
    (task) =>
      (filters.status === ALL || task.status === filters.status) &&
      (filters.priority === ALL || task.priority === filters.priority) &&
      (filters.assigneeId === ALL || task.assignee.id === filters.assigneeId) &&
      matchesSearch(task, filters.search),
  );
}

export function sortByOrder(tasks: readonly Task[]): Task[] {
  return [...tasks].sort((a, b) => a.order - b.order);
}

/** Groups tasks into board columns, each sorted by its `order` key. */
export function groupByStatus(tasks: readonly Task[]): Record<TaskStatus, Task[]> {
  const groups: Record<TaskStatus, Task[]> = { todo: [], in_progress: [], done: [] };
  for (const task of sortByOrder(tasks)) {
    groups[task.status].push(task);
  }
  return groups;
}

export function countByStatus(tasks: readonly Task[]): Record<TaskStatus, number> {
  return Object.fromEntries(
    TASK_STATUSES.map((status) => [status, tasks.filter((t) => t.status === status).length]),
  ) as Record<TaskStatus, number>;
}

export function countByPriority(tasks: readonly Task[]): Record<TaskPriority, number> {
  return Object.fromEntries(
    TASK_PRIORITIES.map((priority) => [
      priority,
      tasks.filter((t) => t.priority === priority).length,
    ]),
  ) as Record<TaskPriority, number>;
}

/**
 * Computes a fractional `order` for a task dropped between two neighbours, so a
 * reorder only needs to persist the moved task instead of renumbering the column.
 */
export function orderBetween(previous?: Task, next?: Task): number {
  if (previous && next) return (previous.order + next.order) / 2;
  if (previous) return previous.order + ORDER_STEP;
  if (next) return next.order - ORDER_STEP;
  return ORDER_STEP;
}

/** Order value that appends a task at the end of the given column. */
export function nextOrderFor(tasks: readonly Task[], status: TaskStatus): number {
  const orders = tasks.filter((t) => t.status === status).map((t) => t.order);
  return (orders.length ? Math.max(...orders) : 0) + ORDER_STEP;
}

export function uniqueAssignees(tasks: readonly Task[]): Assignee[] {
  return [...new Map(tasks.map((task) => [task.assignee.id, task.assignee])).values()];
}

export function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

export function generateId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}
