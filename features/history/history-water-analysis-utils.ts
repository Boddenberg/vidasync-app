import type { WaterStatus } from '@/services/water';
import { toDateStr } from '@/utils/helpers';

export type WaterAnalysisPeriod = 7 | 15 | 30 | 90;

export type WaterAnalysisGranularity = 'daily' | 'weekly_average';

export type WaterAnalysisDay = {
  date: string;
  consumedMl: number;
  goalMl: number;
  hasRecord: boolean;
  goalReached: boolean;
  eventCount: number;
};

export type WaterAnalysisPoint = {
  key: string;
  label: string;
  tickLabel: string;
  startDate: string;
  endDate: string;
  dayCount: number;
  totalMl: number;
  averageMl: number;
  displayMl: number;
  goalMl: number;
  recordDays: number;
  goalHitDays: number;
  percentageOfGoal: number | null;
};

export type WaterInsightRow = {
  label: string;
  value: string;
  hint: string;
};

export type WaterAnalysisModel = {
  period: WaterAnalysisPeriod;
  granularity: WaterAnalysisGranularity;
  endDate: string;
  days: WaterAnalysisDay[];
  points: WaterAnalysisPoint[];
  referenceGoalMl: number;
  averageDailyMl: number;
  totalMl: number;
  daysHitGoal: number;
  daysWithRecord: number;
  bestRecordStreak: number;
  highestDay: WaterAnalysisDay | null;
};

