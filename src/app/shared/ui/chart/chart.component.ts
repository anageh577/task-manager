import type { ElementRef } from '@angular/core';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import type { ChartConfiguration, ChartData } from 'chart.js';
import type { ChartInstance } from './chart-loader';
import { CHART_LOADER } from './chart-loader';

export type SimpleChartType = 'doughnut' | 'bar';

function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Minimal Chart.js wrapper driven by signal inputs.
 *
 * The chart is created after the first render (canvas exists, browser only) and later input
 * changes update the existing instance instead of re-creating it. A visually hidden list
 * mirrors the data for screen-reader users.
 */
@Component({
  selector: 'app-chart',
  template: `
    <div class="canvas-wrapper" [style.height.px]="height()">
      <canvas #canvas role="img" [attr.aria-label]="ariaLabel()"></canvas>
    </div>
    <ul class="visually-hidden">
      @for (label of labels(); track label; let i = $index) {
        <li>{{ label }}: {{ values()[i] }}</li>
      }
    </ul>
  `,
  styles: `
    .canvas-wrapper {
      position: relative;
      width: 100%;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartComponent {
  readonly type = input.required<SimpleChartType>();
  readonly labels = input.required<string[]>();
  readonly values = input.required<number[]>();
  readonly colors = input<string[]>([]);
  readonly datasetLabel = input('Tasks');
  readonly height = input(240);

  private readonly loadChart = inject(CHART_LOADER);
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly chart = signal<ChartInstance | null>(null);

  protected readonly ariaLabel = computed(
    () =>
      `${this.datasetLabel()} chart: ` +
      this.labels()
        .map((label, i) => `${label} ${this.values()[i] ?? 0}`)
        .join(', '),
  );

  private readonly data = computed<ChartData>(() => ({
    labels: this.labels(),
    datasets: [
      {
        label: this.datasetLabel(),
        data: this.values(),
        backgroundColor: this.colors(),
        borderWidth: this.type() === 'doughnut' ? 2 : 0,
        borderColor: '#fff',
        borderRadius: this.type() === 'bar' ? 4 : 0,
        maxBarThickness: 48,
      },
    ],
  }));

  constructor() {
    afterNextRender(async () => {
      const create = await this.loadChart();
      this.chart.set(create(this.canvas().nativeElement, this.buildConfig()));
    });

    effect(() => {
      const chart = this.chart();
      const data = this.data();
      if (!chart) return;
      chart.data = data;
      chart.update();
    });

    inject(DestroyRef).onDestroy(() => this.chart()?.destroy());
  }

  private buildConfig(): ChartConfiguration<SimpleChartType> {
    const isBar = this.type() === 'bar';
    return {
      type: this.type(),
      data: this.data() as ChartConfiguration<SimpleChartType>['data'],
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: prefersReducedMotion() ? 0 : 400 },
        plugins: {
          legend: {
            display: !isBar,
            position: 'bottom',
            labels: { usePointStyle: true, boxWidth: 8 },
          },
        },
        ...(isBar
          ? {
              scales: {
                y: { beginAtZero: true, ticks: { precision: 0 } },
                x: { grid: { display: false } },
              },
            }
          : { cutout: '65%' }),
      },
    };
  }
}
