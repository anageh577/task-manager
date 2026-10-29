import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { Statistic } from '@core/models/statistic.model';
import { SkeletonComponent } from '../skeleton/skeleton.component';

@Component({
  selector: 'app-stat-card',
  imports: [SkeletonComponent],
  template: `
    <p class="title">
      <span class="icon" aria-hidden="true">{{ stat().icon }}</span
      >{{ stat().title }}
    </p>
    @if (loading()) {
      <app-skeleton width="56px" height="30px" />
      <app-skeleton width="90px" height="12px" />
    } @else {
      <p class="value">{{ stat().value }}</p>
      @if (stat().changeLabel) {
        <p class="change" [class]="stat().changeType">
          @if (stat().change !== '0') {
            {{ stat().change }}
          }
          {{ stat().changeLabel }}
        </p>
      }
    }
  `,
  styleUrl: './stat-card.component.scss',
  host: { class: 'tm-panel', role: 'group', '[attr.aria-label]': 'stat().title' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatCardComponent {
  readonly stat = input.required<Statistic>();
  readonly loading = input(false);
}
