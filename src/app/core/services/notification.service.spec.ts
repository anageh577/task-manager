import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideTestEnvironment } from '../../testing/fixtures';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  it('opens polite success and assertive error snack bars', async () => {
    const snackBar = { open: vi.fn() };
    TestBed.configureTestingModule({
      providers: [provideTestEnvironment(), { provide: MatSnackBar, useValue: snackBar }],
    });
    const notify = TestBed.inject(NotificationService);

    await notify.success('Saved');
    await notify.error('Failed');

    expect(snackBar.open).toHaveBeenNthCalledWith(1, 'Saved', 'Dismiss', {
      duration: 3000,
      panelClass: 'snack-success',
      politeness: 'polite',
    });
    expect(snackBar.open).toHaveBeenNthCalledWith(
      2,
      'Failed',
      'Dismiss',
      expect.objectContaining({ panelClass: 'snack-error', politeness: 'assertive' }),
    );
  });
});
