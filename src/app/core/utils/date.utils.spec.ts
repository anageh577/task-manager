import { TODAY } from '../../testing/fixtures';
import {
  calendarDaysBetween,
  getDueInfo,
  isOverdue,
  parseIsoDate,
  relativeTime,
  toIsoDate,
} from './date.utils';

describe('date utils', () => {
  it('formats and parses local calendar dates', () => {
    expect(toIsoDate(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05');
    const parsed = parseIsoDate('2026-03-09T18:00:00.000Z');
    expect([parsed.getFullYear(), parsed.getMonth(), parsed.getDate()]).toEqual([2026, 2, 9]);
  });

  it('counts whole calendar days regardless of time of day', () => {
    expect(calendarDaysBetween(TODAY, new Date(2026, 9, 29, 0, 1))).toBe(1);
    expect(calendarDaysBetween(TODAY, new Date(2026, 9, 25, 23, 59))).toBe(-3);
    expect(calendarDaysBetween(TODAY, TODAY)).toBe(0);
  });

  describe('isOverdue', () => {
    it('is true only for unfinished tasks due before today', () => {
      expect(isOverdue({ status: 'todo', dueDate: '2026-10-27' }, TODAY)).toBe(true);
      expect(isOverdue({ status: 'todo', dueDate: '2026-10-28' }, TODAY)).toBe(false);
      expect(isOverdue({ status: 'done', dueDate: '2026-10-01' }, TODAY)).toBe(false);
    });
  });

  describe('getDueInfo', () => {
    const due = (dueDate: string) => getDueInfo({ status: 'todo', dueDate }, TODAY);
    const done = (completedAt: string | null) =>
      getDueInfo({ status: 'done', dueDate: '2026-10-01', completedAt }, TODAY);

    it('describes upcoming and overdue due dates', () => {
      expect(due('2026-10-26')).toEqual({
        icon: '⚠️',
        label: 'Overdue by 2 days',
        tone: 'overdue',
      });
      expect(due('2026-10-27').label).toBe('Overdue by 1 day');
      expect(due('2026-10-28')).toEqual({ icon: '📅', label: 'Due today', tone: 'upcoming' });
      expect(due('2026-10-29').label).toBe('Due tomorrow');
      expect(due('2026-11-01').label).toBe('Due in 4 days');
      expect(due('2026-11-04').label).toBe('Due in 1 week');
      expect(due('2026-11-20').label).toBe('Due in 3 weeks');
    });

    it('describes completion time for done tasks', () => {
      expect(done(new Date(2026, 9, 28, 8).toISOString())).toEqual({
        icon: '✅',
        label: 'Completed today',
        tone: 'completed',
      });
      expect(done(new Date(2026, 9, 27, 8).toISOString()).label).toBe('Completed yesterday');
      expect(done(new Date(2026, 9, 23, 8).toISOString()).label).toBe('Completed 5 days ago');
      expect(done(null).label).toBe('Completed');
    });
  });

  it('formats relative timestamps', () => {
    const at = (msAgo: number) => new Date(TODAY.getTime() - msAgo).toISOString();
    expect(relativeTime(at(20_000), TODAY)).toBe('just now');
    expect(relativeTime(at(-60_000), TODAY)).toBe('just now');
    expect(relativeTime(at(5 * 60_000), TODAY)).toBe('5m ago');
    expect(relativeTime(at(3 * 3_600_000), TODAY)).toBe('3h ago');
    expect(relativeTime(at(50 * 3_600_000), TODAY)).toBe('2d ago');
  });
});
