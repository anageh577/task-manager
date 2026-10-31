import { HttpResponse } from '@angular/common/http';
import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { HttpCacheService } from '../../core/http/http-cache.service';
import { NotificationService } from '../../core/services/notification.service';
import { flushBackend, provideTestEnvironment } from '../../testing/fixtures';
import SettingsPage from './settings.page';

describe('SettingsPage', () => {
  it('shows the profile and refreshes every store on demand', async () => {
    const notify = { success: vi.fn(), error: vi.fn() };
    TestBed.configureTestingModule({
      providers: [provideTestEnvironment(), { provide: NotificationService, useValue: notify }],
    });
    const fixture = TestBed.createComponent(SettingsPage);
    const element: HTMLElement = fixture.nativeElement;
    await flushBackend();
    await fixture.whenStable();

    expect(element.textContent).toContain('John Doe');
    expect(element.textContent).toContain('john.doe@company.com');

    const cache = TestBed.inject(HttpCacheService);
    cache.set('/api/tasks', new HttpResponse({ body: [] }), 1000);

    element.querySelector<HTMLButtonElement>('button')!.click();
    TestBed.tick();

    expect(cache.size).toBe(0);
    expect(notify.success).toHaveBeenCalledWith('Data refreshed');
    const urls = TestBed.inject(HttpTestingController)
      .match(() => true)
      .map((req) => {
        req.flush([]);
        return req.request.url;
      });
    expect(urls.sort()).toEqual(['/api/activities', '/api/statistics', '/api/tasks', '/api/users']);
  });
});
