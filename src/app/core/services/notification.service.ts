import { EnvironmentInjector, inject, Injectable } from '@angular/core';
import type { MatSnackBarConfig } from '@angular/material/snack-bar';

/**
 * Thin wrapper over MatSnackBar so components don't depend on Material directly for toasts.
 * The snack-bar module is imported on first use to keep it out of the initial bundle.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly injector = inject(EnvironmentInjector);

  success(message: string): Promise<void> {
    return this.open(message, {
      duration: 3000,
      panelClass: 'snack-success',
      politeness: 'polite',
    });
  }

  error(message: string): Promise<void> {
    return this.open(message, {
      duration: 6000,
      panelClass: 'snack-error',
      politeness: 'assertive',
    });
  }

  private async open(message: string, config: MatSnackBarConfig): Promise<void> {
    const { MatSnackBar } = await import('@angular/material/snack-bar');
    this.injector.get(MatSnackBar).open(message, 'Dismiss', config);
  }
}
