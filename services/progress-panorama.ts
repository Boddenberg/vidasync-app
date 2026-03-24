import { getMealsByRange } from '@/services/meals';
import { getWaterHistory } from '@/services/water';
import { extractNum, toDateStr } from '@/utils/helpers';

export type PanoramaPeriod = 7 | 15 | 30;

export type PanoramaMetric = 'water' | 'calories' | 'meals';

export type PanoramaDay = {
  date: string;
  waterMl: number;
  calories: number;
  mealsCount: number;
  hasAnyRecord: boolean;
};

export type PanoramaDataset = {
  endDate: string;
  totalDays: number;
  source: 'local';
  days: PanoramaDay[];
};

function shiftDateByDays(date: string, days: number): string {
  const [year, month, day] = date.split('-').map((item) => parseInt(item, 10));
  const next = new Date(year, month - 1, day, 12, 0, 0, 0);
  next.setDate(next.getDate() + days);
  return toDateStr(next);
}

function buildDayRange(endDate: string, totalDays: number): string[] {
  return Array.from({ length: totalDays }, (_value, index) => shiftDateByDays(endDate, index - (totalDays - 1)));
}

export async function getProgressPanorama(endDate: string, totalDays = 30): Promise<PanoramaDataset> {
  const safeTotalDays = Math.max(1, Math.min(30, totalDays));
  const startDate = shiftDateByDays(endDate, -(safeTotalDays - 1));
  const [meals, waterHistory] = await Promise.all([
    getMealsByRange(startDate, endDate),
    getWaterHistory(startDate, endDate),
  ]);

  const daysMap = new Map<string, PanoramaDay>();
  buildDayRange(endDate, safeTotalDays).forEach((date) => {
    daysMap.set(date, {
      date,
      waterMl: 0,
      calories: 0,
      mealsCount: 0,
      hasAnyRecord: false,
    });
  });

  meals.forEach((meal) => {
    const bucket = daysMap.get(meal.date);
    if (!bucket) return;

    bucket.mealsCount += 1;
    bucket.calories += extractNum(meal.nutrition?.calories ?? '0');
    bucket.hasAnyRecord = true;
  });

  waterHistory.days.forEach((waterDay) => {
    const bucket = daysMap.get(waterDay.date);
    if (!bucket) return;

    const waterMl = Math.max(0, Math.round(waterDay.consumedMl));
    const hasWaterRecord = waterDay.events.length > 0 || waterDay.consumedMl > 0;

    bucket.waterMl = waterMl;
    bucket.hasAnyRecord = bucket.hasAnyRecord || hasWaterRecord;
  });

  return {
    endDate,
    totalDays: safeTotalDays,
    source: 'local',
    days: Array.from(daysMap.values()),
  };
}
