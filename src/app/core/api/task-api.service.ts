import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { APP_CONFIG } from '../config/app-config';
import type { Activity, Task } from '../models';

/**
 * Write-side API. Reads are modelled with `httpResource` inside the stores; mutations
 * are imperative, so they use `HttpClient` directly.
 */
@Injectable({ providedIn: 'root' })
export class TaskApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(APP_CONFIG).apiUrl;

  create(task: Task): Observable<Task> {
    return this.http.post<Task>(`${this.baseUrl}/tasks`, task);
  }

  update(id: string, changes: Partial<Task>): Observable<Task> {
    return this.http.patch<Task>(`${this.baseUrl}/tasks/${encodeURIComponent(id)}`, changes);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/tasks/${encodeURIComponent(id)}`);
  }

  logActivity(activity: Activity): Observable<Activity> {
    return this.http.post<Activity>(`${this.baseUrl}/activities`, activity);
  }
}
