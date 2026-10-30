import { HttpErrorResponse } from '@angular/common/http';

/** Normalised API failure with a message that is safe to show to users. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly url: string | null = null,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static fromHttpError(error: HttpErrorResponse): ApiError {
    return new ApiError(userMessageFor(error.status), error.status, error.url);
  }
}

export function userMessageFor(status: number): string {
  if (status === 0) {
    return 'Unable to reach the server. Check your connection or make sure the mock API is running.';
  }
  if (status === 404) return 'The requested item could not be found.';
  if (status === 409) return 'This item was changed by someone else. Please refresh and try again.';
  if (status >= 400 && status < 500) return 'The request was rejected by the server.';
  return 'The server encountered an error. Please try again.';
}

/** Extracts a displayable message from anything thrown by HttpClient/httpResource. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof HttpErrorResponse) return userMessageFor(error.status);
  if (error instanceof Error && error.message) return error.message;
  return 'Something went wrong. Please try again.';
}
