import type { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { FormArray } from '@angular/forms';
import { calendarDaysBetween, toIsoDate } from '@core/utils/date.utils';

/** Rejects values made only of whitespace (`Validators.required` accepts `"   "`). */
export const notBlankValidator: ValidatorFn = (control) => {
  const value = control.value;
  return typeof value === 'string' && value.length > 0 && value.trim().length === 0
    ? { blank: true }
    : null;
};

/** Limits the number of entries of a `FormArray`. */
export function maxItemsValidator(max: number): ValidatorFn {
  return (control) =>
    control instanceof FormArray && control.length > max
      ? { maxItems: { max, actual: control.length } }
      : null;
}

/** Requires the string entries of a `FormArray` to be unique (case-insensitive). */
export const uniqueItemsValidator: ValidatorFn = (control) => {
  if (!(control instanceof FormArray)) return null;
  const values = (control.value as unknown[])
    .filter((v): v is string => typeof v === 'string')
    .map((v) => v.trim().toLowerCase());
  return new Set(values).size !== values.length ? { uniqueItems: true } : null;
};

export interface DueDateValidatorOptions {
  /** Reference "today" (injected for deterministic tests). */
  today: () => Date;
  /** A previously saved due date that stays valid even if it is now in the past. */
  allowedDate?: string;
  dueDateKey?: string;
  statusKey?: string;
}

/**
 * Cross-field (group) validator: the due date may not be in the past unless the task is
 * already done, or the date is unchanged from the saved task (so existing overdue tasks
 * can still be edited). Sets `dueDateInPast` on the group.
 */
export function dueDateValidator(options: DueDateValidatorOptions): ValidatorFn {
  const { today, allowedDate, dueDateKey = 'dueDate', statusKey = 'status' } = options;
  return (group: AbstractControl): ValidationErrors | null => {
    const dueDate = group.get(dueDateKey)?.value as Date | null | undefined;
    const status = group.get(statusKey)?.value as string | undefined;
    if (!(dueDate instanceof Date) || Number.isNaN(dueDate.getTime()) || status === 'done') {
      return null;
    }
    if (allowedDate && toIsoDate(dueDate) === allowedDate) return null;
    return calendarDaysBetween(today(), dueDate) < 0 ? { dueDateInPast: true } : null;
  };
}
