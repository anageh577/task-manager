import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { provideTestEnvironment } from '../../testing/fixtures';
import { BYPASS_CACHE, cacheInterceptor, collectionUrl } from './cache.interceptor';
import { HttpCacheService } from './http-cache.service';

describe('cacheInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let cache: HttpCacheService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: provideTestEnvironment([cacheInterceptor]) });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
    cache = TestBed.inject(HttpCacheService);
  });

  afterEach(() => controller.verify());

  it('derives the affected collection from mutation URLs', () => {
    expect(collectionUrl('POST', '/api/tasks')).toBe('/api/tasks');
    expect(collectionUrl('POST', '/api/tasks/?x=1')).toBe('/api/tasks');
    expect(collectionUrl('PATCH', '/api/tasks/task-1')).toBe('/api/tasks');
    expect(collectionUrl('DELETE', '/api/tasks/task-1')).toBe('/api/tasks');
  });

  it('serves repeated GETs from the cache', async () => {
    const first = firstValueFrom(http.get('/api/tasks'));
    controller.expectOne('/api/tasks').flush([{ id: 1 }]);
    expect(await first).toEqual([{ id: 1 }]);

    expect(await firstValueFrom(http.get('/api/tasks'))).toEqual([{ id: 1 }]);
    controller.expectNone('/api/tasks');
  });

  it('skips the cache when BYPASS_CACHE is set but still stores the fresh response', async () => {
    cache.set('/api/tasks', new HttpResponse({ body: [] }), 1000);

    const request = firstValueFrom(
      http.get('/api/tasks', { context: new HttpContext().set(BYPASS_CACHE, true) }),
    );
    controller.expectOne('/api/tasks').flush([{ id: 2 }]);
    expect(await request).toEqual([{ id: 2 }]);
    expect(cache.get('/api/tasks')?.body).toEqual([{ id: 2 }]);
  });

  it('does not cache failed responses', async () => {
    const request = firstValueFrom(http.get('/api/tasks'));
    controller.expectOne('/api/tasks').flush(null, { status: 500, statusText: 'Error' });
    await expect(request).rejects.toBeTruthy();
    expect(cache.size).toBe(0);
  });

  it('invalidates the collection after a mutation, even when it fails', async () => {
    const seed = firstValueFrom(http.get('/api/tasks'));
    controller.expectOne('/api/tasks').flush([]);
    await seed;
    expect(cache.size).toBe(1);

    const patch = firstValueFrom(http.patch('/api/tasks/task-1', {}));
    controller.expectOne('/api/tasks/task-1').flush(null, { status: 500, statusText: 'Error' });
    await expect(patch).rejects.toBeTruthy();
    expect(cache.size).toBe(0);
  });
});
