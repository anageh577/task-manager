import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Shown for any URL the shell does not recognise. */
@Component({
  selector: 'app-not-found-page',
  imports: [RouterLink],
  template: `
    <div class="tm-page">
      <header class="tm-page-header">
        <div>
          <h1>Page not found</h1>
          <p>That address does not match a page in this app.</p>
        </div>
      </header>
      <a routerLink="/dashboard">Back to dashboard</a>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class NotFoundPage {}
