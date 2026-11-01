import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { LANGUAGE_STORAGE_KEY } from './language';
import { LanguageService } from './language.service';
import { provideI18n } from './provide-i18n';

describe('LanguageService', () => {
  afterEach(() => {
    document.cookie = `${LANGUAGE_STORAGE_KEY}=; Path=/; Max-Age=0`;
  });

  it('uses English unless a language was stored', () => {
    document.cookie = `${LANGUAGE_STORAGE_KEY}=; Path=/; Max-Age=0`;
    TestBed.configureTestingModule({ providers: provideI18n() });
    const language = TestBed.inject(LanguageService);

    expect(language.current()).toBe('en');
    expect(language.dateLocale()).toBe('en-US');
    expect(language.text('nav.tasks')).toBe('Tasks');
    expect(document.documentElement.lang).toBe('en');
    expect(TestBed.inject(Title).getTitle()).toBe('Task Manager');
  });

  it('restores German and switches back to English', () => {
    document.cookie = `${LANGUAGE_STORAGE_KEY}=de; Path=/`;
    TestBed.configureTestingModule({ providers: provideI18n() });
    const language = TestBed.inject(LanguageService);

    expect(language.current()).toBe('de');
    expect(language.dateLocale()).toBe('de');
    expect(language.text('nav.tasks')).toBe('Aufgaben');
    expect(language.text('due.today')).toBe('Heute fällig');
    expect(document.documentElement.lang).toBe('de');
    expect(TestBed.inject(Title).getTitle()).toBe('Aufgabenmanager');

    language.use('en');
    expect(language.current()).toBe('en');
    expect(language.text('due.today')).toBe('Due today');
    expect(document.cookie).toContain(`${LANGUAGE_STORAGE_KEY}=en`);
    expect(document.documentElement.lang).toBe('en');
    expect(TestBed.inject(Title).getTitle()).toBe('Task Manager');
  });
});
