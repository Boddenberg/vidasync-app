import { apiGetJson, apiPost } from './api';

export type NutritionGoalValues = {
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
};

export type NutritionGoalsStatus = {
  id: string | null;
  date: string;
  goals: NutritionGoalValues;
  goalInherited: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

type NutritionGoalsResponse = {
  nutritionGoals: NutritionGoalsStatus | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function asNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined) return null;

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function parseGoalValues(value: unknown): NutritionGoalValues {
  if (!isRecord(value)) {
    return {
      calories: null,
      protein: null,
      carbs: null,
      fat: null,
    };
  }

  return {
    calories: asNumberOrNull(value.calories),
    protein: asNumberOrNull(value.protein),
    carbs: asNumberOrNull(value.carbs),
    fat: asNumberOrNull(value.fat),
  };
}

function parseNutritionGoals(value: unknown): NutritionGoalsStatus | null {
  if (!isRecord(value)) return null;
  if (typeof value.date !== 'string') return null;

  return {
    id: typeof value.id === 'string' ? value.id : null,
    date: value.date,
    goals: parseGoalValues(value.goals),
    goalInherited: Boolean(value.goalInherited),
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : null,
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : null,
  };
}

function parseNutritionGoalsResponse(payload: unknown): NutritionGoalsStatus | null {
  if (!isRecord(payload)) return null;

  if ('nutritionGoals' in payload) {
    return parseNutritionGoals(payload.nutritionGoals);
  }

  return parseNutritionGoals(payload);
}

export async function getNutritionGoals(date: string): Promise<NutritionGoalsStatus | null> {
  const data = await apiGetJson<NutritionGoalsResponse>(
    `/nutrition-goals?date=${encodeURIComponent(date)}`,
  );
  return parseNutritionGoalsResponse(data);
}

export async function saveNutritionGoals(params: {
  date: string;
  caloriesGoal?: number;
  proteinGoal?: number;
  carbsGoal?: number;
  fatGoal?: number;
}): Promise<NutritionGoalsStatus> {
  const data = await apiPost<NutritionGoalsResponse | NutritionGoalsStatus>(
    '/nutrition-goals',
    params,
  );
  const nutritionGoals = parseNutritionGoalsResponse(data);

  if (!nutritionGoals) {
    throw new Error('Resposta invalida do endpoint /nutrition-goals');
  }

  return nutritionGoals;
}
