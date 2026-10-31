import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { TaskStore } from '../../core/state/task.store';
import { TaskActionsService } from '../../shared/task-dialogs/task-actions.service';
import { TaskCardComponent } from '../../shared/ui/task-card/task-card.component';
import {
  failRequest,
  flushBackend,
  JOHN,
  makeTask,
  mockTaskActions,
  provideTestEnvironment,
  SARAH,
} from '../../testing/fixtures';
import DashboardPage from './dashboard.page';
import { TaskBoardComponent } from './task-board/task-board.component';

describe('DashboardPage', () => {
  let fixture: ComponentFixture<DashboardPage>;
  let element: HTMLElement;
  let actions: ReturnType<typeof mockTaskActions>;

  const overdue = makeTask({ title: 'Late', status: 'todo', dueDate: '2026-10-20' });
  const doing = makeTask({ title: 'Doing', status: 'in_progress', assignee: SARAH });
  const done = makeTask({ title: 'Finished', status: 'done', completedAt: '2026-10-27T09:00:00Z' });
  const tasks = [overdue, doing, done];

  const statValues = () =>
    [...element.querySelectorAll('app-stat-card')].map((card) => card.textContent);
  const cardTitles = () =>
    [...element.querySelectorAll('app-task-card h3')].map((h) => h.textContent?.trim());

  beforeEach(() => {
    actions = mockTaskActions();
    TestBed.configureTestingModule({
      providers: [provideTestEnvironment(), { provide: TaskActionsService, useValue: actions }],
    });
    fixture = TestBed.createComponent(DashboardPage);
    element = fixture.nativeElement;
  });

  it('shows statistics and the board once data has loaded', async () => {
    await flushBackend({ tasks, users: [JOHN, SARAH] });
    await fixture.whenStable();

    const stats = statValues();
    expect(stats[0]).toContain('Total Tasks');
    expect(stats[0]).toContain('3');
    expect(stats[3]).toContain('Overdue');
    expect(stats[3]).toContain('1');
    expect(cardTitles()).toEqual(['Late', 'Doing', 'Finished']);
  });

  it('filters the board and announces the number of results', async () => {
    await flushBackend({ tasks, users: [JOHN, SARAH] });
    const store = TestBed.inject(TaskStore);

    [...element.querySelectorAll<HTMLButtonElement>('.tab')]
      .find((b) => b.textContent?.includes('In Progress'))!
      .click();
    await fixture.whenStable();

    expect(store.filters().status).toBe('in_progress');
    expect(cardTitles()).toEqual(['Doing']);
    expect(element.querySelector('[aria-live="polite"]')?.textContent).toContain(
      '1 tasks match the filters',
    );

    element.querySelector<HTMLButtonElement>('.clear')!.click();
    await fixture.whenStable();
    expect(cardTitles()).toHaveLength(3);
  });

  it('shows an error state with retry when tasks cannot be loaded', async () => {
    failRequest('/api/tasks');
    await flushBackend();
    await fixture.whenStable();

    expect(element.textContent).toContain('Tasks could not be loaded');
    element.querySelector<HTMLButtonElement>('app-error-state button')!.click();
    await flushBackend({ tasks });
    await fixture.whenStable();

    expect(element.textContent).not.toContain('Tasks could not be loaded');
    expect(cardTitles()).toHaveLength(3);
  });

  it('delegates board interactions to TaskActionsService', async () => {
    await flushBackend({ tasks });
    const board = fixture.debugElement.query(By.directive(TaskBoardComponent))
      .componentInstance as TaskBoardComponent;
    const card = fixture.debugElement.query(By.directive(TaskCardComponent))
      .componentInstance as TaskCardComponent;

    board.moved.emit({ task: overdue, status: 'done', index: 0 });
    card.edit.emit(overdue);
    card.delete.emit(overdue);
    card.statusChange.emit({ task: overdue, status: 'in_progress' });
    board.addTask.emit('done');
    element.querySelector<HTMLButtonElement>('.new-task')!.click();

    expect(actions.move).toHaveBeenCalledWith(overdue, 'done', 0);
    expect(actions.openEdit).toHaveBeenCalledWith(overdue);
    expect(actions.confirmDelete).toHaveBeenCalledWith(overdue);
    expect(actions.changeStatus).toHaveBeenCalledWith(overdue, 'in_progress');
    expect(actions.openCreate).toHaveBeenCalledWith('done');
    expect(actions.openCreate).toHaveBeenCalledTimes(2);
  });
});
