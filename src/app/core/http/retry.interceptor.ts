import type { HttpInterceptorFn } from '@angular/common/http';
import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { retry, throwError, timer } from 'rxjs';
import { APP_CONFIG } from '../config/app-config';

const IDEMPOTENT_METHODS = new Set(['GET', 'HEAD', 'OPTIONS', 'PUT', 'DELETE']);
const RETRYABLE_STATUSES = new Set([0, 408, 429, 500, 502, 503, 504]);

/** Only transient failures (network, timeouts, throttling, 5xx) are worth retrying. */
export function isRetryable(error: unknown): boolean {
  return error instanceof HttpErrorResponse && RETRYABLE_STATUSES.has(error.status);
}

/**
 * Retries idempotent requests on transient errors with exponential backoff
 * (`initialDelayMs`, `2×`, `4×`, …). Non-idempotent requests (POST/PATCH) are never
 * retried to avoid duplicate writes.
 */
export const retryInterceptor: HttpInterceptorFn = (req, next) => {
  const { retry: policy } = inject(APP_CONFIG);
  if (!IDEMPOTENT_METHODS.has(req.method)) return next(req);

  return next(req).pipe(
    retry({
      count: policy.count,
      delay: (error: unknown, attempt: number) =>
        isRetryable(error)
          ? timer(policy.initialDelayMs * 2 ** (attempt - 1))
          : throwError(() => error),
    }),
  );
};
