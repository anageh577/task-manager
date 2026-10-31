import { ApplicationRef } from '@angular/core';
import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { makeTask, provideTestEnvironment, SARAH, TODAY } from '../../testing/fixtures';
import type { Activity, Task, TaskDraft } from '../models';
import { TaskStore } from './task.store';

describe('TaskStore', () => {
  let store: TaskStore;
  let controller: HttpTestingController;

  const todoA = makeTask({
    id: 'a',
    title: 'Alpha',
    status: 'todo',
    order: 1000,
    dueDate: '2026-10-20',
  });
  const todoB = makeTask({ id: 'b', title: 'Beta', status: 'todo', order: 2000, priority: 'high' });
  const progress = makeTask({ id: 'c', title: 'Gamma', status: 'in_progress', order: 1000 });
  const done = makeTask({
    id: 'd',
    title: 'Delta',
    status: 'done',
    order: 1000,
    completedAt: '2026-10-27T10:00:00.000Z',
    dueDate: '2026-10-01',
  });
  const seed = [todoA, todoB, progress, done];

  const draftFrom = (task: Task, changes: Partial<TaskDraft> = {}): TaskDraft => ({
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate,
    assignee: task.assignee,
    tags: task.tags,
    ...changes,
  });

  const settle = () => TestBed.inject(ApplicationRef).whenStable();

  /** The activity feed loads lazily alongside the store; answer it so `verify()` passes. */
  const flushActivities = () =>
    controller
      .match((req) => req.url === '/api/activities' && req.method === 'GET')
      .forEach((req) => req.flush([]));

  const loggedActivities = (): Activity[] =>
    controller
      .match((req) => req.url === '/api/activities' && req.method === 'POST')
      .map((req) => {
        req.flush(req.request.body);
        return req.request.body as Activity;
      });

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: provideTestEnvironment() });
    store = TestBed.inject(TaskStore);
    controller = TestBed.inject(HttpTestingController);

    TestBed.tick();
    expect(store.isInitialLoad()).toBe(true);
    controller.expectOne('/api/tasks').flush(seed);
    flushActivities();
    await settle();
  });

  afterEach(() => {
    flushActivities();
    controller.verify();
  });

  it('loads tasks and derives counters', () => {
    expect(store.isInitialLoad()).toBe(false);
    expect(store.tasks()).toEqual(seed);
    expect(store.statusCounts()).toEqual({ todo: 2, in_progress: 1, done: 1 });
    expect(store.priorityCounts()).toEqual({ high: 1, medium: 3, low: 0 });
    expect(store.overdueCount()).toBe(1);
    expect(store.columns().todo.map((t) => t.id)).toEqual(['a', 'b']);
    expect(store.getById('c')).toBe(progress);
  });

  it('filters tasks and tracks whether filters are active', () => {
    expect(store.hasActiveFilters()).toBe(false);

    store.updateFilters({ priority: 'high' });
    expect(store.filteredTasks()).toEqual([todoB]);
    expect(store.hasActiveFilters()).toBe(true);

    store.updateFilters({ priority: 'all', search: 'gam' });
    expect(store.filteredTasks()).toEqual([progress]);

    store.resetFilters();
    expect(store.hasActiveFilters()).toBe(false);
    expect(store.filteredTasks()).toHaveLength(4);
  });

  it('exposes a friendly error when loading fails and recovers on reload', async () => {
    store.reload();
    TestBed.tick();
    controller.expectOne('/api/tasks').flush(null, { status: 500, statusText: 'Error' });
    await settle();

    expect(store.error()).toBe('The server encountered an error. Please try again.');
    expect(store.tasks()).toEqual([]);

    store.reload();
    TestBed.tick();
    controller.expectOne('/api/tasks').flush(seed);
    await settle();
    expect(store.error()).toBeNull();
    expect(store.tasks()).toHaveLength(4);
  });

  describe('create', () => {
    it('adds the task optimistically, persists it and logs activity', async () => {
      const pending = store.create(draftFrom(todoA, { title: 'New', status: 'todo' }));

      const created = store.tasks().at(-1)!;
      expect(created).toMatchObject({
        title: 'New',
        order: 3000,
        completedAt: null,
        createdAt: TODAY.toISOString(),
      });

      const req = controller.expectOne('/api/tasks');
      expect(req.request.method).toBe('POST');
      req.flush(req.request.body);

      await expect(pending).resolves.toEqual(created);
      expect(loggedActivities()).toEqual([
        expect.objectContaining({ type: 'created', taskTitle: 'New' }),
      ]);
    });

    it('stamps completedAt when created as done', async () => {
      const pending = store.create(draftFrom(done, { title: 'Already done' }));
      expect(store.tasks().at(-1)?.completedAt).toBe(TODAY.toISOString());
      controller.expectOne('/api/tasks').flush({});
      await pending;
      loggedActivities();
    });

    it('rolls back when the request fails', async () => {
      const pending = store.create(draftFrom(todoA, { title: 'Broken' }));
      expect(store.tasks()).toHaveLength(5);

      controller.expectOne('/api/tasks').flush(null, { status: 500, statusText: 'Error' });
      await expect(pending).rejects.toBeTruthy();
      expect(store.tasks()).toEqual(seed);
    });
  });

  describe('update', () => {
    it('patches the task and records an "updated" activity', async () => {
      const pending = store.update('b', draftFrom(todoB, { title: 'Beta 2', assignee: SARAH }));
      expect(store.getById('b')).toMatchObject({ title: 'Beta 2', assignee: SARAH });

      const req = controller.expectOne('/api/tasks/b');
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).not.toHaveProperty('completedAt');
      req.flush({});
      await pending;

      expect(loggedActivities()).toEqual([expect.objectContaining({ type: 'updated' })]);
    });

    it('sets completedAt and records completion when moved to done', async () => {
      const pending = store.update('b', draftFrom(todoB, { status: 'done' }));
      const req = controller.expectOne('/api/tasks/b');
      expect(req.request.body.completedAt).toBe(TODAY.toISOString());
      req.flush({});
      await pending;
      expect(loggedActivities()).toEqual([expect.objectContaining({ type: 'completed' })]);
    });

    it('clears completedAt and records a status change when reopened', async () => {
      const pending = store.update('d', draftFrom(done, { status: 'in_progress' }));
      const req = controller.expectOne('/api/tasks/d');
      expect(req.request.body.completedAt).toBeNull();
      req.flush({});
      await pending;
      expect(loggedActivities()).toEqual([
        expect.objectContaining({ type: 'status_changed', detail: 'Done → In Progress' }),
      ]);
    });

    it('rejects unknown ids', async () => {
      await expect(store.update('missing', draftFrom(todoA))).rejects.toThrow('not found');
    });
  });

  describe('move', () => {
    it('moves a task between columns using a fractional order', async () => {
      const pending = store.move('a', 'in_progress', 0);
      expect(store.getById('a')).toMatchObject({ status: 'in_progress', order: 0 });

      const req = controller.expectOne('/api/tasks/a');
      expect(req.request.body).toMatchObject({
        status: 'in_progress',
        order: 0,
        completedAt: null,
      });
      req.flush({});
      await pending;

      expect(store.columns().in_progress.map((t) => t.id)).toEqual(['a', 'c']);
      expect(loggedActivities()).toEqual([
        expect.objectContaining({ type: 'status_changed', detail: 'To Do → In Progress' }),
      ]);
    });

    it('reorders inside a column without logging activity', async () => {
      const pending = store.move('b', 'todo', 0);
      const req = controller.expectOne('/api/tasks/b');
      expect(req.request.body).toMatchObject({ order: 0 });
      expect(req.request.body).not.toHaveProperty('completedAt');
      req.flush({});
      await pending;

      expect(store.columns().todo.map((t) => t.id)).toEqual(['b', 'a']);
      expect(loggedActivities()).toEqual([]);
    });

    it('is a no-op when dropped where it already is', async () => {
      await store.move('a', 'todo', 0);
      controller.expectNone('/api/tasks/a');
    });

    it('rolls back on failure', async () => {
      const pending = store.move('a', 'done', 1);
      controller.expectOne('/api/tasks/a').flush(null, { status: 409, statusText: 'Conflict' });
      await expect(pending).rejects.toMatchObject({ status: 409 });
      expect(store.getById('a')).toEqual(todoA);
    });
  });

  describe('remove', () => {
    it('deletes the task and records activity', async () => {
      const pending = store.remove('c');
      expect(store.getById('c')).toBeUndefined();

      const req = controller.expectOne('/api/tasks/c');
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
      await pending;
      expect(loggedActivities()).toEqual([
        expect.objectContaining({ type: 'deleted', taskId: 'c' }),
      ]);
    });

    it('restores the task when deletion fails', async () => {
      const pending = store.remove('c');
      controller.expectOne('/api/tasks/c').flush(null, { status: 500, statusText: 'Error' });
      await expect(pending).rejects.toBeTruthy();
      expect(store.getById('c')).toEqual(progress);
    });
  });
});