function parseDate(date: string): Date {
  const [year, month, day] = date.split('-').map((item) => parseInt(item, 10));
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

function shiftDate(date: string, days: number): string {
  const next = parseDate(date);
  next.setDate(next.getDate() + days);
  return toDateStr(next);
}

function buildDateRange(endDate: string, totalDays: number): string[] {
  return Array.from({ length: totalDays }, (_value, index) => shiftDate(endDate, index - (totalDays - 1)));
}

function formatShortMonth(date: string): string {
  return parseDate(date).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
}

export function formatWaterAnalysisDate(date: string): string {
  const parsed = parseDate(date);
  return `${parsed.getDate()} ${formatShortMonth(date)}`;
}

export function formatWaterAnalysisRange(startDate: string, endDate: string): string {
  if (startDate === endDate) {
    return formatWaterAnalysisDate(startDate);
  }

  return `${formatWaterAnalysisDate(startDate)} a ${formatWaterAnalysisDate(endDate)}`;
}

export function formatWaterAmount(valueMl: number, compact = false): string {
  if (valueMl >= 1000) {
    const liters = valueMl / 1000;
    const rounded = liters >= 10 ? Math.round(liters) : Math.round(liters * 10) / 10;
    const value = rounded.toLocaleString('pt-BR', {
      minimumFractionDigits: Number.isInteger(rounded) ? 0 : 1,
      maximumFractionDigits: 1,
    });

    return `${value}${compact ? 'L' : ' L'}`;
  }

  const value = Math.round(valueMl).toLocaleString('pt-BR');
  return `${value}${compact ? 'ml' : ' ml'}`;
}

function getGranularity(period: WaterAnalysisPeriod): WaterAnalysisGranularity {
  return period === 90 ? 'weekly_average' : 'daily';
}

function resolveReferenceGoalMl(days: WaterAnalysisDay[]): number {
  for (let index = days.length - 1; index >= 0; index -= 1) {
    if (days[index].goalMl > 0) {
      return days[index].goalMl;
    }
  }

  return 0;
}

function normalizeWaterDays(sourceDays: WaterStatus[], endDate: string, totalDays: number): WaterAnalysisDay[] {
  const sourceMap = new Map(sourceDays.map((day) => [day.date, day]));

  return buildDateRange(endDate, totalDays).map((date) => {
    const source = sourceMap.get(date);
    const consumedMl = Math.max(0, Math.round(source?.consumedMl ?? 0));
    const goalMl = Math.max(0, Math.round(source?.goalMl ?? 0));
    const eventCount = source?.events.length ?? 0;
    const hasRecord = consumedMl > 0 || eventCount > 0;

    return {
      date,
      consumedMl,
      goalMl,
      hasRecord,
      goalReached: goalMl > 0 ? consumedMl >= goalMl : false,
      eventCount,
    };
  });
}

function buildDailyPoints(days: WaterAnalysisDay[], referenceGoalMl: number): WaterAnalysisPoint[] {
  return days.map((day) => {
    const goalMl = day.goalMl > 0 ? day.goalMl : referenceGoalMl;

    return {
      key: day.date,
      label: formatWaterAnalysisDate(day.date),
      tickLabel: formatWaterAnalysisDate(day.date),
      startDate: day.date,
      endDate: day.date,
      dayCount: 1,
      totalMl: day.consumedMl,
      averageMl: day.consumedMl,
      displayMl: day.consumedMl,
      goalMl,
      recordDays: day.hasRecord ? 1 : 0,
      goalHitDays: day.goalReached ? 1 : 0,
      percentageOfGoal: goalMl > 0 ? (day.consumedMl / goalMl) * 100 : null,
    };
  });
}

function buildWeeklyAveragePoints(days: WaterAnalysisDay[], referenceGoalMl: number): WaterAnalysisPoint[] {
  const points: WaterAnalysisPoint[] = [];

  for (let index = 0; index < days.length; index += 7) {
    const chunk = days.slice(index, index + 7);
    if (chunk.length === 0) continue;

    const startDate = chunk[0].date;
    const endDate = chunk[chunk.length - 1].date;
    const totalMl = chunk.reduce((sum, day) => sum + day.consumedMl, 0);
    const averageMl = totalMl / chunk.length;
    const goals = chunk.filter((day) => day.goalMl > 0).map((day) => day.goalMl);
    const goalMl = goals.length > 0 ? goals.reduce((sum, value) => sum + value, 0) / goals.length : referenceGoalMl;
    const recordDays = chunk.filter((day) => day.hasRecord).length;
    const goalHitDays = chunk.filter((day) => day.goalReached).length;

    points.push({
      key: `${startDate}:${endDate}`,
      label: formatWaterAnalysisRange(startDate, endDate),
      tickLabel: formatWaterAnalysisDate(startDate),
      startDate,
      endDate,
      dayCount: chunk.length,
      totalMl,
      averageMl,
      displayMl: averageMl,
      goalMl,
      recordDays,
      goalHitDays,
      percentageOfGoal: goalMl > 0 ? (averageMl / goalMl) * 100 : null,
    });
  }

  return points;
}

function getBestRecordStreak(days: WaterAnalysisDay[]): number {
  let best = 0;
  let current = 0;

  days.forEach((day) => {
    if (day.hasRecord) {
      current += 1;
      best = Math.max(best, current);
      return;
    }

    current = 0;
  });

  return best;
}

export function buildWaterAnalysisModel(
  sourceDays: WaterStatus[],
  endDate: string,
  period: WaterAnalysisPeriod,
): WaterAnalysisModel {
  const days = normalizeWaterDays(sourceDays, endDate, period);
  const granularity = getGranularity(period);
  const referenceGoalMl = resolveReferenceGoalMl(days);
  const points =
    granularity === 'daily' ? buildDailyPoints(days, referenceGoalMl) : buildWeeklyAveragePoints(days, referenceGoalMl);
  const totalMl = days.reduce((sum, day) => sum + day.consumedMl, 0);
  const averageDailyMl = days.length > 0 ? totalMl / days.length : 0;
  const daysHitGoal = days.filter((day) => day.goalReached).length;
  const daysWithRecord = days.filter((day) => day.hasRecord).length;
  const highestDay =
    days.length > 0 ? [...days].sort((left, right) => right.consumedMl - left.consumedMl)[0] ?? null : null;

  return {
    period,
    granularity,
    endDate,
    days,
    points,
    referenceGoalMl,
    averageDailyMl,
    totalMl,
    daysHitGoal,
    daysWithRecord,
    bestRecordStreak: getBestRecordStreak(days),
    highestDay: highestDay && highestDay.consumedMl > 0 ? highestDay : null,
  };
}

export function buildWaterInsightRows(model: WaterAnalysisModel): WaterInsightRow[] {
  const highestDayValue = model.highestDay
    ? `${formatWaterAmount(model.highestDay.consumedMl)} em ${formatWaterAnalysisDate(model.highestDay.date)}`
    : 'Sem pico no periodo';
  const highestDayHint = model.highestDay
    ? 'Foi o dia com maior volume registrado.'
    : 'Nenhum dia teve consumo acima de zero.';
  const goalValue = model.referenceGoalMl > 0 ? `${model.daysHitGoal} de ${model.period} dias` : '--';
  const goalHint =
    model.referenceGoalMl > 0
      ? 'Dias em que o consumo ficou na meta ou acima dela.'
      : 'Defina uma meta diaria para acompanhar esse indicador.';
  const streakValue = model.bestRecordStreak === 1 ? '1 dia' : `${model.bestRecordStreak} dias`;

  return [
    {
      label: 'Maior volume',
      value: highestDayValue,
      hint: highestDayHint,
    },
    {
      label: 'Media diaria',
      value: formatWaterAmount(model.averageDailyMl),
      hint: 'Calculada sobre todos os dias do periodo, inclusive os vazios.',
    },
    {
      label: 'Dias com registro',
      value: `${model.daysWithRecord} de ${model.period} dias`,
      hint: 'Conta dias com consumo ou algum ajuste de agua.',
    },
    {
      label: 'Acima da meta',
      value: goalValue,
      hint: goalHint,
    },
    {
      label: 'Melhor sequencia',
      value: streakValue,
      hint: 'Maior quantidade de dias seguidos com registro.',
    },
  ];
}
