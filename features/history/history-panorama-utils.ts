import type { PanoramaDataset, PanoramaDay, PanoramaMetric, PanoramaPeriod } from '@/services/progress-panorama';

export type PanoramaChartGranularity = 'daily' | 'weekly';

export type PanoramaDisplayPoint = {
  key: string;
  tickLabel: string;
  label: string;
  startDate: string;
  endDate: string;
  dayCount: number;
  daysWithRecords: number;
  waterMl: number;
  calories: number;
  mealsCount: number;
  hasAnyRecord: boolean;
};

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

function parsePanoramaDate(date: string): Date {
  const [year, month, day] = date.split('-').map((item) => parseInt(item, 10));
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

function formatShortMonth(date: string): string {
  return parsePanoramaDate(date).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
}

function capitalize(value: string): string {
  return value ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : value;
}

export function formatChartTick(date: string): string {
  const parsed = parsePanoramaDate(date);
  const shortMonth = formatShortMonth(date);
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

export function formatPanoramaDetailDate(date: string): string {
  const parsed = parsePanoramaDate(date);
  const weekday = parsed.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
  const shortMonth = formatShortMonth(date);
  return `${capitalize(weekday)}, ${String(parsed.getDate()).padStart(2, '0')} ${shortMonth}`;
}

export function formatPanoramaRangeLabel(startDate: string, endDate: string): string {
  if (startDate === endDate) {
    return formatPanoramaDetailDate(startDate);
  }

  return `${formatChartTick(startDate)} a ${formatChartTick(endDate)}`;
}

export function formatPanoramaMetricValue(value: number, metric: PanoramaMetric, compact = false): string {
  if (metric === 'water') {
    if (value >= 1000) {
      const liters = value / 1000;
      const precision = compact && liters >= 10 ? 0 : 1;
      return `${liters.toFixed(precision)}L`;
    }

    return compact ? `${Math.round(value)}ml` : `${Math.round(value)} ml`;
  }

  if (metric === 'calories') {
    if (compact && value >= 1000) {
      const scaled = value / 1000;
      const precision = scaled >= 10 || Number.isInteger(scaled) ? 0 : 1;
      return `${scaled.toFixed(precision)}k`;
    }

    return compact ? `${Math.round(value).toLocaleString('pt-BR')}` : `${Math.round(value).toLocaleString('pt-BR')} kcal`;
  }

  const rounded = value % 1 === 0 ? Math.round(value).toString() : value.toFixed(1).replace('.', ',');
  return compact ? rounded : `${rounded} ${Math.abs(value - 1) < 0.001 ? 'refeição' : 'refeições'}`;
}

export function getDefaultPanoramaGranularity(period: PanoramaPeriod): PanoramaChartGranularity {
  return period === 30 ? 'weekly' : 'daily';
}

export function buildPanoramaDisplayPoints(
  days: PanoramaDay[],
  granularity: PanoramaChartGranularity,
): PanoramaDisplayPoint[] {
  if (granularity === 'daily') {
    return days.map((day) => ({
      key: day.date,
      tickLabel: formatChartTick(day.date),
      label: formatPanoramaDetailDate(day.date),
      startDate: day.date,
      endDate: day.date,
      dayCount: 1,
      daysWithRecords: day.hasAnyRecord ? 1 : 0,
      waterMl: day.waterMl,
      calories: day.calories,
      mealsCount: day.mealsCount,
      hasAnyRecord: day.hasAnyRecord,
    }));
  }

  const points: PanoramaDisplayPoint[] = [];

  for (let index = 0; index < days.length; index += 7) {
    const chunk = days.slice(index, index + 7);
    if (chunk.length === 0) continue;

    const startDate = chunk[0].date;
    const endDate = chunk[chunk.length - 1].date;

    points.push({
      key: `${startDate}:${endDate}`,
      tickLabel: formatChartTick(startDate),
      label: formatPanoramaRangeLabel(startDate, endDate),
      startDate,
      endDate,
      dayCount: chunk.length,
      daysWithRecords: chunk.filter((day) => day.hasAnyRecord).length,
      waterMl: chunk.reduce((sum, day) => sum + day.waterMl, 0),
      calories: chunk.reduce((sum, day) => sum + day.calories, 0),
      mealsCount: chunk.reduce((sum, day) => sum + day.mealsCount, 0),
      hasAnyRecord: chunk.some((day) => day.hasAnyRecord),
    });
  }

  return points;
}

export function getDisplayPointValue(point: PanoramaDisplayPoint, metric: PanoramaMetric): number {
  if (metric === 'water') return point.waterMl;
  if (metric === 'calories') return point.calories;
  return point.mealsCount;
}

export function getPanoramaLabelStep(count: number, granularity: PanoramaChartGranularity): number {
  if (granularity === 'weekly') return 1;
  if (count <= 7) return 1;
  if (count <= 15) return 2;
  return 4;
}

export function buildPanoramaCompareInsight(days: PanoramaDay[], period: PanoramaPeriod): string {
  const waterDays = days.filter((day) => day.waterMl > 0).length;
  const mealDays = days.filter((day) => day.mealsCount > 0).length;
  const overlapDays = days.filter((day) => day.waterMl > 0 && day.mealsCount > 0).length;

  if (waterDays === 0 && mealDays === 0) {
    return `Sem registros de água ou refeições nos últimos ${period} dias.`;
  }

  if (overlapDays === 0) {
    return `Água apareceu em ${waterDays} de ${period} dias e refeições em ${mealDays}, mas ainda sem muitos dias com os dois registros juntos.`;
  }

  return `Água apareceu em ${waterDays} de ${period} dias, refeições em ${mealDays}, e os dois registros coincidiram em ${overlapDays} dias.`;
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
