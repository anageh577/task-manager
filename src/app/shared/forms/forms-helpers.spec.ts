import { FormControl, FormGroup } from '@angular/forms';
import type { FormGroupDirective } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { TODAY, provideTestEnvironment } from '../../testing/fixtures';
import { RelativeTimePipe } from '../pipes/relative-time.pipe';
import { CrossFieldErrorStateMatcher } from './cross-field-error-state-matcher';
import { ValidationMessagePipe } from './validation-message.pipe';

describe('ValidationMessagePipe', () => {
  const pipe = () => TestBed.runInInjectionContext(() => new ValidationMessagePipe());

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: provideTestEnvironment() });
  });

  it('returns an empty string when there are no errors', () => {
    expect(pipe().transform(null)).toBe('');
    expect(pipe().transform(undefined, 'form.title')).toBe('');
  });

  it('formats known errors using the label and error details', () => {
    expect(pipe().transform({ required: true }, 'form.title')).toBe('Title is required.');
    expect(pipe().transform({ blank: true }, 'form.title')).toBe('Title cannot be blank.');
    expect(pipe().transform({ minlength: { requiredLength: 3 } }, 'form.title')).toBe(
      'Title must be at least 3 characters.',
    );
    expect(pipe().transform({ maxlength: { requiredLength: 80 } }, 'form.title')).toBe(
      'Title must be at most 80 characters.',
    );
    expect(pipe().transform({ maxItems: { max: 5 } })).toBe('You can add up to 5 tags.');
    expect(pipe().transform({ uniqueItems: true })).toBe('Tags must be unique.');
    expect(pipe().transform({ dueDateInPast: true })).toBe('Due date cannot be in the past.');
    expect(pipe().transform({ matDatepickerParse: {} })).toContain('valid date');
    expect(pipe().transform({ pattern: {} }, 'form.tags')).toBe(
      'Tags contains invalid characters.',
    );
  });

  it('falls back to a generic message for unknown errors', () => {
    expect(pipe().transform({ custom: true })).toBe('This field is invalid.');
  });
});

describe('CrossFieldErrorStateMatcher', () => {
  const matcher = new CrossFieldErrorStateMatcher('dueDateInPast');
  const setup = () => {
    const control = new FormControl<string | null>('x');
    const group = new FormGroup({ dueDate: control });
    return { control, group };
  };

  it('is false for missing or pristine controls', () => {
    expect(matcher.isErrorState(null, null)).toBe(false);
    const { control, group } = setup();
    group.setErrors({ dueDateInPast: true });
    expect(matcher.isErrorState(control, null)).toBe(false);
  });

  it('reflects group-level errors once the control was touched or the form submitted', () => {
    const { control, group } = setup();
    group.setErrors({ dueDateInPast: true });
    expect(matcher.isErrorState(control, { submitted: true } as FormGroupDirective)).toBe(true);

    control.markAsTouched();
    expect(matcher.isErrorState(control, null)).toBe(true);

    group.setErrors(null);
    expect(matcher.isErrorState(control, null)).toBe(false);
  });

  it('reflects the control own errors', () => {
    const { control } = setup();
    control.setErrors({ required: true });
    control.markAsDirty();
    expect(matcher.isErrorState(control, null)).toBe(true);
  });
});

describe('RelativeTimePipe', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: provideTestEnvironment() });
  });

  it('translates the relative timestamp', () => {
    const pipe = TestBed.runInInjectionContext(() => new RelativeTimePipe());
    expect(pipe.transform(new Date(TODAY.getTime() - 120_000).toISOString(), TODAY)).toBe('2m ago');
    expect(pipe.transform(new Date().toISOString())).toBe('just now');
  });
});
