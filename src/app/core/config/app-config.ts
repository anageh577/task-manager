import { InjectionToken } from '@angular/core';
import type { Assignee } from '../models';
import { environment } from '@environments/environment.development';

export interface AppConfig {
  apiUrl: string;
}

/** Runtime configuration, injectable so tests can shorten TTLs/retry delays. */
export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG', {
  providedIn: 'root',
  factory: () => environment,
});

/** The signed-in user (mocked: there is no authentication in this assignment). */
export const CURRENT_USER = new InjectionToken<Assignee>('CURRENT_USER', {
  providedIn: 'root',
  factory: () => ({
    id: 'user-001',
    name: 'John Doe',
    avatar: 'JD',
    email: 'john.doe@company.com',
  }),
});

export const NOW = new InjectionToken<() => Date>('NOW', {
  providedIn: 'root',
  factory: () => () => new Date(),
});
