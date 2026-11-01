import { inject, Pipe } from '@angular/core';
import type { PipeTransform } from '@angular/core';
import { LanguageService } from './language.service';
import { translationKeyForMessage } from './localize-message';

/** Translates a known API message and leaves any other text unchanged. */
@Pipe({ name: 'localizeMessage', pure: false })
export class LocalizeMessagePipe implements PipeTransform {
  private readonly language = inject(LanguageService);

  transform(message: string | null | undefined): string {
    if (!message) return '';
    const key = translationKeyForMessage(message);
    return key ? this.language.text(key) : message;
  }
}
