import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { makeActivity, provideTestEnvironment, TODAY } from '../../../testing/fixtures';
import { ActivityFeedComponent } from './activity-feed.component';

describe('ActivityFeedComponent', () => {
  let fixture: ComponentFixture<ActivityFeedComponent>;
  let element: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: provideTestEnvironment() });
    fixture = TestBed.createComponent(ActivityFeedComponent);
    fixture.componentRef.setInput('now', TODAY);
    element = fixture.nativeElement;
  });

  it('shows skeletons while loading', async () => {
    fixture.componentRef.setInput('activities', []);
    fixture.componentRef.setInput('loading', true);
    await fixture.whenStable();

    expect(element.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(element.querySelectorAll('app-skeleton')).toHaveLength(4);
  });

  it('renders activity entries with verb, detail and relative time', async () => {
    fixture.componentRef.setInput('activities', [
      makeActivity({
        id: 'a1',
        type: 'status_changed',
        taskTitle: 'Ship',
        detail: 'To Do → Done',
        timestamp: new Date(TODAY.getTime() - 5 * 60_000).toISOString(),
      }),
      makeActivity({ id: 'a2', type: 'deleted', taskTitle: 'Old' }),
    ]);
    await fixture.whenStable();

    const items = [...element.querySelectorAll('li')];
    expect(items).toHaveLength(2);
    expect(items[0].textContent).toContain('John Doe moved');
    expect(items[0].textContent).toContain('“Ship”');
    expect(items[0].textContent).toContain('(To Do → Done)');
    expect(items[0].querySelector('time')?.textContent?.trim()).toBe('5m ago');
    expect(items[1].textContent).toContain('deleted');
    expect(items[1].querySelector('.detail')).toBeNull();
  });

  it('shows an empty state when there is no activity', async () => {
    fixture.componentRef.setInput('activities', []);
    await fixture.whenStable();
    expect(element.textContent).toContain('No recent activity');
  });
});
