import Ionicons from '@expo/vector-icons/Ionicons';

import { Brand } from '@/constants/theme';
import type { AppNotification } from '@/services/notifications';
import type { NutritionGoalsStatus } from '@/services/nutrition-goals';
import type { Meal, MealType } from '@/types/nutrition';
import { extractNum, toDateStr, todayStr } from '@/utils/helpers';

export const HYDRATION_QUICK_ACTIONS = [
  { label: '+200 ml', deltaMl: 200, tone: 'positive' as const },
  { label: '+500 ml', deltaMl: 500, tone: 'positive' as const },
  { label: '-200 ml', deltaMl: -200, tone: 'negative' as const },
  { label: '-500 ml', deltaMl: -500, tone: 'negative' as const },
];

export const HOME_MACRO_TONES = {
  protein: { color: '#4D6CFA', bg: '#EEF2FF' },
  carbs: { color: '#F4A62A', bg: '#FFF4DD' },
  fat: { color: '#E45858', bg: '#FDEAEA' },
} as const;

export type GoalProgress = {
  key: 'calories' | 'protein' | 'carbs' | 'fat';
  label: string;
  unit: string;
  consumed: number;
  goal: number;
  remaining: number;
  progress: number;
  reached: boolean;
  color: string;
  bg: string;
};

export type MealSummary = {
  type: MealType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
  imageUrl: string | null;
  count: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

const MEAL_SUMMARY_META: Record<
  MealType,
  {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    bg: string;
  }
> = {
  breakfast: { label: 'Café da manhã', icon: 'sunny-outline', color: Brand.macroCarb, bg: '#FFF5E1' },
  lunch: { label: 'Almoço', icon: 'restaurant-outline', color: Brand.greenDark, bg: '#EAF8EE' },
  snack: { label: 'Lanche', icon: 'cafe-outline', color: Brand.coral, bg: '#FFF1EB' },
  dinner: { label: 'Jantar', icon: 'moon-outline', color: Brand.greenDark, bg: '#EEF8F1' },
  supper: { label: 'Ceia', icon: 'bed-outline', color: Brand.textSecondary, bg: '#F3F6F4' },
};

const MEAL_SUMMARY_ORDER: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner', 'supper'];

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function parseDateInput(date: string): Date {
  const [year, month, day] = date.split('-').map((item) => parseInt(item, 10));
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

export function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

export function isTodayDate(date: string): boolean {
  return date === todayStr();
}

export function formatCompactSelectedDate(date: string): string {
  const parsed = parseDateInput(date);
  const weekday = parsed.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
  const month = parsed.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');

  return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)}, ${parsed.getDate()} ${month}`;
}

export function formatHomeDateLabel(date: string): string {
  const parsed = parseDateInput(date);
  const shortDate = parsed.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'short',
  });
  const compactDate = shortDate.replace('.', '');

  if (isTodayDate(date)) {
    return `Hoje, ${compactDate}`;
  }

  if (date === shiftDate(todayStr(), -1)) {
    return `Ontem, ${compactDate}`;
  }

  const weekday = parsed.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
  return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)}, ${compactDate}`;
}

export function formatDateChip(date: string): string {
  if (isTodayDate(date)) return 'Hoje';
  return parseDateInput(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  });
}

export function formatDateForModal(date: string): string {
  return parseDateInput(date).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function shiftDate(date: string, days: number): string {
  const next = parseDateInput(date);
  next.setDate(next.getDate() + days);
  return toDateStr(next);
}

export function formatLiters(valueMl: number): string {
  return `${(valueMl / 1000).toFixed(1)}L`;
}

export function formatMetricValue(value: number, unit: string): string {
  return `${Number.isInteger(value) ? value : value.toFixed(1)}${unit}`;
}

function buildGoalProgress(
  key: GoalProgress['key'],
  label: string,
  unit: string,
  consumed: number,
  goal: number | null,
  color: string,
  bg: string,
): GoalProgress | null {
  if (goal === null || goal <= 0) return null;

  return {
    key,
    label,
    unit,
    consumed,
    goal,
    remaining: Math.max(0, goal - consumed),
    progress: clamp(consumed / goal, 0, 1),
    reached: consumed >= goal,
    color,
    bg,
  };
}

export function buildGoalItems(
  calories: number,
  protein: number,
  carbs: number,
  fat: number,
  goals: NutritionGoalsStatus | null,
): GoalProgress[] {
  return [
    buildGoalProgress('calories', 'Calorias', ' kcal', calories, goals?.goals.calories ?? null, Brand.greenDark, '#E7F6EC'),
    buildGoalProgress('protein', 'Proteína', 'g', protein, goals?.goals.protein ?? null, HOME_MACRO_TONES.protein.color, HOME_MACRO_TONES.protein.bg),
    buildGoalProgress('carbs', 'Carboidrato', 'g', carbs, goals?.goals.carbs ?? null, HOME_MACRO_TONES.carbs.color, HOME_MACRO_TONES.carbs.bg),
    buildGoalProgress('fat', 'Gordura', 'g', fat, goals?.goals.fat ?? null, HOME_MACRO_TONES.fat.color, HOME_MACRO_TONES.fat.bg),
  ].filter((item): item is GoalProgress => item !== null);
}

export function buildMealSummaries(meals: Meal[]): MealSummary[] {
  const buckets = new Map<MealType, MealSummary>();

  MEAL_SUMMARY_ORDER.forEach((type) => {
    const meta = MEAL_SUMMARY_META[type];
    buckets.set(type, {
      type,
      label: meta.label,
      icon: meta.icon,
      color: meta.color,
      bg: meta.bg,
      imageUrl: null,
      count: 0,
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    });
  });

  meals.forEach((meal) => {
    const bucket = buckets.get(meal.mealType);
    if (!bucket) return;

    bucket.count += 1;
    if (!bucket.imageUrl && meal.imageUrl) {
      bucket.imageUrl = meal.imageUrl;
    }
    bucket.calories += extractNum(meal.nutrition?.calories ?? '0');
    bucket.protein += extractNum(meal.nutrition?.protein ?? '0');
    bucket.carbs += extractNum(meal.nutrition?.carbs ?? '0');
    bucket.fat += extractNum(meal.nutrition?.fat ?? '0');
  });

  return MEAL_SUMMARY_ORDER.map((type) => buckets.get(type)!).filter((item) => item.count > 0);
}

export function sortNotifications(notifications: AppNotification[]): AppNotification[] {
  return [...notifications].sort((a, b) => {
    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();
    return bTime - aTime;
  });
}
