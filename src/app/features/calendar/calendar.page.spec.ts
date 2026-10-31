import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { By } from '@angular/platform-browser';
import { TaskActionsService } from '../../shared/task-dialogs/task-actions.service';
import { TaskCardComponent } from '../../shared/ui/task-card/task-card.component';
import {
  flushBackend,
  makeTask,
  mockTaskActions,
  provideTestEnvironment,
  TODAY,
} from '../../testing/fixtures';
import CalendarPage, { buildAgenda } from './calendar.page';

const late = makeTask({ title: 'Late', dueDate: '2026-10-20' });
const soon = makeTask({ title: 'Soon', dueDate: '2026-10-30' });
const sameDay = makeTask({ title: 'Same day', dueDate: '2026-10-30' });
const later = makeTask({ title: 'Later', dueDate: '2026-11-10' });
const finished = makeTask({ title: 'Finished', status: 'done', dueDate: '2026-10-29' });
const tasks = [later, soon, late, finished, sameDay];

describe('buildAgenda', () => {
  it('puts overdue tasks first and groups the rest by date', () => {
    const agenda = buildAgenda(tasks, TODAY, false);

    expect(agenda.map((g) => g.key)).toEqual(['overdue', '2026-10-30', '2026-11-10']);
    expect(agenda[0]).toMatchObject({ title: 'Overdue', date: null, tasks: [late] });
    expect(agenda[1].tasks).toEqual([soon, sameDay]);
    expect(agenda[1].date?.getDate()).toBe(30);
  });

  it('optionally includes completed tasks and omits the overdue group when empty', () => {
    const agenda = buildAgenda([finished, later], TODAY, true);
    expect(agenda.map((g) => g.key)).toEqual(['2026-10-29', '2026-11-10']);
  });
});

describe('CalendarPage', () => {
  let fixture: ComponentFixture<CalendarPage>;
  let element: HTMLElement;
  let actions: ReturnType<typeof mockTaskActions>;

  const groupTitles = () =>
    [...element.querySelectorAll('section h2')].map((h) =>
      h.textContent?.replace(/\s+/g, ' ').trim(),
    );

  beforeEach(() => {
    actions = mockTaskActions();
    TestBed.configureTestingModule({
      providers: [provideTestEnvironment(), { provide: TaskActionsService, useValue: actions }],
    });
    fixture = TestBed.createComponent(CalendarPage);
    element = fixture.nativeElement;
  });

  it('renders the agenda and toggles completed tasks', async () => {
    fixture.detectChanges();
    expect(element.querySelector('app-skeleton')).not.toBeNull();

    await flushBackend({ tasks });
    await fixture.whenStable();
    expect(groupTitles()).toEqual(['⚠️ Overdue 1', 'Friday, Oct 30 2', 'Tuesday, Nov 10 1']);

    const toggle = fixture.debugElement.query(By.directive(MatSlideToggle))
      .componentInstance as MatSlideToggle;
    toggle.change.emit({ source: toggle, checked: true });
    await fixture.whenStable();
    expect(groupTitles()).toContain('Thursday, Oct 29 1');
  });

  it('shows an empty state when nothing is scheduled', async () => {
    await flushBackend({ tasks: [finished] });
    await fixture.whenStable();
    expect(element.textContent).toContain('Nothing scheduled');
  });

  it('delegates card actions', async () => {
    await flushBackend({ tasks: [soon] });
    await fixture.whenStable();
    const card = fixture.debugElement.query(By.directive(TaskCardComponent))
      .componentInstance as TaskCardComponent;

    card.edit.emit(soon);
    card.delete.emit(soon);
    card.statusChange.emit({ task: soon, status: 'done' });

    expect(actions.openEdit).toHaveBeenCalledWith(soon);
    expect(actions.confirmDelete).toHaveBeenCalledWith(soon);
    expect(actions.changeStatus).toHaveBeenCalledWith(soon, 'done');
  });
});
