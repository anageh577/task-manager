import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { LanguageService } from '@core/i18n/language.service';
import type { Statistic } from '@core/models/statistic.model';
import { SkeletonComponent } from '../skeleton/skeleton.component';

const TITLE_KEYS: Record<string, string> = {
  'stat-001': 'stats.total',
  'stat-002': 'stats.completed',
  'stat-003': 'stats.inProgress',
  'stat-004': 'stats.overdue',
};

const CHANGE_KEYS: Record<string, string> = {
  'this week': 'stats.thisWeek',
  today: 'stats.today',
  'Same as yesterday': 'stats.sameAsYesterday',
};

@Component({
  selector: 'app-stat-card',
  imports: [SkeletonComponent],
  template: `
    <p class="title">
      <span class="icon" aria-hidden="true">{{ stat().icon }}</span
      >{{ title() }}
    </p>
    @if (loading()) {
      <app-skeleton width="56px" height="30px" />
      <app-skeleton width="90px" height="12px" />
    } @else {
      <p class="value">{{ stat().value }}</p>
      @if (changeLabel()) {
        <p class="change" [class]="stat().changeType">
          @if (stat().change !== '0') {
            {{ stat().change }}
          }
          {{ changeLabel() }}
        </p>
      }
    }
  `,
  styleUrl: './stat-card.component.scss',
  host: { class: 'tm-panel', role: 'group', '[attr.aria-label]': 'title()' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatCardComponent {
  private readonly language = inject(LanguageService);
  readonly stat = input.required<Statistic>();
  readonly loading = input(false);

  protected readonly title = computed(() => {
    const key = TITLE_KEYS[this.stat().id];
    return key ? this.language.text(key) : this.stat().title;
  });
  protected readonly changeLabel = computed(() => {
    const label = this.stat().changeLabel;
    if (!label) return '';
    const key = CHANGE_KEYS[label];
    return key ? this.language.text(key) : label;
  });
}
