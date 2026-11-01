import type { EnvironmentProviders, Provider } from '@angular/core';
import { ApplicationRef } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import type { HttpInterceptorFn } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MATERIAL_ANIMATIONS } from '@angular/material/core';
import { vi } from 'vitest';
import type { AppConfig } from '../core/config/app-config';
import { APP_CONFIG, NOW } from '../core/config/app-config';
import { LANGUAGE_STORAGE_KEY } from '../core/i18n/language';
import { provideI18n } from '../core/i18n/provide-i18n';
import type { Activity, Assignee, StatisticsResponse, Task } from '../core/models';

/** Fixed "today" used across specs: Wednesday 28 Oct 2026, noon local time. */
export const TODAY = new Date(2026, 9, 28, 12, 0, 0);

export const TEST_CONFIG: AppConfig = {
  apiUrl: '/api',
  cacheTtlMs: 30_000,
  retry: { count: 2, initialDelayMs: 10 },
  databaseUrl: null,
};

export const JOHN: Assignee = {
  id: 'user-001',
  name: 'John Doe',
  avatar: 'JD',
  email: 'john.doe@company.com',
};

export const SARAH: Assignee = {
  id: 'user-002',
  name: 'Sarah Smith',
  avatar: 'SS',
  email: 'sarah.smith@company.com',
};

let sequence = 0;

export function makeTask(overrides: Partial<Task> = {}): Task {
  sequence += 1;
  return {
    id: `task-${sequence}`,
    title: `Task ${sequence}`,
    description: 'Description',
    status: 'todo',
    priority: 'medium',
    dueDate: '2026-11-05',
    completedAt: null,
    assignee: JOHN,
    tags: [],
    order: sequence * 1000,
    createdAt: '2026-10-20T10:00:00.000Z',
    updatedAt: '2026-10-20T10:00:00.000Z',
    ...overrides,
  };
}

export function makeActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    id: 'act-1',
    type: 'created',
    taskId: 'task-1',
    taskTitle: 'Task 1',
    actor: 'John Doe',
    timestamp: '2026-10-28T11:55:00.000Z',
    ...overrides,
  };
}

export interface BackendData {
  tasks?: Task[];
  users?: Assignee[];
  activities?: Activity[];
  statistics?: StatisticsResponse;
}

/**
 * Answers the GETs (tasks, users, activities, statistics) issued by the `httpResource`-based
 * stores until no new ones appear, then waits for the app to settle. Looping matters because
 * lazy routes and late-created stores issue their requests asynchronously; `whenStable()`
 * alone would wait forever on an unanswered request.
 */
export async function flushBackend(data: BackendData = {}): Promise<void> {
  const bodies: Record<string, object> = {
    '/api/tasks': data.tasks ?? [],
    '/api/users': data.users ?? [],
    '/api/activities': data.activities ?? [],
    '/api/statistics': data.statistics ?? { statistics: [], lastUpdated: '' },
  };
  const controller = TestBed.inject(HttpTestingController);
  for (let quietRounds = 0; quietRounds < 2;) {
    TestBed.tick();
    const pending = controller.match((req) => req.method === 'GET' && req.url in bodies);
    pending.forEach((req) => req.flush(bodies[req.request.url]));
    quietRounds = pending.length ? 0 : quietRounds + 1;
    await new Promise((resolve) => setTimeout(resolve));
  }
  await TestBed.inject(ApplicationRef).whenStable();
}

/**
 * Fails every pending GET to `url` with a 503. Does not wait for stability: other
 * requests are usually still pending, so follow up with {@link flushBackend}.
 */
export function failRequest(url: string): void {
  TestBed.tick();
  TestBed.inject(HttpTestingController)
    .match((req) => req.method === 'GET' && req.url === url)
    .forEach((req) => req.flush(null, { status: 503, statusText: 'Unavailable' }));
}

export function mockTaskActions() {
  return {
    openCreate: vi.fn(() => Promise.resolve(true)),
    openEdit: vi.fn(() => Promise.resolve(true)),
    confirmDelete: vi.fn(() => Promise.resolve(true)),
    changeStatus: vi.fn(() => Promise.resolve()),
    move: vi.fn(() => Promise.resolve()),
  };
}

/** HttpClient backed by `HttpTestingController`, deterministic clock and fast retry config. */
export function provideTestEnvironment(
  interceptors: HttpInterceptorFn[] = [],
): (Provider | EnvironmentProviders)[] {
  document.cookie = `${LANGUAGE_STORAGE_KEY}=en; Path=/`;
  return [
    ...provideI18n(),
    provideHttpClient(withInterceptors(interceptors)),
    provideHttpClientTesting(),
    { provide: MATERIAL_ANIMATIONS, useValue: { animationsDisabled: true } },
    { provide: APP_CONFIG, useValue: TEST_CONFIG },
    { provide: NOW, useValue: () => new Date(TODAY) },
  ];
}
