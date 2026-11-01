import { userMessageFor } from '../http/api-error';
import de from './translations/de.json';
import en from './translations/en.json';

function keys(value: unknown, prefix = ''): string[] {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    return Object.entries(value).flatMap(([key, child]) =>
      keys(child, prefix ? `${prefix}.${key}` : key),
    );
  }
  return [prefix];
}

describe('translation dictionaries', () => {
  it('covers the same keys in English and German', () => {
    expect(keys(de).sort()).toEqual(keys(en).sort());
    expect(keys(en).length).toBeGreaterThan(100);
  });

  it('keeps the English API errors identical to the messages the HTTP layer stores', () => {
    expect(en.error.offline).toBe(userMessageFor(0));
    expect(en.error.notFound).toBe(userMessageFor(404));
    expect(en.error.conflict).toBe(userMessageFor(409));
    expect(en.error.rejected).toBe(userMessageFor(422));
    expect(en.error.server).toBe(userMessageFor(500));
    expect(en.error.unknown).toBe('Something went wrong. Please try again.');
  });

  it('translates the interface rather than copying English', () => {
    expect(de.nav.tasks).toBe('Aufgaben');
    expect(de.action.save).not.toBe(en.action.save);
    expect(de.due.today).not.toBe(en.due.today);
    expect(de.language.english).toBe('English');
    expect(de.language.german).toBe('Deutsch');
  });
});
