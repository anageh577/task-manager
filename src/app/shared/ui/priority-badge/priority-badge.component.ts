import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { TaskPriority } from '@core/models';
import { PRIORITY_LABELS } from '@core/models';

@Component({
  selector: 'app-priority-badge',
  template: `<span class="visually-hidden">Priority: </span>{{ label() }}`,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      padding: 2px 8px;
      border-radius: var(--tm-radius-sm);
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      line-height: 16px;
    }
    :host(.high) {
      background: var(--tm-danger-soft);
      color: #c62828;
    }
    :host(.medium) {
      background: var(--tm-warning-soft);
      color: #b45309;
    }
    :host(.low) {
      background: var(--tm-success-soft);
      color: #2e7d32;
    }
  `,
  host: { '[class]': 'priority()' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PriorityBadgeComponent {
  readonly priority = input.required<TaskPriority>();
  protected readonly label = computed(() => PRIORITY_LABELS[this.priority()]);
}
