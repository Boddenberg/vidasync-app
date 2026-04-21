import type { PanoramaDay } from '@/services/progress-panorama';

export type ProgressStreak = {
  current: number;
  best: number;
  lastActiveDate: string | null;
};

export type ProgressScore = {
  overall: number; // 0..100
  consistency: number; // 0..100 - % dias com registros
  calories: number; // 0..100 - proximidade da meta
  hydration: number; // 0..100 - % dias atingindo meta
};

export type ProgressTrend = 'improving' | 'stable' | 'declining' | 'new';

export type HeatmapCell = {
  date: string;
  intensity: number; // 0..1
  score: number; // 0..100
  hasRecord: boolean;
  weekIndex: number;
  weekdayIndex: number;
};

export type MacroAverages = {
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
  waterMl: number;
};

export type MacroDistribution = {
  proteinPct: number;
  carbsPct: number;
  fatPct: number;
};

const KCAL_PER_G_PROTEIN = 4;
const KCAL_PER_G_CARBS = 4;
const KCAL_PER_G_FAT = 9;

export function parseDate(date: string): Date {
  const [year, month, day] = date.split('-').map((item) => parseInt(item, 10));
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

export function calcStreak(days: PanoramaDay[]): ProgressStreak {
  // days is ordered oldest to newest
  let best = 0;
  let running = 0;
  let lastActiveDate: string | null = null;

  days.forEach((day) => {
    if (day.hasAnyRecord) {
      running += 1;
      best = Math.max(best, running);
      lastActiveDate = day.date;
    } else {
      running = 0;
    }
  });

  // current streak: consecutive active days counting back from the last day
  let current = 0;
  for (let i = days.length - 1; i >= 0; i -= 1) {
    if (days[i].hasAnyRecord) {
      current += 1;
    } else {
      break;
    }
  }

  return { current, best, lastActiveDate };
}

export function calcMacroAverages(days: PanoramaDay[]): MacroAverages {
  const activeDays = days.filter((day) => day.hasAnyRecord);
  if (activeDays.length === 0) {
    return { protein: 0, carbs: 0, fat: 0, calories: 0, waterMl: 0 };
  }

  const sum = activeDays.reduce(
    (acc, day) => ({
      protein: acc.protein + day.protein,
      carbs: acc.carbs + day.carbs,
      fat: acc.fat + day.fat,
      calories: acc.calories + day.calories,
      waterMl: acc.waterMl + day.waterMl,
    }),
    { protein: 0, carbs: 0, fat: 0, calories: 0, waterMl: 0 },
  );

  return {
    protein: sum.protein / activeDays.length,
    carbs: sum.carbs / activeDays.length,
    fat: sum.fat / activeDays.length,
    calories: sum.calories / activeDays.length,
    waterMl: sum.waterMl / activeDays.length,
  };
}

export function calcMacroDistribution(averages: MacroAverages): MacroDistribution {
  const proteinKcal = averages.protein * KCAL_PER_G_PROTEIN;
  const carbsKcal = averages.carbs * KCAL_PER_G_CARBS;
  const fatKcal = averages.fat * KCAL_PER_G_FAT;
  const total = proteinKcal + carbsKcal + fatKcal;

  if (total <= 0) {
    return { proteinPct: 0, carbsPct: 0, fatPct: 0 };
  }

  return {
    proteinPct: proteinKcal / total,
    carbsPct: carbsKcal / total,
    fatPct: fatKcal / total,
  };
}

export function calcHydrationHitRate(days: PanoramaDay[]): {
  hits: number;
  totalWithGoal: number;
  rate: number;
} {
  const daysWithGoal = days.filter((day) => day.waterGoalMl > 0);
  const hits = daysWithGoal.filter((day) => day.waterGoalReached).length;

  return {
    hits,
    totalWithGoal: daysWithGoal.length,
    rate: daysWithGoal.length > 0 ? hits / daysWithGoal.length : 0,
  };
}

export function buildHeatmap(days: PanoramaDay[]): HeatmapCell[] {
  // Compute max calories to normalise intensity; fallback to waterMl for days without meals.
  const maxCalories = days.reduce((max, day) => Math.max(max, day.calories), 0);
  const maxWater = days.reduce((max, day) => Math.max(max, day.waterMl), 0);

  // First weekday of the earliest date (0=Sunday, 1=Monday, ... 6=Saturday)
  const firstDay = days[0];
  if (!firstDay) return [];

  const firstWeekday = parseDate(firstDay.date).getDay();

  return days.map((day, index) => {
    let intensity = 0;

    if (day.hasAnyRecord) {
      const caloriePart = maxCalories > 0 ? day.calories / maxCalories : 0;
      const waterPart = maxWater > 0 ? day.waterMl / maxWater : 0;
      const mealPart = Math.min(1, day.mealsCount / 4);
      intensity = Math.max(caloriePart * 0.55 + waterPart * 0.25 + mealPart * 0.2, 0.12);
    }

    const weekday = (firstWeekday + index) % 7;
    const weekIndex = Math.floor((firstWeekday + index) / 7);

    return {
      date: day.date,
      intensity: Math.min(1, intensity),
      score: Math.round(intensity * 100),
      hasRecord: day.hasAnyRecord,
      weekIndex,
      weekdayIndex: weekday,
    };
  });
}

export function calcTrend(days: PanoramaDay[]): ProgressTrend {
  const activeDays = days.filter((day) => day.hasAnyRecord);
  if (activeDays.length < 6) return 'new';

  const midpoint = Math.floor(days.length / 2);
  const firstHalf = days.slice(0, midpoint);
  const secondHalf = days.slice(midpoint);

  const firstHalfActive = firstHalf.filter((day) => day.hasAnyRecord).length;
  const secondHalfActive = secondHalf.filter((day) => day.hasAnyRecord).length;

  const firstRate = firstHalf.length > 0 ? firstHalfActive / firstHalf.length : 0;
  const secondRate = secondHalf.length > 0 ? secondHalfActive / secondHalf.length : 0;

  const delta = secondRate - firstRate;
  if (delta > 0.08) return 'improving';
  if (delta < -0.08) return 'declining';
  return 'stable';
}

export function calcBestDay(days: PanoramaDay[]): PanoramaDay | null {
  return days.reduce<PanoramaDay | null>((best, day) => {
    if (!day.hasAnyRecord) return best;
    const score = day.calories + day.waterMl / 10 + day.mealsCount * 50;
    const bestScore = best ? best.calories + best.waterMl / 10 + best.mealsCount * 50 : -1;
    return score > bestScore ? day : best;
  }, null);
}

export function calcOverallScore(
  days: PanoramaDay[],
  streak: ProgressStreak,
  hydrationHitRate: number,
): ProgressScore {
  const activeDays = days.filter((day) => day.hasAnyRecord).length;
  const total = days.length || 1;
  const consistency = (activeDays / total) * 100;

  // Calorie closeness to goal: if no goal, use consistency proxy.
  const consistencyNormalized = Math.min(100, consistency * 1.1);

  // Hydration: % of days hitting goal (relative). When no goal exists, use consistency.
  const hydration = hydrationHitRate > 0 ? hydrationHitRate * 100 : Math.min(100, (activeDays / total) * 80);

  // Streak bonus
  const streakBoost = Math.min(25, streak.current * 2.5);

  const overall = Math.min(
    100,
    Math.round(consistency * 0.5 + hydration * 0.3 + streakBoost),
  );

  return {
    overall,
    consistency: Math.round(consistency),
    calories: Math.round(consistencyNormalized),
    hydration: Math.round(hydration),
  };
}

export function scoreToTier(score: number): {
  label: string;
  color: string;
  description: string;
} {
  if (score >= 85) {
    return {
      label: 'Excelente',
      color: '#1FA750',
      description: 'Você está dominando seus hábitos. Continue assim!',
    };
  }
  if (score >= 65) {
    return {
      label: 'Muito bom',
      color: '#146C38',
      description: 'Consistência forte, pequenos ajustes e você brilha.',
    };
  }
  if (score >= 45) {
    return {
      label: 'No ritmo',
      color: '#F4A62A',
      description: 'Progresso firme. Vamos apertar a regularidade.',
    };
  }
  if (score >= 20) {
    return {
      label: 'Começando',
      color: '#FF7A59',
      description: 'Bom começo — aumente a frequência para evoluir.',
    };
  }
  return {
    label: 'Vamos lá',
    color: '#E45858',
    description: 'Registre seus dias para liberar insights poderosos.',
  };
}

export function formatDeltaPct(value: number): string {
  const pct = Math.round(value * 100);
  return `${pct > 0 ? '+' : ''}${pct}%`;
}

export function formatTrendLabel(trend: ProgressTrend): {
  label: string;
  color: string;
  icon: 'trending-up' | 'trending-down' | 'remove' | 'flash-outline';
} {
  if (trend === 'improving') return { label: 'Melhorando', color: '#1FA750', icon: 'trending-up' };
  if (trend === 'declining') return { label: 'Em queda', color: '#E45858', icon: 'trending-down' };
  if (trend === 'stable') return { label: 'Estável', color: '#2D9CDB', icon: 'remove' };
  return { label: 'Começando', color: '#F4A62A', icon: 'flash-outline' };
}

export function getWeekStart(date: string): string {
  const parsed = parseDate(date);
  const day = parsed.getDay();
  const diff = (day + 6) % 7; // segunda como início
  parsed.setDate(parsed.getDate() - diff);
  const y = parsed.getFullYear();
  const m = String(parsed.getMonth() + 1).padStart(2, '0');
  const d = String(parsed.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export type WeeklyBucket = {
  weekStart: string;
  daysActive: number;
  daysTotal: number;
  avgCalories: number;
  avgWaterMl: number;
  calorieTotal: number;
};

export function groupByWeek(days: PanoramaDay[]): WeeklyBucket[] {
  const map = new Map<string, WeeklyBucket>();

  days.forEach((day) => {
    const weekStart = getWeekStart(day.date);
    const bucket = map.get(weekStart) ?? {
      weekStart,
      daysActive: 0,
      daysTotal: 0,
      avgCalories: 0,
      avgWaterMl: 0,
      calorieTotal: 0,
    };

    bucket.daysTotal += 1;
    if (day.hasAnyRecord) {
      bucket.daysActive += 1;
      bucket.calorieTotal += day.calories;
      bucket.avgCalories += day.calories;
      bucket.avgWaterMl += day.waterMl;
    }

    map.set(weekStart, bucket);
  });

  return Array.from(map.values()).map((bucket) => ({
    ...bucket,
    avgCalories: bucket.daysActive > 0 ? bucket.avgCalories / bucket.daysActive : 0,
    avgWaterMl: bucket.daysActive > 0 ? bucket.avgWaterMl / bucket.daysActive : 0,
  }));
}
