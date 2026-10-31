import type { HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { HttpErrorResponse, HttpParams, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { map } from 'rxjs';
import { APP_CONFIG } from '../config/app-config';

const RECORD_COLLECTIONS = new Set(['tasks', 'users', 'activities']);

/**
 * Translates the app's json-server calls (`/api/tasks`, `/api/tasks/:id`, …) into
 * Firebase Realtime Database REST calls when `databaseUrl` is set.
 *
 * Hosting cannot run json-server, and Cloud Functions need a billing account.
 * Records are stored under their id. Realtime Database turns arrays into objects,
 * so responses are converted back before the app sees them.
 */
export const databaseApiInterceptor: HttpInterceptorFn = (req, next) => {
  const { apiUrl, databaseUrl } = inject(APP_CONFIG);
  const route = databaseUrl ? parseRoute(req.url, apiUrl) : null;
  if (!databaseUrl || !route) return next(req);

  const id = route.id ?? (req.method === 'POST' ? recordId(req.body) : undefined);
  const method = req.method === 'POST' && id ? 'PUT' : req.method;
  const url = `${databaseUrl}/${route.collection}${id ? `/${encodeURIComponent(id)}` : ''}.json`;

  return next(req.clone({ method, url, params: new HttpParams() })).pipe(
    map((event) => {
      if (!(event instanceof HttpResponse)) return event;
      return adaptResponse(req, route.collection, id, event);
    }),
  );
};

function adaptResponse(
  req: HttpRequest<unknown>,
  collection: string,
  id: string | undefined,
  event: HttpResponse<unknown>,
): HttpResponse<unknown> {
  if (req.method === 'DELETE') return event.clone({ body: null });

  const body = restoreArrays(event.body);
  if (id && req.method === 'GET' && (body === null || body === undefined)) {
    throw new HttpErrorResponse({ status: 404, statusText: 'Not Found', url: req.url });
  }
  if (id || collection === 'statistics') {
    return event.clone({
      body: collection === 'statistics' && !id ? (body ?? { statistics: [] }) : body,
    });
  }

  const records = toRecords(body).map((record) =>
    collection === 'tasks'
      ? { ...record, tags: Array.isArray(record['tags']) ? record['tags'] : [] }
      : record,
  );
  return event.clone({ body: queryRecords(records, req.params) });
}

function parseRoute(url: string, apiUrl: string): { collection: string; id?: string } | null {
  const path = url.split('?')[0].replace(/\/+$/, '');
  if (!path.startsWith(`${apiUrl}/`)) return null;
  const [collection, id, ...rest] = path.slice(apiUrl.length + 1).split('/');
  if (
    !collection ||
    rest.length ||
    (!RECORD_COLLECTIONS.has(collection) && collection !== 'statistics')
  ) {
    return null;
  }
  return { collection, id: id ? decodeURIComponent(id) : undefined };
}

function recordId(body: unknown): string | undefined {
  if (!body || typeof body !== 'object' || !('id' in body)) return undefined;
  const id = body.id;
  return typeof id === 'string' && id ? id : undefined;
}

function toRecords(body: unknown): Record<string, unknown>[] {
  if (Array.isArray(body)) return body as Record<string, unknown>[];
  if (!body || typeof body !== 'object') return [];
  return Object.values(body as Record<string, unknown>).filter(
    (value): value is Record<string, unknown> => !!value && typeof value === 'object',
  );
}

/** Realtime Database stores arrays as `{"0": …, "1": …}`. Turn those back into arrays. */
function restoreArrays(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(restoreArrays);
  if (!value || typeof value !== 'object') return value;
  const entries = Object.entries(value as Record<string, unknown>).map(
    ([key, entry]) => [key, restoreArrays(entry)] as const,
  );
  const indexed = entries.length > 0 && entries.every(([key], index) => key === String(index));
  if (indexed) return entries.map(([, entry]) => entry);
  return Object.fromEntries(entries);
}

function queryRecords(
  records: Record<string, unknown>[],
  params: HttpParams,
): Record<string, unknown>[] {
  const sortKey = params.get('_sort');
  const descending = params.get('_order') === 'desc';
  const limit = Number(params.get('_limit'));
  const sorted = sortKey
    ? [...records].sort((a, b) => {
        const order = String(a[sortKey] ?? '').localeCompare(String(b[sortKey] ?? ''));
        return descending ? -order : order;
      })
    : records;
  return limit > 0 ? sorted.slice(0, limit) : sorted;
}
