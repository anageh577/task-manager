import { HttpResponse } from '@angular/common/http';
import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { HttpCacheService } from '../../core/http/http-cache.service';
import { NotificationService } from '../../core/services/notification.service';
import { StatisticsStore } from '../../core/state/statistics.store';
import { TaskStore } from '../../core/state/task.store';
import { UserStore } from '../../core/state/user.store';
import { flushBackend, provideTestEnvironment } from '../../testing/fixtures';
import SettingsPage from './settings.page';

describe('SettingsPage', () => {
  function setup(preloadStores = false) {
    const notify = { success: vi.fn(), error: vi.fn() };
    TestBed.configureTestingModule({
      providers: [provideTestEnvironment(), { provide: NotificationService, useValue: notify }],
    });
    if (preloadStores) {
      TestBed.inject(TaskStore);
      TestBed.inject(StatisticsStore);
      TestBed.inject(UserStore);
    }
    const fixture = TestBed.createComponent(SettingsPage);
    return { notify, fixture, element: fixture.nativeElement as HTMLElement };
  }

  it('shows the profile and refreshes without calling APIs the page does not use', async () => {
    const { notify, fixture, element } = setup();
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
    TestBed.inject(HttpTestingController).verify();
  });

  it('reloads stores that feature pages have already created', async () => {
    const { fixture, element } = setup(true);
    await flushBackend();
    await fixture.whenStable();

    element.querySelector<HTMLButtonElement>('button')!.click();
    TestBed.tick();

    const urls = TestBed.inject(HttpTestingController)
      .match(() => true)
      .map((req) => {
        req.flush([]);
        return req.request.url;
      });
    expect(urls.sort()).toEqual(['/api/activities', '/api/statistics', '/api/tasks', '/api/users']);
  });
});
