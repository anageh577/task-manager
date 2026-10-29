import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Circular initials avatar. Decorative by default; pass `label` to expose it to assistive tech. */
@Component({
  selector: 'app-avatar',
  template: `{{ text() }}`,
  styles: `
    :host {
      display: inline-grid;
      place-items: center;
      flex: none;
      width: var(--avatar-size);
      height: var(--avatar-size);
      border-radius: 50%;
      background: var(--tm-primary);
      color: #fff;
      font-size: calc(var(--avatar-size) * 0.4);
      font-weight: 600;
      line-height: 1;
      user-select: none;
    }
  `,
  host: {
    '[style.--avatar-size.px]': 'size()',
    '[attr.role]': 'label() ? "img" : null',
    '[attr.aria-label]': 'label() || null',
    '[attr.aria-hidden]': 'label() ? null : "true"',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvatarComponent {
  readonly name = input.required<string>();
  /** Pre-computed initials (e.g. from the API); derived from `name` when omitted. */
  readonly size = input(24);
  readonly label = input<string>('');
  readonly initials = input<string>('');

  protected readonly text = computed(() => this.initials() || this.initials());
}
