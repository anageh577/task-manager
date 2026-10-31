import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { CHART_LOADER } from '../../shared/ui/chart/chart-loader';
import { ChartComponent } from '../../shared/ui/chart/chart.component';
import {
  failRequest,
  flushBackend,
  JOHN,
  makeActivity,
  makeTask,
  provideTestEnvironment,
  SARAH,
} from '../../testing/fixtures';
import AnalyticsPage from './analytics.page';

describe('AnalyticsPage', () => {
  let fixture: ComponentFixture<AnalyticsPage>;
  let element: HTMLElement;

  const tasks = [
    makeTask({ status: 'todo', priority: 'high', assignee: JOHN }),
    makeTask({ status: 'in_progress', priority: 'high', assignee: SARAH }),
    makeTask({ status: 'done', priority: 'low', assignee: SARAH }),
    makeTask({ status: 'done', priority: 'medium', assignee: JOHN }),
  ];

  const charts = () =>
    fixture.debugElement
      .queryAll(By.directive(ChartComponent))
      .map((de) => de.componentInstance as ChartComponent);

  beforeEach(() => {
    const chart = { data: { datasets: [] }, update: vi.fn(), destroy: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        provideTestEnvironment(),
        { provide: CHART_LOADER, useValue: () => Promise.resolve(() => chart) },
      ],
    });
    fixture = TestBed.createComponent(AnalyticsPage);
    element = fixture.nativeElement;
  });

  it('shows skeletons until tasks load', () => {
    fixture.detectChanges();
    expect(element.querySelectorAll('app-skeleton').length).toBeGreaterThanOrEqual(3);
    expect(charts()).toHaveLength(0);
  });

  it('derives chart data and completion rate from tasks', async () => {
    await flushBackend({ tasks, users: [SARAH, JOHN], activities: [makeActivity()] });
    await fixture.whenStable();

    const [status, priority, workload] = charts();
    expect(status.values()).toEqual([1, 1, 2]);
    expect(priority.labels()).toEqual(['High', 'Medium', 'Low']);
    expect(priority.values()).toEqual([2, 1, 1]);
    expect(workload.labels()).toEqual(['John Doe', 'Sarah Smith']);
    expect(workload.values()).toEqual([1, 1]);
    expect(element.textContent).toContain('50% completed overall');
    expect(element.querySelectorAll('app-activity-feed li')).toHaveLength(1);
  });

  it('reports 0% completion with no tasks', async () => {
    await flushBackend();
    await fixture.whenStable();
    expect(element.textContent).toContain('0% completed overall');
  });

  it('shows retryable errors for tasks and activity', async () => {
    failRequest('/api/tasks');
    failRequest('/api/activities');
    await flushBackend();
    await fixture.whenStable();

    expect(element.textContent).toContain('Analytics could not be loaded');
    expect(element.textContent).toContain('Activity could not be loaded');

    element
      .querySelectorAll<HTMLButtonElement>('app-error-state button')
      .forEach((button) => button.click());
    await flushBackend({ tasks, activities: [makeActivity()] });
    await fixture.whenStable();

    expect(element.querySelector('app-error-state')).toBeNull();
  });
});
