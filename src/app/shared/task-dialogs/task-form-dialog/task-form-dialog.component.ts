import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import type { MatChipInputEvent } from '@angular/material/chips';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerIntl, MatDatepickerModule } from '@angular/material/datepicker';
import {
  MatDialog,
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { DateAdapter, provideNativeDateAdapter } from '@angular/material/core';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS, MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { filter, firstValueFrom, merge } from 'rxjs';
import { NOW } from '@core/config/app-config';
import { errorMessage } from '@core/http/api-error';
import { AppDatepickerIntl } from '@core/i18n/datepicker-intl';
import { LanguageService } from '@core/i18n/language.service';
import type { Task, TaskDraft, TaskPriority, TaskStatus } from '@core/models';
import { TASK_PRIORITIES, TASK_STATUSES } from '@core/models';
import { UserStore } from '@core/state/user.store';
import { parseIsoDate, toIsoDate } from '@core/utils/date.utils';
import { CrossFieldErrorStateMatcher } from '@shared/forms/cross-field-error-state-matcher';
import { ValidationMessagePipe } from '@shared/forms/validation-message.pipe';
import {
  dueDateValidator,
  maxItemsValidator,
  notBlankValidator,
  uniqueItemsValidator,
} from '@shared/forms/validators';
import type { ConfirmDialogData } from '../confirm-dialog/confirm-dialog.component';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { LocalizeMessagePipe } from '@core/i18n/localize-message.pipe';
import { TranslatePipe } from '@ngx-translate/core';

export const MAX_TAGS = 5;
export const MAX_TAG_LENGTH = 20;

export interface TaskFormDialogData {
  /** Present when editing; absent when creating. */
  task?: Task;
  /** Pre-selected status for new tasks (e.g. when created from a board column). */
  initialStatus?: TaskStatus;
  /** Persists the draft. The dialog stays open and shows the error if this rejects. */
  save: (draft: TaskDraft) => Promise<void>;
}

/**
 * Create/edit task dialog built with a strongly typed reactive form.
 *
 * - Custom validators: `notBlank`, `maxItems`, `uniqueItems` and the cross-field `dueDate` rule.
 * - Dynamic controls: tags are a `FormArray` that grows/shrinks via the chip input.
 * - Form state: submit is blocked while saving, server errors are shown inline, and
 *   closing a dirty form asks for confirmation.
 */
@Component({
  selector: 'app-task-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatChipsModule,
    MatDatepickerModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    ValidationMessagePipe,
    TranslatePipe,
    LocalizeMessagePipe,
  ],
  templateUrl: './task-form-dialog.component.html',
  styleUrl: './task-form-dialog.component.scss',
  // Provided here rather than app-wide so form-field/date-adapter code stays in this lazy chunk.
  providers: [
    provideNativeDateAdapter(),
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { appearance: 'outline', subscriptSizing: 'dynamic' },
    },
    { provide: MatDatepickerIntl, useClass: AppDatepickerIntl },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskFormDialogComponent {
  protected readonly data = inject<TaskFormDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject<MatDialogRef<TaskFormDialogComponent, boolean>>(MatDialogRef);
  private readonly dialog = inject(MatDialog);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly now = inject(NOW);
  private readonly language = inject(LanguageService);
  private readonly dateAdapter = inject(DateAdapter);
  protected readonly users = inject(UserStore).users;

  protected readonly isEdit = !!this.data.task;
  protected readonly saving = signal(false);
  protected readonly submitError = signal<string | null>(null);
  protected readonly separatorKeys = [ENTER, COMMA] as const;
  protected readonly dueDateMatcher = new CrossFieldErrorStateMatcher('dueDateInPast');
  protected readonly statusOptions = TASK_STATUSES;
  protected readonly priorityOptions = TASK_PRIORITIES;
  protected readonly maxTags = MAX_TAGS;

  readonly form = this.buildForm(this.data.task);

  constructor() {
    effect(() => this.dateAdapter.setLocale(this.language.dateLocale()));
    // Backdrop clicks and Escape go through the dirty-check instead of closing immediately.
    this.dialogRef.disableClose = true;
    merge(
      this.dialogRef.backdropClick(),
      this.dialogRef.keydownEvents().pipe(filter((event) => event.key === 'Escape')),
    )
      .pipe(takeUntilDestroyed())
      .subscribe(() => void this.requestClose());
  }

  get tags() {
    return this.form.controls.tags;
  }

  addTag(event: MatChipInputEvent): void {
    const value = event.value.trim();
    if (value) {
      this.tags.push(this.createTagControl(value));
      this.tags.markAsDirty();
      this.tags.markAsTouched();
    }
    event.chipInput.clear();
  }

  removeTag(index: number): void {
    this.tags.removeAt(index);
    this.tags.markAsDirty();
  }

  async submit(): Promise<void> {
    if (this.saving()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.submitError.set(null);
    const draft = this.toDraft();
    this.form.disable({ emitEvent: false });
    try {
      await this.data.save(draft);
      this.form.markAsPristine();
      this.dialogRef.close(true);
    } catch (error) {
      this.submitError.set(errorMessage(error));
    } finally {
      this.form.enable({ emitEvent: false });
      this.saving.set(false);
    }
  }

  /** Closes the dialog, asking for confirmation first when there are unsaved changes. */
  async requestClose(): Promise<void> {
    if (this.saving()) return;
    if (!this.form.dirty) {
      this.dialogRef.close(false);
      return;
    }
    const discard = await firstValueFrom(
      this.dialog
        .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
          data: {
            title: this.language.text('dialog.discardTitle'),
            message: this.language.text('dialog.discardMessage'),
            confirmLabel: this.language.text('action.discard'),
            cancelLabel: this.language.text('action.keepEditing'),
            destructive: true,
          },
          width: '400px',
        })
        .afterClosed(),
    );
    if (discard) this.dialogRef.close(false);
  }

  private buildForm(task?: Task) {
    return this.fb.group(
      {
        title: [
          task?.title ?? '',
          [
            Validators.required,
            Validators.minLength(3),
            Validators.maxLength(100),
            notBlankValidator,
          ],
        ],
        description: [task?.description ?? '', [Validators.maxLength(500)]],
        status: [
          task?.status ?? this.data.initialStatus ?? ('todo' as TaskStatus),
          Validators.required,
        ],
        priority: [task?.priority ?? ('medium' as TaskPriority), Validators.required],
        dueDate: new FormControl<Date | null>(
          task ? parseIsoDate(task.dueDate) : null,
          Validators.required,
        ),
        assigneeId: [task?.assignee.id ?? '', Validators.required],
        tags: this.fb.array(
          (task?.tags ?? []).map((tag) => this.createTagControl(tag)),
          [maxItemsValidator(MAX_TAGS), uniqueItemsValidator],
        ),
      },
      { validators: dueDateValidator({ today: () => this.now(), allowedDate: task?.dueDate }) },
    );
  }

  private createTagControl(value: string): FormControl<string> {
    return this.fb.control(value, [Validators.required, Validators.maxLength(MAX_TAG_LENGTH)]);
  }

  private toDraft(): TaskDraft {
    const value = this.form.getRawValue();
    const assignee =
      this.users().find((user) => user.id === value.assigneeId) ?? this.data.task?.assignee;
    if (!assignee) throw new Error(`Unknown assignee "${value.assigneeId}"`);

    return {
      title: value.title.trim(),
      description: value.description.trim(),
      status: value.status,
      priority: value.priority,
      dueDate: toIsoDate(value.dueDate as Date),
      assignee,
      tags: value.tags.map((tag) => tag.trim()),
    };
  }
}
