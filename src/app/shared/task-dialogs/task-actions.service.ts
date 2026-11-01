import { EnvironmentInjector, inject, Injectable } from '@angular/core';
import type { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { errorMessage } from '@core/http/api-error';
import { LanguageService } from '@core/i18n/language.service';
import { translationKeyForMessage } from '@core/i18n/localize-message';
import type { Task, TaskStatus } from '@core/models';
import { NotificationService } from '@core/services/notification.service';
import { TaskStore } from '@core/state/task.store';
import type { ConfirmDialogData } from './confirm-dialog/confirm-dialog.component';
import type { TaskFormDialogData } from './task-form-dialog/task-form-dialog.component';

const FORM_DIALOG_CONFIG = {
  width: '600px',
  maxWidth: '96vw',
  autoFocus: 'first-tabbable',
  restoreFocus: true,
} as const;

/**
 * UI-level facade for task actions (create/edit/delete/move) shared by the shell,
 * dashboard and task list. It wires dialogs to the {@link TaskStore} and turns store
 * errors into notifications. `MatDialog` and the dialog components are lazy-loaded on
 * first use so they stay out of the initial bundle.
 */
@Injectable({ providedIn: 'root' })
export class TaskActionsService {
  private readonly injector = inject(EnvironmentInjector);
  private readonly store = inject(TaskStore);
  private readonly notify = inject(NotificationService);
  private readonly language = inject(LanguageService);

  private async dialog(): Promise<MatDialog> {
    const { MatDialog } = await import('@angular/material/dialog');
    return this.injector.get(MatDialog);
  }

  async openCreate(initialStatus: TaskStatus = 'todo'): Promise<boolean> {
    const [dialog, { TaskFormDialogComponent }] = await Promise.all([
      this.dialog(),
      import('./task-form-dialog/task-form-dialog.component'),
    ]);
    const data: TaskFormDialogData = {
      initialStatus,
      save: async (draft) => {
        const task = await this.store.create(draft);
        this.notify.success(this.language.text('notify.created', { title: task.title }));
      },
    };
    const ref = dialog.open<unknown, TaskFormDialogData, boolean>(TaskFormDialogComponent, {
      ...FORM_DIALOG_CONFIG,
      data,
    });
    return (await firstValueFrom(ref.afterClosed())) === true;
  }

  async openEdit(task: Task): Promise<boolean> {
    const [dialog, { TaskFormDialogComponent }] = await Promise.all([
      this.dialog(),
      import('./task-form-dialog/task-form-dialog.component'),
    ]);
    const data: TaskFormDialogData = {
      task,
      save: async (draft) => {
        await this.store.update(task.id, draft);
        this.notify.success(this.language.text('notify.updated', { title: draft.title }));
      },
    };
    const ref = dialog.open<unknown, TaskFormDialogData, boolean>(TaskFormDialogComponent, {
      ...FORM_DIALOG_CONFIG,
      data,
    });
    return (await firstValueFrom(ref.afterClosed())) === true;
  }

  async confirmDelete(task: Task): Promise<boolean> {
    const [dialog, { ConfirmDialogComponent }] = await Promise.all([
      this.dialog(),
      import('./confirm-dialog/confirm-dialog.component'),
    ]);
    const ref = dialog.open<unknown, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
      width: '420px',
      maxWidth: '96vw',
      data: {
        title: this.language.text('dialog.deleteTitle'),
        message: this.language.text('dialog.deleteMessage', { title: task.title }),
        confirmLabel: this.language.text('action.delete'),
        destructive: true,
      },
    });
    if (!(await firstValueFrom(ref.afterClosed()))) return false;

    try {
      await this.store.remove(task.id);
      this.notify.success(this.language.text('notify.deleted', { title: task.title }));
      return true;
    } catch (error) {
      this.notify.error(this.language.text('notify.deleteFailed', { detail: this.detail(error) }));
      return false;
    }
  }

  /** Moves a task to the end of another column (keyboard/menu alternative to drag & drop). */
  async changeStatus(task: Task, status: TaskStatus): Promise<void> {
    await this.move(task, status, this.store.columns()[status].length);
  }

  async move(task: Task, status: TaskStatus, index: number): Promise<void> {
    try {
      await this.store.move(task.id, status, index);
      if (task.status !== status) {
        this.notify.success(
          this.language.text('notify.moved', {
            title: task.title,
            status: this.language.text(`status.${status}`),
          }),
        );
      }
    } catch (error) {
      this.notify.error(this.language.text('notify.moveFailed', { detail: this.detail(error) }));
    }
  }

  private detail(error: unknown): string {
    const message = errorMessage(error);
    const key = translationKeyForMessage(message);
    return key ? this.language.text(key) : message;
  }
}
