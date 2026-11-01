import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-empty-state',
  imports: [TranslatePipe],
  template: `
    <span class="icon" aria-hidden="true">{{ icon() }}</span>
    <p class="title">{{ title() | translate }}</p>
    @if (message()) {
      <p class="message">{{ message() | translate }}</p>
    }
    <ng-content />
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding: 32px 16px;
      text-align: center;
      color: var(--tm-text-muted);
    }
    .icon {
      font-size: 28px;
    }
    .title {
      font-weight: 600;
      color: var(--tm-text);
    }
    .message {
      max-width: 320px;
      font-size: 13px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateComponent {
  readonly icon = input('🗂️');
  readonly title = input.required<string>();
  readonly message = input('');
}
