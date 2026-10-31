import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { provideTestEnvironment } from '../../testing/fixtures';
import { isRetryable, retryInterceptor } from './retry.interceptor';

describe('retryInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;

  const serverError = { status: 503, statusText: 'Unavailable' };

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({ providers: provideTestEnvironment([retryInterceptor]) });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    controller.verify();
    vi.useRealTimers();
  });

  it('classifies transient errors as retryable', () => {
    expect(isRetryable(new HttpErrorResponse({ status: 0 }))).toBe(true);
    expect(isRetryable(new HttpErrorResponse({ status: 503 }))).toBe(true);
    expect(isRetryable(new HttpErrorResponse({ status: 404 }))).toBe(false);
    expect(isRetryable(new Error('boom'))).toBe(false);
  });

  it('retries idempotent requests with exponential backoff', async () => {
    const result = firstValueFrom(http.get('/api/tasks'));

    controller.expectOne('/api/tasks').flush(null, serverError);
    await vi.advanceTimersByTimeAsync(9);
    controller.expectNone('/api/tasks');
    await vi.advanceTimersByTimeAsync(1);
    controller.expectOne('/api/tasks').flush(null, serverError);

    await vi.advanceTimersByTimeAsync(20);
    controller.expectOne('/api/tasks').flush(['ok']);

    expect(await result).toEqual(['ok']);
  });

  it('gives up after the configured number of retries', async () => {
    const result = firstValueFrom(http.delete('/api/tasks/1'));
    const assertion = expect(result).rejects.toMatchObject({ status: 503 });

    controller.expectOne('/api/tasks/1').flush(null, serverError);
    await vi.advanceTimersByTimeAsync(10);
    controller.expectOne('/api/tasks/1').flush(null, serverError);
    await vi.advanceTimersByTimeAsync(20);
    controller.expectOne('/api/tasks/1').flush(null, serverError);

    await assertion;
  });

  it('does not retry client errors', async () => {
    const result = firstValueFrom(http.get('/api/tasks/missing'));
    controller
      .expectOne('/api/tasks/missing')
      .flush(null, { status: 404, statusText: 'Not Found' });
    await expect(result).rejects.toMatchObject({ status: 404 });
  });

  it('never retries non-idempotent requests', async () => {
    const result = firstValueFrom(http.post('/api/tasks', {}));
    controller.expectOne('/api/tasks').flush(null, serverError);
    await expect(result).rejects.toMatchObject({ status: 503 });
    await vi.advanceTimersByTimeAsync(100);
    controller.expectNone('/api/tasks');
  });
});
