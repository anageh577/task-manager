import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

/** Shown for any URL the shell does not recognise. */
@Component({
  selector: 'app-not-found-page',
  imports: [RouterLink, TranslatePipe],
  template: `
    <div class="tm-page">
      <header class="tm-page-header">
        <div>
          <h1>{{ 'notFound.title' | translate }}</h1>
          <p>{{ 'notFound.message' | translate }}</p>
        </div>
      </header>
      <a routerLink="/dashboard">{{ 'action.back' | translate }}</a>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class NotFoundPage {}
