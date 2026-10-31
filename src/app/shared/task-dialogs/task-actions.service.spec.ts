import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { ApiError } from '../../core/http/api-error';
import type { TaskDraft } from '../../core/models';
import { NotificationService } from '../../core/services/notification.service';
import { TaskStore } from '../../core/state/task.store';
import { makeTask, provideTestEnvironment } from '../../testing/fixtures';
import { ConfirmDialogComponent } from './confirm-dialog/confirm-dialog.component';
import { TaskActionsService } from './task-actions.service';
import type { TaskFormDialogData } from './task-form-dialog/task-form-dialog.component';
import { TaskFormDialogComponent } from './task-form-dialog/task-form-dialog.component';

describe('TaskActionsService', () => {
  let service: TaskActionsService;
  let dialogResult: unknown;
  const dialog = { open: vi.fn() };
  const notify = { success: vi.fn(), error: vi.fn() };
  const task = makeTask({ title: 'Ship it', status: 'todo' });
  const store = {
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    move: vi.fn(),
    columns: signal({ todo: [task], in_progress: [makeTask(), makeTask()], done: [] }),
  };
  const draft = { title: 'Draft' } as TaskDraft;

  const lastDialogData = () => dialog.open.mock.lastCall![1].data as TaskFormDialogData;

  beforeEach(() => {
    vi.clearAllMocks();
    dialogResult = true;
    dialog.open.mockImplementation(() => ({ afterClosed: () => of(dialogResult) }));
    TestBed.configureTestingModule({
      providers: [
        provideTestEnvironment(),
        { provide: MatDialog, useValue: dialog },
        { provide: NotificationService, useValue: notify },
        { provide: TaskStore, useValue: store },
      ],
    });
    service = TestBed.inject(TaskActionsService);
  });

  it('opens the lazy form dialog for creation and saves through the store', async () => {
    store.create.mockResolvedValue({ ...task, title: 'Created' });

    await expect(service.openCreate('done')).resolves.toBe(true);
    expect(dialog.open).toHaveBeenCalledWith(
      TaskFormDialogComponent,
      expect.objectContaining({ data: expect.objectContaining({ initialStatus: 'done' }) }),
    );

    await lastDialogData().save(draft);
    expect(store.create).toHaveBeenCalledWith(draft);
    expect(notify.success).toHaveBeenCalledWith('Task "Created" created');
  });

  it('reports a cancelled dialog as false', async () => {
    dialogResult = undefined;
    await expect(service.openCreate()).resolves.toBe(false);
  });

  it('opens the form dialog for editing and updates through the store', async () => {
    await expect(service.openEdit(task)).resolves.toBe(true);
    expect(lastDialogData().task).toBe(task);

    await lastDialogData().save(draft);
    expect(store.update).toHaveBeenCalledWith(task.id, draft);
    expect(notify.success).toHaveBeenCalledWith('Task "Draft" updated');
  });

  describe('confirmDelete', () => {
    it('does nothing when the user cancels', async () => {
      dialogResult = false;
      await expect(service.confirmDelete(task)).resolves.toBe(false);
      expect(dialog.open).toHaveBeenCalledWith(ConfirmDialogComponent, expect.anything());
      expect(store.remove).not.toHaveBeenCalled();
    });

    it('deletes after confirmation', async () => {
      store.remove.mockResolvedValue(undefined);
      await expect(service.confirmDelete(task)).resolves.toBe(true);
      expect(store.remove).toHaveBeenCalledWith(task.id);
      expect(notify.success).toHaveBeenCalledWith('Task "Ship it" deleted');
    });

    it('notifies when deletion fails', async () => {
      store.remove.mockRejectedValue(new ApiError('Server down.', 500));
      await expect(service.confirmDelete(task)).resolves.toBe(false);
      expect(notify.error).toHaveBeenCalledWith('Could not delete the task. Server down.');
    });
  });

  describe('move', () => {
    it('appends to the end of the target column when changing status', async () => {
      await service.changeStatus(task, 'in_progress');
      expect(store.move).toHaveBeenCalledWith(task.id, 'in_progress', 2);
      expect(notify.success).toHaveBeenCalledWith('"Ship it" moved to In Progress');
    });

    it('stays silent for reorders within the same column', async () => {
      await service.move(task, 'todo', 0);
      expect(notify.success).not.toHaveBeenCalled();
    });

    it('notifies when the move fails', async () => {
      store.move.mockRejectedValue(new ApiError('Conflict.', 409));
      await service.move(task, 'done', 0);
      expect(notify.error).toHaveBeenCalledWith('Could not move the task. Conflict.');
    });
  });
});
