import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Shimmering placeholder block used to build skeleton screens. */
@Component({
  selector: 'app-skeleton',
  template: '',
  styles: `
    :host {
      display: block;
      border-radius: var(--tm-radius-sm);
      background: linear-gradient(90deg, #eceff3 0%, #f6f7f9 40%, #eceff3 80%) 0 0 / 200% 100%;
      animation: shimmer 1.4s ease-in-out infinite;
    }
    @keyframes shimmer {
      to {
        background-position: -200% 0;
      }
    }
  `,
  host: {
    'aria-hidden': 'true',
    '[style.width]': 'width()',
    '[style.height]': 'height()',
    '[style.border-radius]': 'radius()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkeletonComponent {
  readonly width = input('100%');
  readonly height = input('12px');
  readonly radius = input<string | null>(null);
}
