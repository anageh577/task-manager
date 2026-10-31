import { signal } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import type { MatChipInputEvent } from '@angular/material/chips';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { of, Subject } from 'rxjs';
import type { MockInstance } from 'vitest';
import { ApiError } from '../../../core/http/api-error';
import type { Task, TaskDraft } from '../../../core/models';
import { UserStore } from '../../../core/state/user.store';
import { JOHN, makeTask, provideTestEnvironment, SARAH } from '../../../testing/fixtures';
import type { TaskFormDialogData } from './task-form-dialog.component';
import { MAX_TAGS, TaskFormDialogComponent } from './task-form-dialog.component';

describe('TaskFormDialogComponent', () => {
  let fixture: ComponentFixture<TaskFormDialogComponent>;
  let component: TaskFormDialogComponent;
  let element: HTMLElement;
  let save: ReturnType<typeof vi.fn<(draft: TaskDraft) => Promise<void>>>;
  let dialogRef: {
    disableClose: boolean;
    close: ReturnType<typeof vi.fn>;
    backdropClick: () => Subject<MouseEvent>;
    keydownEvents: () => Subject<KeyboardEvent>;
  };
  let backdrop$: Subject<MouseEvent>;
  let keydown$: Subject<KeyboardEvent>;
  let confirmResult: boolean;
  let dialog: { open: MockInstance<MatDialog['open']> };

  const setup = async (data: Partial<TaskFormDialogData> = {}) => {
    save = vi.fn<(draft: TaskDraft) => Promise<void>>(() => Promise.resolve());
    backdrop$ = new Subject();
    keydown$ = new Subject();
    dialogRef = {
      disableClose: false,
      close: vi.fn(),
      backdropClick: () => backdrop$,
      keydownEvents: () => keydown$,
    };
    confirmResult = true;

    TestBed.configureTestingModule({
      providers: [
        provideTestEnvironment(),
        provideNativeDateAdapter(),
        { provide: MAT_DIALOG_DATA, useValue: { save, ...data } },
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: UserStore, useValue: { users: signal([JOHN, SARAH]) } },
      ],
    });
    fixture = TestBed.createComponent(TaskFormDialogComponent);
    // The component's own MatDialogModule import provides the MatDialog it injects.
    dialog = {
      open: vi
        .spyOn(fixture.debugElement.injector.get(MatDialog), 'open')
        .mockImplementation(
          () => ({ afterClosed: () => of(confirmResult) }) as unknown as MatDialogRef<unknown>,
        ),
    };
    component = fixture.componentInstance;
    element = fixture.nativeElement;
    await fixture.whenStable();
  };

  const fillValid = () =>
    component.form.patchValue({
      title: '  Prepare demo ',
      description: ' Slides ',
      dueDate: new Date(2026, 10, 15),
      assigneeId: SARAH.id,
    });

  const chipEvent = (value: string) =>
    ({ value, chipInput: { clear: vi.fn() } }) as unknown as MatChipInputEvent;

  describe('create mode', () => {
    beforeEach(() => setup({ initialStatus: 'in_progress' }));

    it('starts empty with the requested initial status', () => {
      expect(element.querySelector('h2')?.textContent).toContain('New task');
      expect(component.form.getRawValue()).toMatchObject({
        title: '',
        status: 'in_progress',
        priority: 'medium',
        dueDate: null,
        tags: [],
      });
      expect(dialogRef.disableClose).toBe(true);
    });

    it('shows validation errors instead of saving an invalid form', async () => {
      await component.submit();
      await fixture.whenStable();

      expect(save).not.toHaveBeenCalled();
      const errors = [...element.querySelectorAll('mat-error')].map((e) => e.textContent?.trim());
      expect(errors).toContain('Title is required.');
      expect(errors).toContain('Due date is required.');
      expect(errors).toContain('Assignee is required.');
    });

    it('validates blank titles and past due dates', async () => {
      component.form.patchValue({ title: '    ', dueDate: new Date(2026, 9, 1) });
      component.form.markAllAsTouched();
      await fixture.whenStable();

      expect(component.form.controls.title.hasError('blank')).toBe(true);
      expect(component.form.hasError('dueDateInPast')).toBe(true);
      const errors = [...element.querySelectorAll('mat-error')].map((e) => e.textContent?.trim());
      expect(errors).toContain('Due date cannot be in the past.');
    });

    it('manages tags as a dynamic FormArray with limits and uniqueness', async () => {
      const event = chipEvent(' API ');
      component.addTag(event);
      component.addTag(chipEvent('   '));
      expect(component.tags.value).toEqual(['API']);
      expect(event.chipInput.clear).toHaveBeenCalled();

      component.addTag(chipEvent('api'));
      expect(component.tags.hasError('uniqueItems')).toBe(true);
      await fixture.whenStable();
      expect(element.querySelector('.field-error')?.textContent).toContain('Tags must be unique.');

      component.removeTag(1);
      for (let i = 0; i < MAX_TAGS; i++) component.addTag(chipEvent(`tag-${i}`));
      expect(component.tags.hasError('maxItems')).toBe(true);
    });

    it('saves a trimmed draft and closes the dialog', async () => {
      fillValid();
      component.addTag(chipEvent('Demo'));
      await component.submit();

      expect(save).toHaveBeenCalledWith({
        title: 'Prepare demo',
        description: 'Slides',
        status: 'in_progress',
        priority: 'medium',
        dueDate: '2026-11-15',
        assignee: SARAH,
        tags: ['Demo'],
      } satisfies TaskDraft);
      expect(dialogRef.close).toHaveBeenCalledWith(true);
      expect(component.form.enabled).toBe(true);
    });

    it('keeps the dialog open and shows the server error when saving fails', async () => {
      save.mockRejectedValueOnce(new ApiError('Server is down', 503));
      fillValid();
      await component.submit();
      await fixture.whenStable();

      expect(dialogRef.close).not.toHaveBeenCalled();
      expect(element.querySelector('[role="alert"]')?.textContent).toContain('Server is down');
      expect(component.form.enabled).toBe(true);
    });

    it('ignores a second submit while saving', async () => {
      let resolve!: () => void;
      save.mockReturnValueOnce(new Promise<void>((r) => (resolve = r)));
      fillValid();

      const first = component.submit();
      expect(component.form.disabled).toBe(true);
      await component.submit();
      await component.requestClose();
      resolve();
      await first;

      expect(save).toHaveBeenCalledTimes(1);
      expect(dialogRef.close).toHaveBeenCalledTimes(1);
    });

    it('closes immediately when pristine', async () => {
      await component.requestClose();
      expect(dialog.open).not.toHaveBeenCalled();
      expect(dialogRef.close).toHaveBeenCalledWith(false);
    });

    it('asks before discarding unsaved changes (also on Escape/backdrop)', async () => {
      component.form.controls.title.setValue('Draft');
      component.form.markAsDirty();

      confirmResult = false;
      keydown$.next(new KeyboardEvent('keydown', { key: 'Escape' }));
      await Promise.resolve();
      expect(dialog.open).toHaveBeenCalledTimes(1);
      expect(dialogRef.close).not.toHaveBeenCalled();

      keydown$.next(new KeyboardEvent('keydown', { key: 'a' }));
      expect(dialog.open).toHaveBeenCalledTimes(1);

      confirmResult = true;
      backdrop$.next(new MouseEvent('click'));
      await vi.waitFor(() => expect(dialogRef.close).toHaveBeenCalledWith(false));
    });
  });

  describe('edit mode', () => {
    let task: Task;

    beforeEach(async () => {
      task = makeTask({
        title: 'Old title',
        status: 'todo',
        dueDate: '2026-10-01',
        assignee: JOHN,
        tags: ['Legacy'],
      });
      await setup({ task });
    });

    it('prefills the form and keeps the unchanged past due date valid', () => {
      expect(element.querySelector('h2')?.textContent).toContain('Edit task');
      expect(component.form.getRawValue()).toMatchObject({
        title: 'Old title',
        assigneeId: JOHN.id,
        tags: ['Legacy'],
      });
      expect(component.form.valid).toBe(true);
      const submitButton = element.querySelector<HTMLButtonElement>('button[type="submit"]');
      expect(submitButton?.disabled).toBe(true);
    });

    it('submits the edited values', async () => {
      component.form.patchValue({ title: 'New title', priority: 'high' });
      component.form.markAsDirty();
      await component.submit();

      expect(save).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'New title', priority: 'high', dueDate: '2026-10-01' }),
      );
    });

    it('falls back to the current assignee if the user list does not contain it', async () => {
      component.form.patchValue({ assigneeId: 'ghost' });
      await component.submit();
      expect(save).toHaveBeenCalledWith(expect.objectContaining({ assignee: JOHN }));
    });
  });
});
