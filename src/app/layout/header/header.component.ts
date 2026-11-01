import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { RouterLink } from '@angular/router';
import { LanguageService } from '@core/i18n/language.service';
import { AvatarComponent } from '@shared/ui/avatar/avatar.component';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-header',
  imports: [
    MatBadgeModule,
    MatButtonModule,
    MatMenuModule,
    RouterLink,
    AvatarComponent,
    TranslatePipe,
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  protected readonly language = inject(LanguageService);
  readonly search = input('');
  readonly overdueCount = input(0);
  readonly user = input<{ name: string; avatar: string; email: string }>({
    name: 'John Doe',
    avatar: 'JD',
    email: 'john.doe@example.com',
  });
  readonly showMenuButton = input(false);
  readonly navOpen = input(false);

  readonly searchChange = output<string>();
  readonly menuToggle = output<void>();
  readonly showOverdue = output<void>();

  protected onSearch(event: Event): void {
    this.searchChange.emit((event.target as HTMLInputElement).value);
  }
}
