import { DOCUMENT } from '@angular/common';
import { effect, inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import type { AppLanguage } from './language';
import { dateLocaleFor, isAppLanguage, writeStoredLanguage } from './language';

/**
 * Active language. English is the default; the choice is remembered in a cookie
 * and applied to ngx-translate, the document, and the browser title.
 */
@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly translate = inject(TranslateService);
  private readonly document = inject(DOCUMENT);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  constructor() {
    this.applyDocument(this.current());
    effect(() => this.applyDocument(this.current()));
  }

  current(): AppLanguage {
    const lang = this.translate.currentLang();
    return isAppLanguage(lang) ? lang : 'en';
  }

  dateLocale(): string {
    return dateLocaleFor(this.current());
  }

  /** Translated string. Reads the active language so computeds refresh on switch. */
  text(key: string, params?: Record<string, unknown>): string {
    this.current();
    const value = this.translate.instant(key, params);
    return typeof value === 'string' ? value : key;
  }

  use(lang: AppLanguage): void {
    writeStoredLanguage(lang);
    this.translate.use(lang);
    this.applyDocument(lang);
  }

  private applyDocument(lang: AppLanguage): void {
    this.document.documentElement.lang = lang;
    const name = this.translate.instant('app.name');
    const description = this.translate.instant('app.description');
    if (typeof name === 'string' && name !== 'app.name') this.title.setTitle(name);
    if (typeof description === 'string' && description !== 'app.description') {
      this.meta.updateTag({ name: 'description', content: description });
    }
  }
}
