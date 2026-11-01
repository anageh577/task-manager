export const APP_LANGUAGES = ['en', 'de'] as const;
export type AppLanguage = (typeof APP_LANGUAGES)[number];

export const LANGUAGE_STORAGE_KEY = 'tm.language';

const LANGUAGE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isAppLanguage(value: string | null | undefined): value is AppLanguage {
  return value === 'en' || value === 'de';
}

/** English unless the visitor previously chose German. */
export function readStoredLanguage(): AppLanguage {
  const stored = readCookie(LANGUAGE_STORAGE_KEY);
  return isAppLanguage(stored) ? stored : 'en';
}

/** Remember the language choice in a cookie so the next visit can restore it. */
export function writeStoredLanguage(lang: AppLanguage): void {
  writeCookie(LANGUAGE_STORAGE_KEY, lang, LANGUAGE_COOKIE_MAX_AGE);
}

function readCookie(name: string): string | null {
  try {
    const cookies = document.cookie ? document.cookie.split('; ') : [];
    const prefix = `${name}=`;
    const match = cookies.find((cookie) => cookie.startsWith(prefix));
    return match ? decodeURIComponent(match.slice(prefix.length)) : null;
  } catch {
    return null;
  }
}

function writeCookie(name: string, value: string, maxAge: number): void {
  try {
    document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
  } catch {
    // Cookies can be blocked; the in-memory language still changes.
  }
}

/** Angular `DatePipe` / `DateAdapter` locale id for an app language. */
export function dateLocaleFor(lang: AppLanguage): string {
  return lang === 'de' ? 'de' : 'en-US';
}
