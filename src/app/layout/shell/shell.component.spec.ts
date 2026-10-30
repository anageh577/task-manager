import type { BreakpointState } from '@angular/cdk/layout';
import { BreakpointObserver } from '@angular/cdk/layout';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { BehaviorSubject } from 'rxjs';
import { routes } from '../../app.routes';
import { TaskStore } from '../../core/state/task.store';
import { TaskActionsService } from '../../shared/task-dialogs/task-actions.service';
import { CHART_LOADER } from '../../shared/ui/chart/chart-loader';
import {
  flushBackend,
  makeTask,
  mockTaskActions,
  provideTestEnvironment,
} from '../../testing/fixtures';
import { NAV_ITEMS } from '../sidebar/sidebar.component';

describe('ShellComponent (with app routes)', () => {
  let harness: RouterTestingHarness;
  let actions: ReturnType<typeof mockTaskActions>;
  let handset: BehaviorSubject<BreakpointState>;

  const shell = () => harness.fixture.nativeElement as HTMLElement;
  const searchInput = () => shell().querySelector<HTMLInputElement>('#global-search')!;

  beforeEach(async () => {
    actions = mockTaskActions();
    handset = new BehaviorSubject<BreakpointState>({ matches: false, breakpoints: {} });
    const chart = { data: { datasets: [] }, update: vi.fn(), destroy: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        provideTestEnvironment(),
        provideRouter(routes),
        { provide: TaskActionsService, useValue: actions },
        { provide: BreakpointObserver, useValue: { observe: () => handset } },
        { provide: CHART_LOADER, useValue: () => Promise.resolve(() => chart) },
      ],
    });
    harness = await RouterTestingHarness.create();
  });

  it('redirects to the dashboard and renders the navigation', async () => {
    await harness.navigateByUrl('/');
    await flushBackend({ tasks: [makeTask({ dueDate: '2026-10-01' })] });
    await flushBackend();

    expect(TestBed.inject(Router).url).toBe('/dashboard');
    const links = [...shell().querySelectorAll('nav a')];
    expect(links).toHaveLength(NAV_ITEMS.length);
    expect(links[0].getAttribute('aria-current')).toBe('page');
    expect(shell().querySelector('.bell')?.getAttribute('aria-label')).toBe(
      'Notifications: 1 overdue tasks',
    );
    expect(shell().querySelector('.menu')).toBeNull();
  });

  it.each(['tasks', 'calendar', 'analytics', 'team', 'settings', 'does-not-exist'])(
    'lazily loads the "%s" route',
    async (path) => {
      await harness.navigateByUrl(`/${path}`);
      await flushBackend();
      await flushBackend();
      expect(shell().querySelector('main h1')).not.toBeNull();
    },
  );

  it('applies search globally and jumps to the dashboard from non-searchable pages', async () => {
    await harness.navigateByUrl('/team');
    await flushBackend();

    searchInput().value = 'login';
    searchInput().dispatchEvent(new Event('input'));
    await flushBackend();

    expect(TestBed.inject(TaskStore).filters().search).toBe('login');
    expect(TestBed.inject(Router).url).toBe('/dashboard');

    await harness.navigateByUrl('/tasks');
    searchInput().value = 'api';
    searchInput().dispatchEvent(new Event('input'));
    await flushBackend();
    expect(TestBed.inject(Router).url).toBe('/tasks');
  });

  it('opens the calendar from the notifications bell', async () => {
    await harness.navigateByUrl('/dashboard');
    shell().querySelector<HTMLButtonElement>('.bell')!.click();
    await flushBackend();
    expect(TestBed.inject(Router).url).toBe('/calendar');
  });

  it('opens the create dialog from the sidebar', async () => {
    await harness.navigateByUrl('/dashboard');
    shell().querySelector<HTMLButtonElement>('app-sidebar .new-task')!.click();
    expect(actions.openCreate).toHaveBeenCalled();
  });

  it('uses a toggleable overlay drawer on handsets', async () => {
    await harness.navigateByUrl('/dashboard');
    handset.next({ matches: true, breakpoints: {} });
    await flushBackend();

    const sidenav = shell().querySelector('mat-sidenav')!;
    expect(sidenav.classList).toContain('mat-drawer-over');
    expect(sidenav.classList).not.toContain('mat-drawer-opened');

    shell().querySelector<HTMLButtonElement>('.menu')!.click();
    await flushBackend();
    expect(sidenav.classList).toContain('mat-drawer-opened');

    shell().querySelector<HTMLAnchorElement>('nav a')!.click();
    await flushBackend();
    expect(sidenav.classList).not.toContain('mat-drawer-opened');
  });

  it('moves focus to the main content from the skip link', async () => {
    await harness.navigateByUrl('/dashboard');
    shell().querySelector<HTMLButtonElement>('.skip-link')!.click();
    expect(document.activeElement?.id).toBe('main-content');
  });
});
