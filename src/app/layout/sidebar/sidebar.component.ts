import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

export interface NavItem {
  path: string;
  labelKey: string;
  icon: string;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { path: '/dashboard', labelKey: 'nav.dashboard', icon: '🏠' },
  { path: '/tasks', labelKey: 'nav.tasks', icon: '✅' },
  { path: '/calendar', labelKey: 'nav.calendar', icon: '📅' },
  { path: '/analytics', labelKey: 'nav.analytics', icon: '📈' },
  { path: '/team', labelKey: 'nav.team', icon: '👥' },
  { path: '/settings', labelKey: 'nav.settings', icon: '⚙️' },
];

@Component({
  selector: 'app-sidebar',
  imports: [MatButtonModule, RouterLink, RouterLinkActive, TranslatePipe],
  template: `
    <nav id="app-navigation" [attr.aria-label]="'nav.label' | translate">
      <ul>
        @for (item of items; track item.path) {
          <li>
            <a
              [routerLink]="item.path"
              routerLinkActive="active"
              ariaCurrentWhenActive="page"
              (click)="navigate.emit()"
            >
              <span class="icon" aria-hidden="true">{{ item.icon }}</span>
              {{ item.labelKey | translate }}
            </a>
          </li>
        }
      </ul>
    </nav>
    <button mat-flat-button type="button" class="new-task" (click)="newTask.emit()">
      + {{ 'action.newTask' | translate }}
    </button>
  `,
  styleUrl: './sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  protected readonly items = NAV_ITEMS;
  readonly newTask = output<void>();
  readonly navigate = output<void>();
}
