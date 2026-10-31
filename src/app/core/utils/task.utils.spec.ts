import { DEFAULT_TASK_FILTERS } from '../models';
import { JOHN, makeTask, SARAH } from '../../testing/fixtures';
import {
  countByPriority,
  countByStatus,
  filterTasks,
  generateId,
  groupByStatus,
  matchesSearch,
  nextOrderFor,
  ORDER_STEP,
  orderBetween,
  sortByOrder,
  uniqueAssignees,
} from './task.utils';

describe('task utils', () => {
  const login = makeTask({
    title: 'Fix login bug',
    status: 'in_progress',
    priority: 'high',
    tags: ['Backend'],
    order: 2000,
  });
  const docs = makeTask({
    title: 'Docs',
    description: 'Update the README',
    assignee: SARAH,
    priority: 'low',
    order: 1000,
  });
  const audit = makeTask({ title: 'Security audit', status: 'done', order: 500 });
  const tasks = [login, docs, audit];

  describe('matchesSearch', () => {
    it('matches title, description and tags case-insensitively', () => {
      expect(matchesSearch(login, '  LOGIN ')).toBe(true);
      expect(matchesSearch(docs, 'readme')).toBe(true);
      expect(matchesSearch(login, 'backend')).toBe(true);
      expect(matchesSearch(login, 'frontend')).toBe(false);
      expect(matchesSearch(login, '   ')).toBe(true);
    });
  });

  describe('filterTasks', () => {
    it('returns everything for default filters', () => {
      expect(filterTasks(tasks, DEFAULT_TASK_FILTERS)).toEqual(tasks);
    });

    it('combines status, priority, assignee and search filters', () => {
      expect(filterTasks(tasks, { ...DEFAULT_TASK_FILTERS, status: 'done' })).toEqual([audit]);
      expect(filterTasks(tasks, { ...DEFAULT_TASK_FILTERS, priority: 'low' })).toEqual([docs]);
      expect(filterTasks(tasks, { ...DEFAULT_TASK_FILTERS, assigneeId: JOHN.id })).toEqual([
        login,
        audit,
      ]);
      expect(
        filterTasks(tasks, { ...DEFAULT_TASK_FILTERS, assigneeId: JOHN.id, search: 'audit' }),
      ).toEqual([audit]);
    });
  });

  it('sorts by order without mutating the input', () => {
    expect(sortByOrder(tasks).map((t) => t.order)).toEqual([500, 1000, 2000]);
    expect(tasks[0]).toBe(login);
  });

  it('groups tasks into ordered board columns', () => {
    expect(groupByStatus(tasks)).toEqual({ todo: [docs], in_progress: [login], done: [audit] });
  });

  it('counts tasks by status and priority', () => {
    expect(countByStatus(tasks)).toEqual({ todo: 1, in_progress: 1, done: 1 });
    expect(countByPriority(tasks)).toEqual({ high: 1, medium: 1, low: 1 });
  });

  describe('orderBetween', () => {
    const a = makeTask({ order: 1000 });
    const b = makeTask({ order: 2000 });

    it('places a task between, before, after or alone', () => {
      expect(orderBetween(a, b)).toBe(1500);
      expect(orderBetween(undefined, a)).toBe(1000 - ORDER_STEP);
      expect(orderBetween(b, undefined)).toBe(2000 + ORDER_STEP);
      expect(orderBetween()).toBe(ORDER_STEP);
    });
  });

  it('appends to the end of a column', () => {
    expect(nextOrderFor(tasks, 'todo')).toBe(1000 + ORDER_STEP);
    expect(nextOrderFor([], 'todo')).toBe(ORDER_STEP);
  });

  it('extracts unique assignees', () => {
    expect(uniqueAssignees(tasks)).toEqual([JOHN, SARAH]);
  });

  it('generates prefixed ids', () => {
    expect(generateId('task')).toMatch(/^task-[0-9a-f]{8}$/);
    expect(generateId('task')).not.toBe(generateId('task'));
  });
});
