import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { TaskStore } from '../../core/state/task.store';
import {
  failRequest,
  flushBackend,
  JOHN,
  makeTask,
  provideTestEnvironment,
  SARAH,
} from '../../testing/fixtures';
import TeamPage from './team.page';

describe('TeamPage', () => {
  let fixture: ComponentFixture<TeamPage>;
  let element: HTMLElement;

  const tasks = [
    makeTask({ assignee: JOHN, status: 'todo', dueDate: '2026-10-01' }),
    makeTask({ assignee: JOHN, status: 'done' }),
    makeTask({ assignee: JOHN, status: 'in_progress' }),
    makeTask({ assignee: JOHN, status: 'done' }),
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideTestEnvironment(), provideRouter([])],
    });
    fixture = TestBed.createComponent(TeamPage);
    element = fixture.nativeElement;
  });

  it('shows skeletons while members load', () => {
    fixture.detectChanges();
    expect(element.querySelector('[aria-busy="true"]')).not.toBeNull();
  });

  it('summarises the workload of each member', async () => {
    await flushBackend({ tasks, users: [SARAH, JOHN] });
    await fixture.whenStable();

    const cards = [...element.querySelectorAll('.member')];
    expect(element.textContent).toContain('2 members');
    expect(cards.map((c) => c.querySelector('h2')?.textContent)).toEqual([
      'John Doe',
      'Sarah Smith',
    ]);
    const johnCounts = [...cards[0].querySelectorAll('dd')].map((dd) => dd.textContent);
    expect(johnCounts).toEqual(['1', '1', '2', '1']);
    expect(cards[0].textContent).toContain('50% complete');
    expect(cards[0].querySelector('.alert')).not.toBeNull();
    expect(cards[1].textContent).toContain('0% complete');
  });

  it('opens the task list filtered by the selected member', async () => {
    await flushBackend({ tasks, users: [JOHN] });
    await fixture.whenStable();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const store = TestBed.inject(TaskStore);
    store.updateFilters({ search: 'old', priority: 'high' });

    element.querySelector<HTMLButtonElement>('.member button')!.click();

    expect(store.filters()).toEqual({
      search: '',
      status: 'all',
      priority: 'all',
      assigneeId: JOHN.id,
    });
    expect(navigate).toHaveBeenCalledWith(['/tasks'], {
      queryParams: { userId: JOHN.id },
    });
  });

  it('shows an empty state when there is nobody to show', async () => {
    await flushBackend();
    await fixture.whenStable();
    expect(element.textContent).toContain('No team members yet');
  });

  it('shows a retryable error when users and tasks are unavailable', async () => {
    failRequest('/api/users');
    failRequest('/api/tasks');
    await flushBackend();
    await fixture.whenStable();

    expect(element.textContent).toContain('Team could not be loaded');
    element.querySelector<HTMLButtonElement>('app-error-state button')!.click();
    await flushBackend({ users: [JOHN] });
    await fixture.whenStable();
    expect(element.querySelectorAll('.member')).toHaveLength(1);
  });
});
