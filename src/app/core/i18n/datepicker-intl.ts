import { inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDatepickerIntl } from '@angular/material/datepicker';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from './language.service';

/** Material datepicker labels, kept in sync with the active language. */
@Injectable()
export class AppDatepickerIntl extends MatDatepickerIntl {
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageService);

  constructor() {
    super();
    this.translate.onLangChange.pipe(takeUntilDestroyed()).subscribe(() => this.apply());
    this.apply();
  }

  override formatYearRange(start: string, end: string): string {
    return this.language.text('datepicker.yearRange', { start, end });
  }

  override formatYearRangeLabel(start: string, end: string): string {
    return this.language.text('datepicker.yearRangeLabel', { start, end });
  }

  private apply(): void {
    this.calendarLabel = this.language.text('datepicker.calendar');
    this.openCalendarLabel = this.language.text('datepicker.open');
    this.closeCalendarLabel = this.language.text('datepicker.close');
    this.prevMonthLabel = this.language.text('datepicker.prevMonth');
    this.nextMonthLabel = this.language.text('datepicker.nextMonth');
    this.prevYearLabel = this.language.text('datepicker.prevYear');
    this.nextYearLabel = this.language.text('datepicker.nextYear');
    this.prevMultiYearLabel = this.language.text('datepicker.prevMultiYear');
    this.nextMultiYearLabel = this.language.text('datepicker.nextMultiYear');
    this.switchToMonthViewLabel = this.language.text('datepicker.switchToMonth');
    this.switchToMultiYearViewLabel = this.language.text('datepicker.switchToMultiYear');
    this.startDateLabel = this.language.text('datepicker.startDate');
    this.endDateLabel = this.language.text('datepicker.endDate');
    this.comparisonDateLabel = this.language.text('datepicker.comparison');
    this.changes.next();
  }
}
