import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-error-state',
  imports: [MatButtonModule],
  template: `
    <span class="icon" aria-hidden="true">⚠️</span>
    <div class="body">
      <p class="title">{{ title() }}</p>
      <p class="message">{{ message() }}</p>
    </div>
    <button mat-stroked-button type="button" (click)="retry.emit()" [disabled]="retrying()">
      {{ retrying() ? 'Retrying…' : 'Try again' }}
    </button>
  `,
  styles: `
    :host {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 12px;
      padding: 16px;
      border: 1px solid #f5c2c7;
      border-radius: var(--tm-radius);
      background: var(--tm-danger-soft);
      color: #842029;
    }
    .icon {
      font-size: 20px;
    }
    .body {
      flex: 1 1 220px;
    }
    .title {
      font-weight: 600;
    }
    .message {
      font-size: 13px;
    }
  `,
  host: { role: 'alert' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorStateComponent {
  readonly title = input('Something went wrong');
  readonly message = input.required<string>();
  readonly retrying = input(false);
  readonly retry = output<void>();
}
