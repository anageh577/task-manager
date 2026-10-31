import { HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { NOW } from '../config/app-config';
import { HttpCacheService } from './http-cache.service';

describe('HttpCacheService', () => {
  let now = 0;
  let cache: HttpCacheService;
  const response = new HttpResponse({ body: [1] });

  beforeEach(() => {
    now = 1_000;
    TestBed.configureTestingModule({
      providers: [{ provide: NOW, useValue: () => new Date(now) }],
    });
    cache = TestBed.inject(HttpCacheService);
  });

  it('returns entries until they expire', () => {
    cache.set('/api/tasks', response, 500);
    expect(cache.get('/api/tasks')).toBe(response);

    now += 500;
    expect(cache.get('/api/tasks')).toBeUndefined();
    expect(cache.size).toBe(0);
  });

  it('returns undefined for unknown keys', () => {
    expect(cache.get('/missing')).toBeUndefined();
  });

  it('invalidates entries by prefix and clears everything', () => {
    cache.set('/api/tasks', response, 1_000);
    cache.set('/api/tasks?status=done', response, 1_000);
    cache.set('/api/users', response, 1_000);

    cache.invalidate('/api/tasks');
    expect(cache.size).toBe(1);
    expect(cache.get('/api/users')).toBe(response);

    cache.clear();
    expect(cache.size).toBe(0);
  });
});
