import { InjectionToken } from '@angular/core';
import type { ChartConfiguration, ChartData, ChartType } from 'chart.js';

/** The subset of a Chart.js instance the app relies on (keeps tests free of canvas rendering). */
export interface ChartInstance {
  data: ChartData;
  update(): void;
  destroy(): void;
}

export type ChartFactory = (
  canvas: HTMLCanvasElement,
  config: ChartConfiguration<ChartType>,
) => ChartInstance;

/**
 * Lazily imports Chart.js the first time a chart is rendered, so the ~70 kB library lives
 * in its own chunk and is only downloaded on pages that display charts.
 */
export const CHART_LOADER = new InjectionToken<() => Promise<ChartFactory>>('CHART_LOADER', {
  providedIn: 'root',
  factory: () => async () => {
    const { Chart, registerables } = await import('chart.js');
    Chart.register(...registerables);
    return (canvas, config) => new Chart(canvas, config);
  },
});
