import type { HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { NOW } from '../config/app-config';

interface CacheEntry {
  response: HttpResponse<unknown>;
  expiresAt: number;
}

/** In-memory store backing {@link cacheInterceptor}, keyed by `urlWithParams`. */
@Injectable({ providedIn: 'root' })
export class HttpCacheService {
  private readonly now = inject(NOW);
  private readonly entries = new Map<string, CacheEntry>();

  get(key: string): HttpResponse<unknown> | undefined {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= this.now().getTime()) {
      this.entries.delete(key);
      return undefined;
    }
    return entry.response;
  }

  set(key: string, response: HttpResponse<unknown>, ttlMs: number): void {
    this.entries.set(key, { response, expiresAt: this.now().getTime() + ttlMs });
  }

  /** Drops every entry whose key starts with `prefix` (e.g. `/api/tasks` also clears `/api/tasks?x=1`). */
  invalidate(prefix: string): void {
    for (const key of this.entries.keys()) {
      if (key.startsWith(prefix)) this.entries.delete(key);
    }
  }

  clear(): void {
    this.entries.clear();
  }

  get size(): number {
    return this.entries.size;
  }
}
