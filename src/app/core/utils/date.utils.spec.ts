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
        labelKey: 'due.overdueOther',
        labelParams: { count: 2 },
        tone: 'overdue',
      });
      expect(due('2026-10-27')).toMatchObject({
        labelKey: 'due.overdueOne',
        labelParams: { count: 1 },
      });
      expect(due('2026-10-28')).toEqual({ icon: '📅', labelKey: 'due.today', tone: 'upcoming' });
      expect(due('2026-10-29').labelKey).toBe('due.tomorrow');
      expect(due('2026-11-01')).toMatchObject({
        labelKey: 'due.inDays',
        labelParams: { count: 4 },
      });
      expect(due('2026-11-04')).toMatchObject({
        labelKey: 'due.inWeek',
        labelParams: { count: 1 },
      });
      expect(due('2026-11-20')).toMatchObject({
        labelKey: 'due.inWeeks',
        labelParams: { count: 3 },
      });
    });

    it('describes completion time for done tasks', () => {
      expect(done(new Date(2026, 9, 28, 8).toISOString())).toEqual({
        icon: '✅',
        labelKey: 'due.completedToday',
        tone: 'completed',
      });
      expect(done(new Date(2026, 9, 27, 8).toISOString()).labelKey).toBe('due.completedYesterday');
      expect(done(new Date(2026, 9, 23, 8).toISOString())).toMatchObject({
        labelKey: 'due.completedDaysAgo',
        labelParams: { count: 5 },
      });
      expect(done(null).labelKey).toBe('due.completed');
    });
  });

  it('formats relative timestamps', () => {
    const at = (msAgo: number) => new Date(TODAY.getTime() - msAgo).toISOString();
    expect(relativeTime(at(20_000), TODAY)).toEqual({ key: 'time.justNow' });
    expect(relativeTime(at(-60_000), TODAY)).toEqual({ key: 'time.justNow' });
    expect(relativeTime(at(5 * 60_000), TODAY)).toEqual({
      key: 'time.minutesAgo',
      params: { count: 5 },
    });
    expect(relativeTime(at(3 * 3_600_000), TODAY)).toEqual({
      key: 'time.hoursAgo',
      params: { count: 3 },
    });
    expect(relativeTime(at(50 * 3_600_000), TODAY)).toEqual({
      key: 'time.daysAgo',
      params: { count: 2 },
    });
  });
});
