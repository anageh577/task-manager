import type { Task } from '../models';

const MS_PER_DAY = 86_400_000;

export type DueTone = 'overdue' | 'upcoming' | 'completed';

export interface MessageDescriptor {
  key: string;
  params?: Record<string, number>;
}

export interface DueInfo {
  icon: string;
  /** Translation key rendered by the template (`due.today`, `due.overdueOther`, …). */
  labelKey: string;
  labelParams?: Record<string, number>;
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

/** Builds the due-date line shown on task cards ("Overdue by 2 days", "Due in 3 days", "Completed today"). */
export function getDueInfo(
  task: Pick<Task, 'status' | 'dueDate' | 'completedAt'>,
  today = new Date(),
): DueInfo {
  if (task.status === 'done') {
    const completedDaysAgo = task.completedAt
      ? calendarDaysBetween(new Date(task.completedAt), today)
      : null;
    if (completedDaysAgo === null)
      return { icon: '✅', labelKey: 'due.completed', tone: 'completed' };
    if (completedDaysAgo <= 0) {
      return { icon: '✅', labelKey: 'due.completedToday', tone: 'completed' };
    }
    if (completedDaysAgo === 1) {
      return { icon: '✅', labelKey: 'due.completedYesterday', tone: 'completed' };
    }
    return {
      icon: '✅',
      labelKey: 'due.completedDaysAgo',
      labelParams: { count: completedDaysAgo },
      tone: 'completed',
    };
  }

  const daysLeft = calendarDaysBetween(today, parseIsoDate(task.dueDate));
  if (daysLeft < 0) {
    const count = -daysLeft;
    return {
      icon: '⚠️',
      labelKey: count === 1 ? 'due.overdueOne' : 'due.overdueOther',
      labelParams: { count },
      tone: 'overdue',
    };
  }
  if (daysLeft === 0) return { icon: '📅', labelKey: 'due.today', tone: 'upcoming' };
  if (daysLeft === 1) return { icon: '📅', labelKey: 'due.tomorrow', tone: 'upcoming' };
  if (daysLeft < 7) {
    return {
      icon: '📅',
      labelKey: 'due.inDays',
      labelParams: { count: daysLeft },
      tone: 'upcoming',
    };
  }
  const weeks = Math.floor(daysLeft / 7);
  return {
    icon: '📅',
    labelKey: weeks === 1 ? 'due.inWeek' : 'due.inWeeks',
    labelParams: { count: weeks },
    tone: 'upcoming',
  };
}

/** Compact relative time for the activity feed ("just now", "5m ago", "3h ago", "2d ago"). */
export function relativeTime(timestamp: string, now = new Date()): MessageDescriptor {
  const seconds = Math.max(0, Math.floor((now.getTime() - new Date(timestamp).getTime()) / 1000));
  if (seconds < 60) return { key: 'time.justNow' };
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return { key: 'time.minutesAgo', params: { count: minutes } };
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return { key: 'time.hoursAgo', params: { count: hours } };
  return { key: 'time.daysAgo', params: { count: Math.floor(hours / 24) } };
}
