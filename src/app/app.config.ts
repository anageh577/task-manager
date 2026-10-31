import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import type { ApplicationConfig } from '@angular/core';
import { provideBrowserGlobalErrorListeners } from '@angular/core';
import {
  PreloadAllModules,
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
  withPreloading,
  withViewTransitions,
} from '@angular/router';

import { routes } from './app.routes';
import { cacheInterceptor } from './core/http/cache.interceptor';
import { errorInterceptor } from './core/http/error.interceptor';
import { databaseApiInterceptor } from './core/http/database-api.interceptor';
import { retryInterceptor } from './core/http/retry.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withPreloading(PreloadAllModules),
      withViewTransitions(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top' }),
    ),
    // Order matters: cache (outermost) → error normalisation → retry → database (closest to
    // the network), so cached responses skip the network entirely and errors are mapped only
    // after retries.
    provideHttpClient(
      withFetch(),
      withInterceptors([
        cacheInterceptor,
        errorInterceptor,
        retryInterceptor,
        databaseApiInterceptor,
      ]),
    ),
  ],
};
