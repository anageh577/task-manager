import { BreakpointObserver } from '@angular/cdk/layout';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatSidenavModule } from '@angular/material/sidenav';
import { Router, RouterOutlet } from '@angular/router';
import { map } from 'rxjs';
import { CURRENT_USER } from '@core/config/app-config';
import { TaskStore } from '@core/state/task.store';
import { TaskActionsService } from '@shared/task-dialogs/task-actions.service';
import { TranslatePipe } from '@ngx-translate/core';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';

/** Below this width the sidebar becomes an overlay drawer. */
export const HANDSET_QUERY = '(max-width: 959.98px)';
/** Below this width the header search wraps onto its own row. */
const COMPACT_QUERY = '(max-width: 599.98px)';
const HEADER_OFFSET = 64;
const COMPACT_HEADER_OFFSET = 105;
const SEARCHABLE_ROUTES = ['/dashboard', '/tasks'];

/** Application chrome (header + responsive sidebar) hosting the lazily loaded feature pages. */
@Component({
  selector: 'app-shell',
  imports: [MatSidenavModule, RouterOutlet, HeaderComponent, SidebarComponent, TranslatePipe],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent {
  private readonly router = inject(Router);
  private readonly actions = inject(TaskActionsService);
  protected readonly store = inject(TaskStore);
  protected readonly user = inject(CURRENT_USER);

  private readonly breakpoints = inject(BreakpointObserver);

  protected readonly isHandset = toSignal(
    this.breakpoints.observe(HANDSET_QUERY).pipe(map((state) => state.matches)),
    { initialValue: false },
  );
  private readonly isCompact = toSignal(
    this.breakpoints.observe(COMPACT_QUERY).pipe(map((state) => state.matches)),
    { initialValue: false },
  );
  /** Keeps the overlay drawer below the header, including the wrapped mobile search. */
  protected readonly headerOffset = computed(() =>
    this.isCompact() ? COMPACT_HEADER_OFFSET : HEADER_OFFSET,
  );
  protected readonly navOpen = signal(false);

  protected onSearch(term: string): void {
    this.store.updateFilters({ search: term });
    if (!SEARCHABLE_ROUTES.some((path) => this.router.url.startsWith(path))) {
      void this.router.navigate(['/dashboard']);
    }
  }

  protected showOverdue(): void {
    void this.router.navigate(['/calendar']);
  }

  protected toggleNav(): void {
    this.navOpen.update((open) => !open);
  }

  protected closeNavOnHandset(): void {
    if (this.isHandset()) this.navOpen.set(false);
  }

  protected newTask(): void {
    this.closeNavOnHandset();
    void this.actions.openCreate();
  }
}
