import { ApplicationRef } from '@angular/core';
import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import {
  JOHN,
  makeActivity,
  makeTask,
  provideTestEnvironment,
  SARAH,
  TODAY,
} from '../../testing/fixtures';
import type { StatisticsResponse } from '../models';
import { ACTIVITY_FEED_LIMIT, ActivityStore } from './activity.store';
import { StatisticsStore } from './statistics.store';
import { UserStore } from './user.store';

const settle = () => TestBed.inject(ApplicationRef).whenStable();

describe('supporting stores', () => {
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: provideTestEnvironment() });
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  const respond = (url: string, body: object) =>
    controller
      .match((req) => req.url === url && req.method === 'GET')
      .forEach((r) => r.flush(body));
  const fail = (url: string) =>
    controller
      .match((req) => req.url === url && req.method === 'GET')
      .forEach((r) => r.flush(null, { status: 503, statusText: 'Unavailable' }));

  describe('ActivityStore', () => {
    it('loads the latest activities sorted by the server', async () => {
      const store = TestBed.inject(ActivityStore);
      TestBed.tick();

      const req = controller.expectOne((r) => r.url === '/api/activities');
      expect(req.request.params.get('_sort')).toBe('timestamp');
      expect(req.request.params.get('_order')).toBe('desc');
      expect(req.request.params.get('_limit')).toBe(String(ACTIVITY_FEED_LIMIT));
      req.flush([makeActivity()]);
      await settle();

      expect(store.activities()).toEqual([makeActivity()]);
      expect(store.error()).toBeNull();
    });

    it('prepends recorded activity and persists it in the background', async () => {
      const store = TestBed.inject(ActivityStore);
      TestBed.tick();
      respond('/api/activities', [makeActivity()]);
      await settle();

      const entry = store.record('status_changed', { id: 't1', title: 'Ship it' }, 'To Do → Done');
      expect(entry).toMatchObject({
        type: 'status_changed',
        taskId: 't1',
        taskTitle: 'Ship it',
        actor: JOHN.name,
        timestamp: TODAY.toISOString(),
        detail: 'To Do → Done',
      });
      expect(store.activities()[0]).toBe(entry);

      const post = controller.expectOne((r) => r.method === 'POST');
      expect(post.request.body).toEqual(entry);
      post.flush(entry);
    });

    it('logs (but does not surface) failed activity writes', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const store = TestBed.inject(ActivityStore);
      TestBed.tick();
      respond('/api/activities', []);
      await settle();

      const entry = store.record('created', { id: 't1', title: 'New' });
      expect(entry).not.toHaveProperty('detail');
      controller
        .expectOne((r) => r.method === 'POST')
        .flush(null, { status: 500, statusText: 'Error' });
      await settle();
      await Promise.resolve();

      expect(warn).toHaveBeenCalledWith('Failed to persist activity', expect.anything());
      expect(store.activities()).toEqual([entry]);
    });

    it('reports load errors and reloads', async () => {
      const store = TestBed.inject(ActivityStore);
      TestBed.tick();
      fail('/api/activities');
      await settle();
      expect(store.error()).toContain('server');
      expect(store.activities()).toEqual([]);

      store.reload();
      TestBed.tick();
      respond('/api/activities', [makeActivity()]);
      await settle();
      expect(store.activities()).toHaveLength(1);
    });
  });

  describe('UserStore', () => {
    it('returns users from the API sorted by name', async () => {
      const store = TestBed.inject(UserStore);
      TestBed.tick();
      respond('/api/users', [SARAH, JOHN]);
      respond('/api/tasks', []);
      respond('/api/activities', []);
      await settle();

      expect(store.users()).toEqual([JOHN, SARAH]);
      expect(store.error()).toBeNull();
    });

    it('falls back to task assignees when the endpoint fails', async () => {
      const store = TestBed.inject(UserStore);
      TestBed.tick();
      fail('/api/users');
      respond('/api/tasks', [makeTask({ assignee: SARAH }), makeTask({ assignee: JOHN })]);
      respond('/api/activities', []);
      await settle();

      expect(store.error()).not.toBeNull();
      expect(store.users()).toEqual([JOHN, SARAH]);

      store.reload();
      TestBed.tick();
      respond('/api/users', [SARAH]);
      await settle();
      expect(store.users()).toEqual([SARAH]);
    });
  });

  describe('StatisticsStore', () => {
    const remote: StatisticsResponse = {
      statistics: [
        {
          id: 'stat-001',
          title: 'Total Tasks',
          icon: '📊',
          value: 999,
          change: '+12',
          changeLabel: 'this week',
          changeType: 'positive',
          color: '#1976D2',
        },
      ],
      lastUpdated: '2026-10-28T10:00:00.000Z',
    };

    it('merges remote metadata with live values derived from tasks', async () => {
      const store = TestBed.inject(StatisticsStore);
      TestBed.tick();
      expect(store.isLoading()).toBe(true);

      respond('/api/statistics', remote);
      respond('/api/tasks', [
        makeTask({ status: 'done' }),
        makeTask({ status: 'in_progress' }),
        makeTask({ status: 'todo', dueDate: '2026-10-01' }),
      ]);
      respond('/api/activities', []);
      await settle();

      expect(store.isLoading()).toBe(false);
      const cards = store.cards();
      expect(cards.map((c) => c.value)).toEqual([3, 1, 1, 1]);
      expect(cards[0]).toMatchObject({ change: '+12', changeLabel: 'this week' });
      expect(cards[3]).toMatchObject({ title: 'Overdue', change: '' });
    });

    it('uses default card definitions when statistics are unavailable', async () => {
      const store = TestBed.inject(StatisticsStore);
      TestBed.tick();
      fail('/api/statistics');
      respond('/api/tasks', []);
      respond('/api/activities', []);
      await settle();

      expect(store.cards().map((c) => c.title)).toEqual([
        'Total Tasks',
        'Completed',
        'In Progress',
        'Overdue',
      ]);

      store.reload();
      TestBed.tick();
      respond('/api/statistics', remote);
      await settle();
      expect(store.cards()[0].change).toBe('+12');
    });
  });
});
