import type { HttpInterceptorFn } from '@angular/common/http';
import { HttpContextToken, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize, of, tap } from 'rxjs';
import { APP_CONFIG } from '../config/app-config';
import { HttpCacheService } from './http-cache.service';

/** Set to `true` on a request to skip reading from the cache (the fresh response is still stored). */
export const BYPASS_CACHE = new HttpContextToken<boolean>(() => false);

/**
 * Resolves the collection a mutation affects: `POST /api/tasks` → `/api/tasks`,
 * `PATCH /api/tasks/task-1` → `/api/tasks`.
 */
export function collectionUrl(method: string, url: string): string {
  const path = url.split('?')[0].replace(/\/+$/, '');
  return method === 'POST' ? path : path.slice(0, path.lastIndexOf('/'));
}

/**
 * Caches successful GET responses for `cacheTtlMs` and invalidates the affected
 * collection whenever a mutation completes (successfully or not, since the server
 * state may have changed either way).
 */
export const cacheInterceptor: HttpInterceptorFn = (req, next) => {
  const cache = inject(HttpCacheService);
  const { cacheTtlMs } = inject(APP_CONFIG);

  if (req.method !== 'GET') {
    return next(req).pipe(finalize(() => cache.invalidate(collectionUrl(req.method, req.url))));
  }

  const key = req.urlWithParams;
  const cached = req.context.get(BYPASS_CACHE) ? undefined : cache.get(key);
  if (cached) return of(cached.clone());

  return next(req).pipe(
    tap((event) => {
      if (event instanceof HttpResponse) cache.set(key, event, cacheTtlMs);
    }),
  );
};
