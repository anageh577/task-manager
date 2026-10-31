import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import type { ChartConfiguration, ChartType } from 'chart.js';
import { provideTestEnvironment } from '../../../testing/fixtures';
import type { ChartFactory, ChartInstance } from './chart-loader';
import { CHART_LOADER } from './chart-loader';
import { ChartComponent } from './chart.component';

describe('ChartComponent', () => {
  let fixture: ComponentFixture<ChartComponent>;
  let instance: ChartInstance;
  let factory: ReturnType<typeof vi.fn<ChartFactory>>;

  const configOf = () => factory.mock.calls[0][1] as ChartConfiguration<ChartType>;

  beforeEach(() => {
    instance = { data: { datasets: [] }, update: vi.fn(), destroy: vi.fn() };
    factory = vi.fn<ChartFactory>(() => instance);
    TestBed.configureTestingModule({
      providers: [
        provideTestEnvironment(),
        { provide: CHART_LOADER, useValue: () => Promise.resolve(factory) },
      ],
    });
    fixture = TestBed.createComponent(ChartComponent);
    fixture.componentRef.setInput('labels', ['To Do', 'Done']);
    fixture.componentRef.setInput('values', [3, 5]);
    fixture.componentRef.setInput('colors', ['#111', '#222']);
  });

  const renderChart = async (type: 'doughnut' | 'bar') => {
    fixture.componentRef.setInput('type', type);
    await fixture.whenStable();
    await vi.waitFor(() => expect(factory).toHaveBeenCalled());
    await fixture.whenStable();
  };

  it('creates a doughnut chart with an accessible description', async () => {
    await renderChart('doughnut');
    const element: HTMLElement = fixture.nativeElement;

    expect(factory.mock.calls[0][0]).toBe(element.querySelector('canvas'));
    expect(configOf()).toMatchObject({
      type: 'doughnut',
      data: { labels: ['To Do', 'Done'], datasets: [{ data: [3, 5], borderWidth: 2 }] },
      options: { cutout: '65%', plugins: { legend: { display: true } } },
    });
    expect(element.querySelector('canvas')?.getAttribute('aria-label')).toBe(
      'Tasks chart: To Do 3, Done 5',
    );
    expect([...element.querySelectorAll('li')].map((li) => li.textContent)).toEqual([
      'To Do: 3',
      'Done: 5',
    ]);
  });

  it('configures bar charts with integer axes and no legend', async () => {
    fixture.componentRef.setInput('datasetLabel', 'Open tasks');
    await renderChart('bar');

    expect(configOf()).toMatchObject({
      type: 'bar',
      data: { datasets: [{ label: 'Open tasks', borderRadius: 4 }] },
      options: {
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
      },
    });
  });

  it('updates the existing chart when data changes and destroys it on teardown', async () => {
    await renderChart('doughnut');
    vi.mocked(instance.update).mockClear();

    fixture.componentRef.setInput('values', [4, 6]);
    await fixture.whenStable();

    expect(factory).toHaveBeenCalledTimes(1);
    expect(instance.data.datasets[0].data).toEqual([4, 6]);
    expect(instance.update).toHaveBeenCalled();

    fixture.destroy();
    expect(instance.destroy).toHaveBeenCalled();
  });
});
