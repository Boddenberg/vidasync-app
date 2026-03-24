import type { PanoramaDataset, PanoramaDay, PanoramaMetric, PanoramaPeriod } from '@/services/progress-panorama';

export function getPanoramaDays(dataset: PanoramaDataset | null, period: PanoramaPeriod): PanoramaDay[] {
  if (!dataset) return [];
  return dataset.days.slice(-period);
}

export function getDaysWithRecords(days: PanoramaDay[]): number {
  return days.filter((day) => day.hasAnyRecord).length;
}

export function getAverageWaterMl(days: PanoramaDay[]): number {
  if (days.length === 0) return 0;
  return days.reduce((sum, day) => sum + day.waterMl, 0) / days.length;
}

export function getAverageCalories(days: PanoramaDay[]): number {
  if (days.length === 0) return 0;
  return days.reduce((sum, day) => sum + day.calories, 0) / days.length;
}

export function getMetricValue(day: PanoramaDay, metric: PanoramaMetric): number {
  if (metric === 'water') return day.waterMl;
  if (metric === 'calories') return day.calories;
  return day.mealsCount;
}

export function formatWaterAverage(valueMl: number): string {
  return `${(valueMl / 1000).toFixed(1)}L`;
}

export function formatCaloriesAverage(value: number): string {
  return `${Math.round(value).toLocaleString('pt-BR')} kcal`;
}
