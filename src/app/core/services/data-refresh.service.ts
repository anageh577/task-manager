import { inject, Injectable } from '@angular/core';
import { HttpCacheService } from '../http/http-cache.service';

/**
 * Reloads data that is already on screen.
 *
 * Stores register when a feature page creates them. Callers such as Settings can
 * then refresh that data without injecting the stores — injecting a store would
 * construct its `httpResource` and call an API the page never uses.
 */
@Injectable({ providedIn: 'root' })
export class DataRefreshService {
  private readonly cache = inject(HttpCacheService);
  private readonly reloaders = new Set<() => void>();

  register(reload: () => void): void {
    this.reloaders.add(reload);
  }

  /** Drops cached responses and reloads every store that is already in use. */
  refresh(): void {
    this.cache.clear();
    for (const reload of this.reloaders) reload();
  }
}

/** Join {@link DataRefreshService}. Call from a store constructor (injection context). */
export function registerForRefresh(reload: () => void): void {
  inject(DataRefreshService).register(reload);
}
