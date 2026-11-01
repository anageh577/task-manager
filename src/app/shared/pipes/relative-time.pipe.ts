import { inject, Pipe } from '@angular/core';
import type { PipeTransform } from '@angular/core';
import { relativeTime } from '@core/utils/date.utils';
import { LanguageService } from '@core/i18n/language.service';

@Pipe({ name: 'relativeTime', pure: false })
export class RelativeTimePipe implements PipeTransform {
  private readonly language = inject(LanguageService);

  transform(timestamp: string, now: Date = new Date()): string {
    const { key, params } = relativeTime(timestamp, now);
    return this.language.text(key, params);
  }
}
