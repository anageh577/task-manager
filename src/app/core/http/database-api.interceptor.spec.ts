import { HttpClient } from '@angular/common/http';
import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { APP_CONFIG } from '../config/app-config';
import { provideTestEnvironment, TEST_CONFIG } from '../../testing/fixtures';
import { databaseApiInterceptor } from './database-api.interceptor';

const DATABASE = 'https://task-manager-f67c6-default-rtdb.firebaseio.com';

describe('databaseApiInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;

  function setup(databaseUrl: string | null): void {
    TestBed.configureTestingModule({
      providers: [
        ...provideTestEnvironment([databaseApiInterceptor]),
        { provide: APP_CONFIG, useValue: { ...TEST_CONFIG, databaseUrl } },
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  }

  afterEach(() => controller.verify());

  it('leaves requests on json-server when no database is configured', async () => {
    setup(null);
    const patch = firstValueFrom(http.patch('/api/tasks/task-1', { status: 'done' }));
    controller.expectOne({ method: 'PATCH', url: '/api/tasks/task-1' }).flush({ id: 'task-1' });
    expect(await patch).toEqual({ id: 'task-1' });
  });

  it('reads a task map as an array and restores arrays stored as objects', async () => {
    setup(DATABASE);
    const tasks = firstValueFrom(http.get('/api/tasks'));
    controller.expectOne(`${DATABASE}/tasks.json`).flush({
      'task-1': { id: 'task-1', status: 'todo', tags: { 0: 'Finance' } },
      'task-2': { id: 'task-2', status: 'done' },
    });
    expect(await tasks).toEqual([
      { id: 'task-1', status: 'todo', tags: ['Finance'] },
      { id: 'task-2', status: 'done', tags: [] },
    ]);
  });

  it('sorts and limits activities', async () => {
    setup(DATABASE);
    const feed = firstValueFrom(
      http.get<{ id: string }[]>('/api/activities', {
        params: { _sort: 'timestamp', _order: 'desc', _limit: 2 },
      }),
    );
    const request = controller.expectOne(`${DATABASE}/activities.json`);
    expect(request.request.params.keys()).toEqual([]);
    request.flush({
      a: { id: 'a', timestamp: '2026-10-01' },
      b: { id: 'b', timestamp: '2026-10-03' },
      c: { id: 'c', timestamp: '2026-10-02' },
    });
    expect((await feed).map((entry) => entry.id)).toEqual(['b', 'c']);
  });

  it('patches and creates records at their id', async () => {
    setup(DATABASE);
    const patch = firstValueFrom(http.patch('/api/tasks/task-1', { status: 'in_progress' }));
    controller.expectOne({ method: 'PATCH', url: `${DATABASE}/tasks/task-1.json` }).flush({
      status: 'in_progress',
    });
    expect(await patch).toEqual({ status: 'in_progress' });

    const created = firstValueFrom(
      http.post('/api/tasks', { id: 'task-3', status: 'todo', tags: [] }),
    );
    controller
      .expectOne({ method: 'PUT', url: `${DATABASE}/tasks/task-3.json` })
      .flush({ id: 'task-3', status: 'todo', tags: [] });
    expect(await created).toEqual({ id: 'task-3', status: 'todo', tags: [] });
  });

  it('returns statistics with its list restored', async () => {
    setup(DATABASE);
    const stats = firstValueFrom(http.get('/api/statistics'));
    controller.expectOne(`${DATABASE}/statistics.json`).flush({
      statistics: { 0: { id: 'stat-001' } },
      lastUpdated: '2026-10-31',
    });
    expect(await stats).toEqual({
      statistics: [{ id: 'stat-001' }],
      lastUpdated: '2026-10-31',
    });
  });

  it('reports a missing record as 404', async () => {
    setup(DATABASE);
    const missing = firstValueFrom(http.get('/api/tasks/missing'));
    controller.expectOne(`${DATABASE}/tasks/missing.json`).flush(null);
    await expect(missing).rejects.toMatchObject({ status: 404 });
  });
});
