import type { CdkDragDrop } from '@angular/cdk/drag-drop';
import { CdkDropList } from '@angular/cdk/drag-drop';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import type { Task, TaskStatus } from '../../../core/models';
import { makeTask, provideTestEnvironment, TODAY } from '../../../testing/fixtures';
import type { TaskMove } from './task-board.component';
import { TaskBoardComponent } from './task-board.component';

describe('TaskBoardComponent', () => {
  let fixture: ComponentFixture<TaskBoardComponent>;
  let element: HTMLElement;
  const todo = makeTask({ title: 'Todo A', status: 'todo' });
  const todo2 = makeTask({ title: 'Todo B', status: 'todo' });
  const progress = makeTask({ title: 'Doing', status: 'in_progress' });
  const columns: Record<TaskStatus, Task[]> = {
    todo: [todo, todo2],
    in_progress: [progress],
    done: [],
  };

  const headings = () => [...element.querySelectorAll('h2')].map((h) => h.textContent?.trim());
  const dropLists = () =>
    fixture.debugElement
      .queryAll(By.directive(CdkDropList))
      .map((de) => de.injector.get(CdkDropList<TaskStatus>));

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: provideTestEnvironment() });
    fixture = TestBed.createComponent(TaskBoardComponent);
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('today', TODAY);
    element = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('renders one column per status with counts and cards', () => {
    expect(headings()).toEqual(['To Do', 'In Progress', 'Done']);
    expect([...element.querySelectorAll('.count')].map((c) => c.textContent?.trim())).toEqual([
      '2',
      '1',
      '0',
    ]);
    expect(element.querySelectorAll('#drop-todo app-task-card')).toHaveLength(2);
    expect(element.querySelector('#drop-done')?.textContent).toContain('No tasks here');
  });

  it('shows skeleton cards while loading', async () => {
    fixture.componentRef.setInput('loading', true);
    await fixture.whenStable();

    expect(element.querySelectorAll('[aria-busy="true"]')).toHaveLength(3);
    expect(element.querySelectorAll('app-task-card')).toHaveLength(0);
    expect(element.querySelector('.count')?.textContent?.trim()).toBe('–');
  });

  it('shows a single column when filtered by status', async () => {
    fixture.componentRef.setInput('statusFilter', 'in_progress');
    await fixture.whenStable();
    expect(headings()).toEqual(['In Progress']);
    expect(element.querySelector('.board')?.classList).toContain('single');
  });

  it('emits a move when a card is dropped in another column or position', () => {
    const moves: TaskMove[] = [];
    fixture.componentInstance.moved.subscribe((m) => moves.push(m));
    const [todoList, progressList] = dropLists();

    const drop = (
      container: CdkDropList<TaskStatus>,
      previousContainer: CdkDropList<TaskStatus>,
      previousIndex: number,
      currentIndex: number,
    ) =>
      container.dropped.emit({
        container,
        previousContainer,
        previousIndex,
        currentIndex,
        item: { data: todo },
      } as unknown as CdkDragDrop<TaskStatus, TaskStatus, Task>);

    drop(progressList, todoList, 0, 1);
    drop(todoList, todoList, 0, 1);
    drop(todoList, todoList, 0, 0);

    expect(moves).toEqual([
      { task: todo, status: 'in_progress', index: 1 },
      { task: todo, status: 'todo', index: 1 },
    ]);
  });

  it('forwards add-task requests from empty columns', () => {
    const added: TaskStatus[] = [];
    fixture.componentInstance.addTask.subscribe((s) => added.push(s));
    element.querySelector<HTMLButtonElement>('#drop-done button')!.click();
    expect(added).toEqual(['done']);
  });
});
