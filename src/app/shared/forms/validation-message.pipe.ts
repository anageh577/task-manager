import type { PipeTransform } from '@angular/core';
import { Pipe } from '@angular/core';
import type { ValidationErrors } from '@angular/forms';

type MessageFactory = (label: string, error: Record<string, unknown>) => string;

const MESSAGES: Record<string, MessageFactory> = {
  required: (label) => `${label} is required.`,
  blank: (label) => `${label} cannot be blank.`,
  minlength: (label, e) => `${label} must be at least ${e['requiredLength']} characters.`,
  maxlength: (label, e) => `${label} must be at most ${e['requiredLength']} characters.`,
  pattern: (label) => `${label} contains invalid characters.`,
  maxItems: (_label, e) => `You can add up to ${e['max']} tags.`,
  uniqueItems: () => 'Tags must be unique.',
  dueDateInPast: () => 'Due date cannot be in the past.',
  matDatepickerParse: () => 'Enter a valid date (e.g. 10/31/2026).',
};

/**
 * Maps the first validation error of a control to a user-facing message.
 * Pure: it re-runs only when the `errors` object reference changes (i.e. after validation).
 */
@Pipe({ name: 'validationMessage' })
export class ValidationMessagePipe implements PipeTransform {
  transform(errors: ValidationErrors | null | undefined, label = 'This field'): string {
    if (!errors) return '';
    const [key, value] = Object.entries(errors)[0];
    const factory = MESSAGES[key];
    const details =
      typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
    return factory ? factory(label, details) : `${label} is invalid.`;
  }
}
