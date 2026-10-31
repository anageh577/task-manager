import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { TODAY } from '../../testing/fixtures';
import {
  dueDateValidator,
  maxItemsValidator,
  notBlankValidator,
  uniqueItemsValidator,
} from './validators';

describe('custom validators', () => {
  it('notBlankValidator rejects whitespace-only strings', () => {
    expect(notBlankValidator(new FormControl('   '))).toEqual({ blank: true });
    expect(notBlankValidator(new FormControl(''))).toBeNull();
    expect(notBlankValidator(new FormControl(' a '))).toBeNull();
    expect(notBlankValidator(new FormControl(42))).toBeNull();
  });

  it('maxItemsValidator limits FormArray length', () => {
    const tags = (n: number) =>
      new FormArray(Array.from({ length: n }, () => new FormControl('x')));
    expect(maxItemsValidator(2)(tags(2))).toBeNull();
    expect(maxItemsValidator(2)(tags(3))).toEqual({ maxItems: { max: 2, actual: 3 } });
    expect(maxItemsValidator(2)(new FormControl([1, 2, 3]))).toBeNull();
  });

  it('uniqueItemsValidator detects case-insensitive duplicates', () => {
    const tags = (...values: string[]) => new FormArray(values.map((v) => new FormControl(v)));
    expect(uniqueItemsValidator(tags('Api', 'UI'))).toBeNull();
    expect(uniqueItemsValidator(tags('Api', ' api '))).toEqual({ uniqueItems: true });
    expect(uniqueItemsValidator(new FormControl('Api'))).toBeNull();
  });

  describe('dueDateValidator', () => {
    const group = (dueDate: Date | null, status = 'todo') =>
      new FormGroup({ dueDate: new FormControl(dueDate), status: new FormControl(status) });
    const validate = dueDateValidator({ today: () => TODAY, allowedDate: '2026-10-01' });

    it('rejects past dates for unfinished tasks', () => {
      expect(validate(group(new Date(2026, 9, 27)))).toEqual({ dueDateInPast: true });
      expect(validate(group(new Date(2026, 9, 28)))).toBeNull();
      expect(validate(group(new Date(2026, 10, 2)))).toBeNull();
    });

    it('allows past dates for done tasks or the unchanged saved date', () => {
      expect(validate(group(new Date(2026, 9, 20), 'done'))).toBeNull();
      expect(validate(group(new Date(2026, 9, 1)))).toBeNull();
    });

    it('ignores empty or invalid dates (handled by other validators)', () => {
      expect(validate(group(null))).toBeNull();
      expect(validate(group(new Date('invalid')))).toBeNull();
    });
  });
});
