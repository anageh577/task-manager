import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink, RouterLinkActive } from '@angular/router';

export interface NavItem {
  path: string;
  label: string;
  icon: string;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { path: '/tasks', label: 'Tasks', icon: '✅' },
  { path: '/calendar', label: 'Calendar', icon: '📅' },
  { path: '/analytics', label: 'Analytics', icon: '📈' },
  { path: '/team', label: 'Team', icon: '👥' },
  { path: '/settings', label: 'Settings', icon: '⚙️' },
];

@Component({
  selector: 'app-sidebar',
  imports: [MatButtonModule, RouterLink, RouterLinkActive],
  template: `
    <nav aria-label="Main navigation">
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
              {{ item.label }}
            </a>
          </li>
        }
      </ul>
    </nav>
    <button mat-flat-button type="button" class="new-task" (click)="newTask.emit()">
      + New Task
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
