export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'high' | 'medium' | 'low';

export interface Assignee {
  id: string;
  name: string;
  avatar: string;
  email: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  /** Calendar date in `YYYY-MM-DD` format. */
  dueDate: string;
  completedAt?: string | null;
  assignee: Assignee;
  tags: string[];
  /** Sort key inside a board column; fractional values allow single-request reordering. */
  order: number;
  createdAt: string;
  updatedAt: string;
}

/** Fields the user can edit through the task form. */
export type TaskDraft = Pick<
  Task,
  'title' | 'description' | 'status' | 'priority' | 'dueDate' | 'assignee' | 'tags'
>;

export const TASK_STATUSES: readonly TaskStatus[] = ['todo', 'in_progress', 'done'];
export const TASK_PRIORITIES: readonly TaskPriority[] = ['high', 'medium', 'low'];

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};
