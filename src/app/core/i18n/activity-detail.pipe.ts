import { inject, Pipe } from '@angular/core';
import type { PipeTransform } from '@angular/core';
import type { TaskStatus } from '@core/models';
import { STATUS_LABELS } from '@core/models';
import { LanguageService } from './language.service';

const STATUS_BY_LABEL = Object.fromEntries(
  (Object.entries(STATUS_LABELS) as [TaskStatus, string][]).map(([status, label]) => [
    label,
    status,
  ]),
) as Record<string, TaskStatus>;

/** Translates a stored "To Do → In Progress" detail. Unknown text is returned as stored. */
@Pipe({ name: 'activityDetail', pure: false })
export class ActivityDetailPipe implements PipeTransform {
  private readonly language = inject(LanguageService);

  transform(detail: string | null | undefined): string {
    if (!detail) return '';
    const [from, to] = detail.split(' → ');
    const fromStatus = STATUS_BY_LABEL[from ?? ''];
    const toStatus = to ? STATUS_BY_LABEL[to] : undefined;
    if (!fromStatus || !toStatus) return detail;
    return `${this.language.text('status.' + fromStatus)} → ${this.language.text('status.' + toStatus)}`;
  }
}
