import type { Task, TaskFilters, TaskStatus } from '../models';
import { ALL } from '../models';

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
