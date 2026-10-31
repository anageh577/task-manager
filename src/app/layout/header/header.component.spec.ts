import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { JOHN, provideTestEnvironment } from '../../testing/fixtures';
import { HeaderComponent } from './header.component';

describe('HeaderComponent', () => {
  let fixture: ComponentFixture<HeaderComponent>;
  let element: HTMLElement;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideTestEnvironment(), provideRouter([])] });
    fixture = TestBed.createComponent(HeaderComponent);
    fixture.componentRef.setInput('user', JOHN);
    fixture.componentRef.setInput('search', 'initial');
    fixture.componentRef.setInput('overdueCount', 3);
    element = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('renders search, notifications and account controls', () => {
    expect(element.querySelector<HTMLInputElement>('input[type="search"]')?.value).toBe('initial');
    expect(element.querySelector('.bell')?.getAttribute('aria-label')).toBe(
      'Notifications: 3 overdue tasks',
    );
    expect(element.querySelector('.mat-badge-content')?.textContent).toBe('3');
    expect(element.querySelector('.menu')).toBeNull();
  });

  it('emits search terms as the user types', () => {
    const terms: string[] = [];
    fixture.componentInstance.searchChange.subscribe((t) => terms.push(t));
    const input = element.querySelector<HTMLInputElement>('input[type="search"]')!;

    input.value = 'bug';
    input.dispatchEvent(new Event('input'));
    expect(terms).toEqual(['bug']);
  });

  it('emits navigation intents', async () => {
    let toggles = 0;
    let overdue = 0;
    fixture.componentInstance.menuToggle.subscribe(() => toggles++);
    fixture.componentInstance.showOverdue.subscribe(() => overdue++);
    fixture.componentRef.setInput('showMenuButton', true);
    await fixture.whenStable();

    element.querySelector<HTMLButtonElement>('.menu')!.click();
    element.querySelector<HTMLButtonElement>('.bell')!.click();
    expect([toggles, overdue]).toEqual([1, 1]);
  });

  it('shows the profile menu', async () => {
    element.querySelector<HTMLButtonElement>('.profile')!.click();
    await fixture.whenStable();
    const panel = document.querySelector('.mat-mdc-menu-panel');
    expect(panel?.textContent).toContain('john.doe@company.com');
    expect(panel?.querySelector('a[href="/settings"]')).not.toBeNull();
  });
});
