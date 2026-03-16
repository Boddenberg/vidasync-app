export const HYDRATION_GOAL_MIN_ML = 1000;
export const HYDRATION_GOAL_MAX_ML = 10000;
export const HYDRATION_GOAL_STEP_ML = 100;
export const HYDRATION_GOAL_DEFAULT_ML = 2000;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function normalizeHydrationGoalMl(value: number, fallback = HYDRATION_GOAL_DEFAULT_ML) {
  const safeValue = Number.isFinite(value) ? value : fallback;
  const steppedValue = Math.round(safeValue / HYDRATION_GOAL_STEP_ML) * HYDRATION_GOAL_STEP_ML;
  return clamp(steppedValue, HYDRATION_GOAL_MIN_ML, HYDRATION_GOAL_MAX_ML);
}

export function getHydrationGoalDraftMl(goalMl: number | null | undefined) {
  if (typeof goalMl !== 'number' || goalMl <= 0) {
    return HYDRATION_GOAL_DEFAULT_ML;
  }

  return normalizeHydrationGoalMl(goalMl);
}

export function hydrationGoalRatio(goalMl: number) {
  const normalizedGoal = normalizeHydrationGoalMl(goalMl);
  return (normalizedGoal - HYDRATION_GOAL_MIN_ML) / (HYDRATION_GOAL_MAX_ML - HYDRATION_GOAL_MIN_ML);
}

export function hydrationGoalFromRatio(ratio: number) {
  const safeRatio = clamp(ratio, 0, 1);
  const rawGoal = HYDRATION_GOAL_MIN_ML + safeRatio * (HYDRATION_GOAL_MAX_ML - HYDRATION_GOAL_MIN_ML);
  return normalizeHydrationGoalMl(rawGoal);
}
