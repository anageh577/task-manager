import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { CURRENT_USER } from '@core/config/app-config';
import type { AppLanguage } from '@core/i18n/language';
import { isAppLanguage } from '@core/i18n/language';
import { LanguageService } from '@core/i18n/language.service';
import { DataRefreshService } from '@core/services/data-refresh.service';
import { NotificationService } from '@core/services/notification.service';
import { AvatarComponent } from '@shared/ui/avatar/avatar.component';
import { TranslatePipe } from '@ngx-translate/core';

/** Profile summary and data/cache maintenance. */
@Component({
  selector: 'app-settings-page',
  imports: [MatButtonModule, MatButtonToggleModule, AvatarComponent, TranslatePipe],
  templateUrl: './settings.page.html',
  styleUrl: './settings.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SettingsPage {
  protected readonly user = inject(CURRENT_USER);
  protected readonly language = inject(LanguageService);
  private readonly notify = inject(NotificationService);
  private readonly dataRefresh = inject(DataRefreshService);

  protected refresh(): void {
    this.dataRefresh.refresh();
    this.notify.success(this.language.text('notify.refreshed'));
  }

  protected setLanguage(lang: string): void {
    if (isAppLanguage(lang)) this.language.use(lang as AppLanguage);
  }
}
