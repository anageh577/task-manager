import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { LanguageService } from '@core/i18n/language.service';
import type { TaskPriority } from '@core/models';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-priority-badge',
  imports: [TranslatePipe],
  template: `<span class="sr-only">{{ 'task.priorityPrefix' | translate }}</span
    >{{ label() }}`,
  styles: `
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
    :host {
      position: relative;
      display: inline-flex;
      align-items: center;
      padding: 5px 8px;
      border-radius: var(--tm-radius-sm);
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      line-height: 16px;
    }
    :host(.high) {
      background: #fdecea;
      color: #9b2c2c;
    }
    :host(.medium) {
      background: #fff1e0;
      color: #8a4b00;
    }
    :host(.low) {
      background: #fdf4e2;
      color: #1b5e20;
    }
  `,
  host: { '[class]': 'priority()' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PriorityBadgeComponent {
  private readonly language = inject(LanguageService);
  readonly priority = input.required<TaskPriority>();
  protected readonly label = computed(() => this.language.text(`priority.${this.priority()}`));
}
