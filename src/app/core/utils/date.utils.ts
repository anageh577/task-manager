import type { Task } from '../models';

const MS_PER_DAY = 86_400_000;

export type DueTone = 'overdue' | 'upcoming' | 'completed';

export interface DueInfo {
  icon: string;
  label: string;
  tone: DueTone;
}

/** Formats a date as a local calendar date (`YYYY-MM-DD`), ignoring the time-zone shift of `toISOString`. */
export function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Parses `YYYY-MM-DD` (or a full ISO timestamp) into a local-midnight date. */
export function parseIsoDate(value: string): Date {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Whole calendar days from `from` to `to` (negative when `to` is in the past).
 * Uses UTC day numbers so DST transitions never produce fractional days.
 */
export function calendarDaysBetween(from: Date, to: Date): number {
  const fromUtc = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const toUtc = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((toUtc - fromUtc) / MS_PER_DAY);
}

/** A task is overdue when it is not done and its due date is before today. */
export function isOverdue(task: Pick<Task, 'status' | 'dueDate'>, today = new Date()): boolean {
  return task.status !== 'done' && calendarDaysBetween(today, parseIsoDate(task.dueDate)) < 0;
}

function plural(count: number, unit: string): string {
  return `${count} ${unit}${count === 1 ? '' : 's'}`;
}

/** Builds the due-date line shown on task cards ("Overdue by 2 days", "Due in 3 days", "Completed today"). */
export function getDueInfo(
  task: Pick<Task, 'status' | 'dueDate' | 'completedAt'>,
  today = new Date(),
): DueInfo {
  if (task.status === 'done') {
    const completedDaysAgo = task.completedAt
      ? calendarDaysBetween(new Date(task.completedAt), today)
      : null;
    const label =
      completedDaysAgo === null
        ? 'Completed'
        : completedDaysAgo <= 0
          ? 'Completed today'
          : completedDaysAgo === 1
            ? 'Completed yesterday'
            : `Completed ${plural(completedDaysAgo, 'day')} ago`;
    return { icon: '✅', label, tone: 'completed' };
  }

  const daysLeft = calendarDaysBetween(today, parseIsoDate(task.dueDate));
  if (daysLeft < 0) {
    return { icon: '⚠️', label: `Overdue by ${plural(-daysLeft, 'day')}`, tone: 'overdue' };
  }
  const label =
    daysLeft === 0
      ? 'Due today'
      : daysLeft === 1
        ? 'Due tomorrow'
        : daysLeft < 7
          ? `Due in ${plural(daysLeft, 'day')}`
          : `Due in ${plural(Math.floor(daysLeft / 7), 'week')}`;
  return { icon: '📅', label, tone: 'upcoming' };
}

/** Compact relative time for the activity feed ("just now", "5m ago", "3h ago", "2d ago"). */
export function relativeTime(timestamp: string, now = new Date()): string {
  const seconds = Math.max(0, Math.floor((now.getTime() - new Date(timestamp).getTime()) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
