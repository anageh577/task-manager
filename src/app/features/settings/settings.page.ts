import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { CURRENT_USER } from '@core/config/app-config';
import { DataRefreshService } from '@core/services/data-refresh.service';
import { NotificationService } from '@core/services/notification.service';
import { AvatarComponent } from '@shared/ui/avatar/avatar.component';

/** Profile summary and data/cache maintenance. */
@Component({
  selector: 'app-settings-page',
  imports: [MatButtonModule, AvatarComponent],
  templateUrl: './settings.page.html',
  styleUrl: './settings.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SettingsPage {
  protected readonly user = inject(CURRENT_USER);
  private readonly notify = inject(NotificationService);
  private readonly dataRefresh = inject(DataRefreshService);

  protected refresh(): void {
    this.dataRefresh.refresh();
    this.notify.success('Data refreshed');
  }
}
