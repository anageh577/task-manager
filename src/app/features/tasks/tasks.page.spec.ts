import type { BreakpointState } from '@angular/cdk/layout';
import { BreakpointObserver } from '@angular/cdk/layout';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { MatPaginator } from '@angular/material/paginator';
import { MatSelect } from '@angular/material/select';
import { By } from '@angular/platform-browser';
import { BehaviorSubject } from 'rxjs';
import { TaskStore } from '../../core/state/task.store';
import { TaskActionsService } from '../../shared/task-dialogs/task-actions.service';
import {
  failRequest,
  flushBackend,
  makeTask,
  mockTaskActions,
  provideTestEnvironment,
  SARAH,
} from '../../testing/fixtures';
import TasksPage, { sortTasks } from './tasks.page';

describe('sortTasks', () => {
  const a = makeTask({ title: 'beta', status: 'done', priority: 'low', dueDate: '2026-11-02' });
  const b = makeTask({ title: 'Alpha', status: 'todo', priority: 'high', dueDate: '2026-11-03' });
  const c = makeTask({
    title: 'Gamma',
    status: 'in_progress',
    priority: 'medium',
    dueDate: '2026-11-01',
    assignee: SARAH,
  });
  const ids = (tasks: { title: string }[]) => tasks.map((t) => t.title);

  it('sorts by each sortable column in both directions', () => {
    expect(ids(sortTasks([a, b, c], { active: 'title', direction: 'asc' }))).toEqual([
      'Alpha',
      'beta',
      'Gamma',
    ]);
    expect(ids(sortTasks([a, b, c], { active: 'status', direction: 'asc' }))).toEqual([
      'Alpha',
      'Gamma',
      'beta',
    ]);
    expect(ids(sortTasks([a, b, c], { active: 'priority', direction: 'desc' }))).toEqual([
      'beta',
      'Gamma',
      'Alpha',
    ]);
    expect(ids(sortTasks([a, b, c], { active: 'dueDate', direction: 'asc' }))).toEqual([
      'Gamma',
      'beta',
      'Alpha',
    ]);
    expect(ids(sortTasks([c, a, b], { active: 'assignee', direction: 'asc' }))).toEqual([
      'beta',
      'Alpha',
      'Gamma',
    ]);
  });

  it('keeps the original order when unsorted or sorting by an unknown column', () => {
    expect(sortTasks([a, b], { active: 'title', direction: '' })).toEqual([a, b]);
    expect(sortTasks([a, b], { active: 'nope', direction: 'asc' })).toEqual([a, b]);
  });
});

describe('TasksPage', () => {
  let fixture: ComponentFixture<TasksPage>;
  let element: HTMLElement;
  let actions: ReturnType<typeof mockTaskActions>;
  let compact: BehaviorSubject<BreakpointState>;

  const tasks = Array.from({ length: 12 }, (_, i) =>
    makeTask({
      title: `Task ${String(i + 1).padStart(2, '0')}`,
      dueDate: `2026-11-${String(i + 1).padStart(2, '0')}`,
      status: i === 0 ? 'done' : 'todo',
    }),
  );
  const rowTitles = () =>
    [...element.querySelectorAll('tr.mat-mdc-row .task-title')].map((t) => t.textContent);

  beforeEach(() => {
    actions = mockTaskActions();
    compact = new BehaviorSubject<BreakpointState>({ matches: false, breakpoints: {} });
    TestBed.configureTestingModule({
      providers: [
        provideTestEnvironment(),
        { provide: TaskActionsService, useValue: actions },
        { provide: BreakpointObserver, useValue: { observe: () => compact } },
      ],
    });
    fixture = TestBed.createComponent(TasksPage);
    element = fixture.nativeElement;
  });

  it('shows a skeleton until the tasks arrive', async () => {
    fixture.detectChanges();
    expect(element.querySelector('[aria-busy="true"]')).not.toBeNull();

    await flushBackend({ tasks });
    await fixture.whenStable();
    expect(element.querySelector('[aria-busy="true"]')).toBeNull();
    expect(element.textContent).toContain('12 of 12 tasks');
  });

  it('paginates the sorted rows', async () => {
    await flushBackend({ tasks });
    await fixture.whenStable();
    expect(rowTitles()).toHaveLength(10);
    expect(rowTitles()[0]).toBe('Task 01');

    const paginator = fixture.debugElement.query(By.directive(MatPaginator))
      .componentInstance as MatPaginator;
    paginator.nextPage();
    await fixture.whenStable();
    expect(rowTitles()).toEqual(['Task 11', 'Task 12']);
  });

  it('drops secondary columns on small screens', async () => {
    await flushBackend({ tasks });
    await fixture.whenStable();
    expect(element.querySelectorAll('th')).toHaveLength(6);

    compact.next({ matches: true, breakpoints: {} });
    await fixture.whenStable();
    expect(element.querySelectorAll('th')).toHaveLength(3);
  });

  it('sorts when a header is clicked', async () => {
    await flushBackend({ tasks });
    await fixture.whenStable();

    const dueHeader = [...element.querySelectorAll<HTMLElement>('th')].find((th) =>
      th.textContent?.includes('Due'),
    )!;
    dueHeader.querySelector<HTMLElement>('.mat-sort-header-container')!.click();
    await fixture.whenStable();

    expect(rowTitles()[0]).toBe('Task 12');
  });

  it('changes the status inline through the actions service', async () => {
    await flushBackend({ tasks });
    await fixture.whenStable();
    const select = fixture.debugElement.query(By.directive(MatSelect))
      .componentInstance as MatSelect;

    select.selectionChange.emit({ source: select, value: 'in_progress' });
    select.selectionChange.emit({ source: select, value: tasks[0].status });

    expect(actions.changeStatus).toHaveBeenCalledTimes(1);
    expect(actions.changeStatus).toHaveBeenCalledWith(tasks[0], 'in_progress');
  });

  it('opens edit and delete from the row menu', async () => {
    await flushBackend({ tasks });
    await fixture.whenStable();

    const openMenu = async () => {
      element.querySelector<HTMLButtonElement>('[aria-label="Actions for Task 01"]')!.click();
      await fixture.whenStable();
      return [...document.querySelectorAll<HTMLButtonElement>('.mat-mdc-menu-item')];
    };
    (await openMenu())[0].click();
    (await openMenu())[1].click();

    expect(actions.openEdit).toHaveBeenCalledWith(tasks[0]);
    expect(actions.confirmDelete).toHaveBeenCalledWith(tasks[0]);
  });

  it('shows an empty state that can clear filters', async () => {
    await flushBackend({ tasks });
    TestBed.inject(TaskStore).updateFilters({ search: 'does-not-exist' });
    await fixture.whenStable();

    expect(element.textContent).toContain('No tasks found');
    [...element.querySelectorAll<HTMLButtonElement>('app-empty-state button')][0].click();
    await fixture.whenStable();
    expect(rowTitles()).toHaveLength(10);
  });

  it('shows an error state when loading fails', async () => {
    failRequest('/api/tasks');
    await flushBackend();
    await fixture.whenStable();

    expect(element.textContent).toContain('Tasks could not be loaded');
    element.querySelector<HTMLButtonElement>('app-error-state button')!.click();
    await flushBackend({ tasks });
    await fixture.whenStable();
    expect(rowTitles()).toHaveLength(10);
  });
});
