import { inject, Pipe } from '@angular/core';
import type { PipeTransform } from '@angular/core';
import type { ValidationErrors } from '@angular/forms';
import { LanguageService } from '@core/i18n/language.service';

const MESSAGE_KEYS: Record<string, string> = {
  required: 'validation.required',
  blank: 'validation.blank',
  minlength: 'validation.minlength',
  maxlength: 'validation.maxlength',
  pattern: 'validation.pattern',
  maxItems: 'validation.maxItems',
  uniqueItems: 'validation.uniqueItems',
  dueDateInPast: 'validation.dueDateInPast',
  matDatepickerParse: 'validation.matDatepickerParse',
};

/**
 * Maps the first validation error of a control to a translated message.
 * `fieldKey` is a translation key for the field name (`form.title`).
 */
@Pipe({ name: 'validationMessage', pure: false })
export class ValidationMessagePipe implements PipeTransform {
  private readonly language = inject(LanguageService);

  transform(errors: ValidationErrors | null | undefined, fieldKey = 'form.field'): string {
    if (!errors) return '';
    const [key, value] = Object.entries(errors)[0];
    const details =
      typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
    return this.language.text(MESSAGE_KEYS[key] ?? 'validation.invalid', {
      label: this.language.text(fieldKey),
      requiredLength: details['requiredLength'],
      max: details['max'],
    });
  }
}
