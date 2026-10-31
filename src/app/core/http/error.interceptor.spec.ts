import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { provideTestEnvironment } from '../../testing/fixtures';
import { ApiError, errorMessage, userMessageFor } from './api-error';
import { errorInterceptor } from './error.interceptor';

describe('errorInterceptor', () => {
  it('maps HttpErrorResponse to ApiError', async () => {
    TestBed.configureTestingModule({ providers: provideTestEnvironment([errorInterceptor]) });
    const http = TestBed.inject(HttpClient);
    const controller = TestBed.inject(HttpTestingController);

    const result = firstValueFrom(http.get('/api/tasks/x'));
    controller.expectOne('/api/tasks/x').flush(null, { status: 404, statusText: 'Not Found' });

    const error = await result.catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 404,
      url: '/api/tasks/x',
      message: 'The requested item could not be found.',
    });
  });
});

describe('api error helpers', () => {
  it('maps status codes to user-facing messages', () => {
    expect(userMessageFor(0)).toContain('Unable to reach the server');
    expect(userMessageFor(409)).toContain('changed by someone else');
    expect(userMessageFor(422)).toBe('The request was rejected by the server.');
    expect(userMessageFor(500)).toBe('The server encountered an error. Please try again.');
  });

  it('extracts a displayable message from any error', () => {
    expect(errorMessage(new ApiError('Custom', 400))).toBe('Custom');
    expect(errorMessage(new HttpErrorResponse({ status: 404 }))).toBe(
      'The requested item could not be found.',
    );
    expect(errorMessage(new Error('Plain'))).toBe('Plain');
    expect(errorMessage(new Error(''))).toBe('Something went wrong. Please try again.');
    expect(errorMessage('nope')).toBe('Something went wrong. Please try again.');
  });
});
