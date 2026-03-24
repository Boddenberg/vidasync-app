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

export function formatChartTick(date: string): string {
  const [year, month, day] = date.split('-').map((item) => parseInt(item, 10));
  const parsed = new Date(year, month - 1, day, 12, 0, 0, 0);
  const shortMonth = parsed.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
  return `${parsed.getDate()} ${shortMonth}`;
}

export function formatMetricPeakValue(value: number, metric: PanoramaMetric): string {
  if (metric === 'water') {
    return `${(value / 1000).toFixed(1)}L`;
  }

  if (metric === 'meals') {
    return `${Math.round(value)}`;
  }

  return `${Math.round(value)}`;
}

export function buildPanoramaInsight(days: PanoramaDay[], period: PanoramaPeriod, metric: PanoramaMetric): string {
  const daysWithRecords = getDaysWithRecords(days);

  if (daysWithRecords === 0) {
    return `Sem registros nos últimos ${period} dias. Quando você lançar água ou refeições, o panorama aparece aqui.`;
  }

  const consistencyRatio = daysWithRecords / period;
  const consistencyText =
    consistencyRatio >= 0.95
      ? 'Você registrou praticamente todos os dias deste período.'
      : consistencyRatio >= 0.6
        ? 'Você manteve registros em boa parte do período.'
        : 'Seus registros ainda aparecem em poucos dias deste período.';

  const peakDay = [...days].sort((a, b) => getMetricValue(b, metric) - getMetricValue(a, metric))[0];
  const peakValue = peakDay ? getMetricValue(peakDay, metric) : 0;

  if (!peakDay || peakValue <= 0) {
    return consistencyText;
  }

  const peakDateLabel = formatChartTick(peakDay.date);
  if (metric === 'water') {
    return `${consistencyText} Seu maior volume de água foi em ${peakDateLabel}, com ${formatMetricPeakValue(peakValue, metric)}.`;
  }

  if (metric === 'meals') {
    return `${consistencyText} O dia com mais refeições foi ${peakDateLabel}, com ${Math.round(peakValue)} ${Math.round(peakValue) === 1 ? 'registro' : 'registros'}.`;
  }

  return `${consistencyText} O pico de calorias registradas foi em ${peakDateLabel}, com ${Math.round(peakValue).toLocaleString('pt-BR')} kcal.`;
}
