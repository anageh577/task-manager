import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';
import { inject, provideAppInitializer } from '@angular/core';
import type { EnvironmentProviders, Provider } from '@angular/core';
import { provideTranslateService } from '@ngx-translate/core';
import { AppTranslateLoader } from './app-translate-loader';
import { readStoredLanguage } from './language';
import { LanguageService } from './language.service';

registerLocaleData(localeDe);

/** ngx-translate with the bundled English (default) and German dictionaries. */
export function provideI18n(): (Provider | EnvironmentProviders)[] {
  return [
    ...provideTranslateService({
      lang: readStoredLanguage(),
      fallbackLang: 'en',
      loader: AppTranslateLoader,
    }),
    provideAppInitializer(() => {
      inject(LanguageService);
    }),
  ];
}
