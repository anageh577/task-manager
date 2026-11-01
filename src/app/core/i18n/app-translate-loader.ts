import { Injectable } from '@angular/core';
import type { TranslateLoader, TranslationObject } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import de from './translations/de.json';
import en from './translations/en.json';

const TRANSLATIONS: Record<string, TranslationObject> = {
  en: en as TranslationObject,
  de: de as TranslationObject,
};

/** Serves the bundled dictionaries. They stay out of the API interceptor pipeline. */
@Injectable()
export class AppTranslateLoader implements TranslateLoader {
  getTranslation(lang: string): Observable<TranslationObject> {
    return of(TRANSLATIONS[lang] ?? TRANSLATIONS['en']);
  }
}
