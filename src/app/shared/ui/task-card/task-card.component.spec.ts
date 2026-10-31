import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { makeTask, provideTestEnvironment, TODAY } from '../../../testing/fixtures';
import type { Task } from '../../../core/models';
import type { TaskStatusChange } from './task-card.component';
import { TaskCardComponent } from './task-card.component';

describe('TaskCardComponent', () => {
  let fixture: ComponentFixture<TaskCardComponent>;
  let element: HTMLElement;

  const render = async (task: Task) => {
    fixture.componentRef.setInput('task', task);
    fixture.componentRef.setInput('today', TODAY);
    await fixture.whenStable();
  };

  const openMenu = async () => {
    element.querySelector<HTMLButtonElement>('.menu-trigger')!.click();
    await fixture.whenStable();
    return [...document.querySelectorAll<HTMLButtonElement>('.mat-mdc-menu-item')];
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: provideTestEnvironment() });
    fixture = TestBed.createComponent(TaskCardComponent);
    element = fixture.nativeElement;
  });

  it('renders the task details', async () => {
    await render(
      makeTask({
        id: 'x1',
        title: 'Write docs',
        description: 'All of them',
        priority: 'high',
        tags: ['Docs', 'DX'],
        dueDate: '2026-10-30',
      }),
    );

    expect(element.querySelector('h3')?.textContent).toContain('Write docs');
    expect(element.querySelector('h3')?.id).toBe('task-title-x1');
    expect(element.getAttribute('aria-labelledby')).toBe('task-title-x1');
    expect(element.querySelector('.description')?.textContent).toContain('All of them');
    expect(element.querySelector('.due')?.textContent).toContain('Due in 2 days');
    expect([...element.querySelectorAll('.tags li')].map((li) => li.textContent)).toEqual([
      'Docs',
      'DX',
    ]);
    expect(element.querySelector('.assignee')?.textContent).toContain('@John');
    expect(element.querySelector('[aria-label="Actions for Write docs"]')).not.toBeNull();
    expect(element.classList).not.toContain('overdue');
  });

  it('highlights overdue tasks and hides empty optional sections', async () => {
    await render(makeTask({ description: '', tags: [], dueDate: '2026-10-25' }));

    expect(element.classList).toContain('overdue');
    expect(element.querySelector('.due')?.textContent).toContain('Overdue by 3 days');
    expect(element.querySelector('.description')).toBeNull();
    expect(element.querySelector('.tags')).toBeNull();
  });

  it('emits edit, move and delete intents from the actions menu', async () => {
    const task = makeTask({ status: 'todo' });
    await render(task);
    const edits: Task[] = [];
    const deletes: Task[] = [];
    const moves: TaskStatusChange[] = [];
    fixture.componentInstance.edit.subscribe((t) => edits.push(t));
    fixture.componentInstance.delete.subscribe((t) => deletes.push(t));
    fixture.componentInstance.statusChange.subscribe((c) => moves.push(c));

    let items = await openMenu();
    expect(items.map((i) => i.textContent?.trim())).toEqual([
      '✏️ Edit',
      '➡️ Move to In Progress',
      '➡️ Move to Done',
      '🗑️ Delete',
    ]);
    items[0].click();
    items = await openMenu();
    items[2].click();
    items = await openMenu();
    items[3].click();

    expect(edits).toEqual([task]);
    expect(moves).toEqual([{ task, status: 'done' }]);
    expect(deletes).toEqual([task]);
  });
});
