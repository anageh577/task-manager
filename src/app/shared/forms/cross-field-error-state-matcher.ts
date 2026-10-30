import type { AbstractControl, FormGroupDirective, NgForm } from '@angular/forms';
import type { ErrorStateMatcher } from '@angular/material/core';

/**
 * Shows a field in error state when either the control itself or its parent group has
 * `errorKey` (used for group-level validators such as `dueDateInPast`).
 */
export class CrossFieldErrorStateMatcher implements ErrorStateMatcher {
  constructor(private readonly errorKey: string) {}

  isErrorState(control: AbstractControl | null, form: FormGroupDirective | NgForm | null): boolean {
    if (!control) return false;
    const interacted = control.touched || control.dirty || !!form?.submitted;
    return interacted && (control.invalid || !!control.parent?.hasError(this.errorKey));
  }
}
