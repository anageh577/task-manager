import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { CURRENT_USER } from '@core/config/app-config';
import { HttpCacheService } from '@core/http/http-cache.service';
import { NotificationService } from '@core/services/notification.service';
import { ActivityStore } from '@core/state/activity.store';
import { StatisticsStore } from '@core/state/statistics.store';
import { TaskStore } from '@core/state/task.store';
import { UserStore } from '@core/state/user.store';
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
  private readonly cache = inject(HttpCacheService);
  private readonly stores = [
    inject(TaskStore),
    inject(StatisticsStore),
    inject(UserStore),
    inject(ActivityStore),
  ];

  protected refresh(): void {
    this.cache.clear();
    this.stores.forEach((store) => store.reload());
    this.notify.success('Data refreshed');
  }
}
