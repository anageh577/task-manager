import { inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from './language.service';

/** Material paginator labels, kept in sync with the active language. */
@Injectable()
export class AppPaginatorIntl extends MatPaginatorIntl {
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageService);

  constructor() {
    super();
    this.translate.onLangChange.pipe(takeUntilDestroyed()).subscribe(() => this.apply());
    this.apply();
  }

  private apply(): void {
    this.itemsPerPageLabel = this.language.text('paginator.itemsPerPage');
    this.nextPageLabel = this.language.text('paginator.next');
    this.previousPageLabel = this.language.text('paginator.previous');
    this.firstPageLabel = this.language.text('paginator.first');
    this.lastPageLabel = this.language.text('paginator.last');
    this.getRangeLabel = (page: number, pageSize: number, length: number) => {
      if (length === 0 || pageSize === 0) {
        return this.language.text('paginator.emptyRange', { length });
      }
      const start = page * pageSize;
      const end = start < length ? Math.min(start + pageSize, length) : start + pageSize;
      return this.language.text('paginator.range', { start: start + 1, end, length });
    };
    this.changes.next();
  }
}
