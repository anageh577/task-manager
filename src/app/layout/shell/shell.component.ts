import { BreakpointObserver } from '@angular/cdk/layout';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatSidenavModule } from '@angular/material/sidenav';
import { Router, RouterOutlet } from '@angular/router';
import { map } from 'rxjs';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';

/** Below this width the sidebar becomes an overlay drawer. */
export const HANDSET_QUERY = '(max-width: 959.98px)';

/** Application chrome (header + responsive sidebar) hosting the lazily loaded feature pages. */
@Component({
  selector: 'app-shell',
  imports: [MatSidenavModule, RouterOutlet, HeaderComponent, SidebarComponent],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent {
  private readonly router = inject(Router);

  protected readonly isHandset = toSignal(
    inject(BreakpointObserver)
      .observe(HANDSET_QUERY)
      .pipe(map((state) => state.matches)),
    { initialValue: false },
  );
  protected readonly navOpen = signal(false);

  protected showOverdue(): void {
    void this.router.navigate(['/calendar']);
  }

  protected toggleNav(): void {
    this.navOpen.update((open) => !open);
  }

  protected closeNavOnHandset(): void {
    if (this.isHandset()) this.navOpen.set(false);
  }
}
