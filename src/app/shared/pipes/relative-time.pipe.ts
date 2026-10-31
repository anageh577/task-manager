import type { PipeTransform } from '@angular/core';
import { Pipe } from '@angular/core';
import { relativeTime } from '@core/utils/date.utils';

@Pipe({ name: 'relativeTime' })
export class RelativeTimePipe implements PipeTransform {
  transform(timestamp: string, now: Date = new Date()): string {
    return relativeTime(timestamp, now);
  }
}
