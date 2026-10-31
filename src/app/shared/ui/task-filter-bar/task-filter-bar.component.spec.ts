import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { JOHN, provideTestEnvironment, SARAH } from '../../../testing/fixtures';
import type { TaskFilters } from '../../../core/models';
import { DEFAULT_TASK_FILTERS } from '../../../core/models';
import { TaskFilterBarComponent } from './task-filter-bar.component';

describe('TaskFilterBarComponent', () => {
  let fixture: ComponentFixture<TaskFilterBarComponent>;
  let element: HTMLElement;
  let changes: Partial<TaskFilters>[];

  const render = async (filters: TaskFilters, hasActiveFilters = false) => {
    fixture.componentRef.setInput('filters', filters);
    fixture.componentRef.setInput('hasActiveFilters', hasActiveFilters);
    await fixture.whenStable();
  };
  const buttons = (selector: string) => [...element.querySelectorAll<HTMLButtonElement>(selector)];
  const byText = (text: string) =>
    buttons('button').find((b) => b.textContent?.trim().startsWith(text))!;
  const menuItems = () => [...document.querySelectorAll<HTMLButtonElement>('.mat-mdc-menu-item')];

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: provideTestEnvironment() });
    fixture = TestBed.createComponent(TaskFilterBarComponent);
    fixture.componentRef.setInput('users', [JOHN, SARAH]);
    element = fixture.nativeElement;
    changes = [];
    fixture.componentInstance.filtersChange.subscribe((c) => changes.push(c));
  });

  it('renders status tabs with the active one pressed', async () => {
    await render({ ...DEFAULT_TASK_FILTERS, status: 'in_progress' });
    const tabs = buttons('.tab');

    expect(tabs.map((t) => t.textContent?.trim())).toEqual(['All', 'To Do', 'In Progress', 'Done']);
    expect(tabs.map((t) => t.getAttribute('aria-pressed'))).toEqual([
      'false',
      'false',
      'true',
      'false',
    ]);

    tabs[3].click();
    expect(changes).toEqual([{ status: 'done' }]);
  });

  it('reflects selected priority and assignee in the menu labels', async () => {
    await render({ ...DEFAULT_TASK_FILTERS, priority: 'high', assigneeId: SARAH.id }, true);
    expect(byText('Assignee').textContent).toContain('Assignee: Sarah');
    expect(byText('Priority').textContent).toContain('Priority: High');
  });

  it('emits assignee and priority changes from the menus', async () => {
    await render(DEFAULT_TASK_FILTERS);

    byText('Assignee').click();
    await fixture.whenStable();
    expect(menuItems().map((i) => i.textContent?.trim())).toEqual([
      'All assignees',
      'John Doe',
      'Sarah Smith',
    ]);
    expect(menuItems()[0].getAttribute('aria-checked')).toBe('true');
    menuItems()[2].click();

    byText('Priority').click();
    await fixture.whenStable();
    menuItems()
      .find((i) => i.textContent?.includes('Low'))!
      .click();

    byText('Priority').click();
    await fixture.whenStable();
    menuItems()[0].click();

    byText('Assignee').click();
    await fixture.whenStable();
    menuItems()[0].click();

    expect(changes).toEqual([
      { assigneeId: SARAH.id },
      { priority: 'low' },
      { priority: 'all' },
      { assigneeId: 'all' },
    ]);
  });

  it('shows "Clear filters" only when filters are active and emits reset/newTask', async () => {
    let resets = 0;
    let creates = 0;
    fixture.componentInstance.resetFilters.subscribe(() => resets++);
    fixture.componentInstance.newTask.subscribe(() => creates++);

    await render(DEFAULT_TASK_FILTERS);
    expect(element.querySelector('.clear')).toBeNull();

    await render({ ...DEFAULT_TASK_FILTERS, search: 'x' }, true);
    element.querySelector<HTMLButtonElement>('.clear')!.click();
    element.querySelector<HTMLButtonElement>('.new-task')!.click();

    expect(resets).toBe(1);
    expect(creates).toBe(1);
  });
});
