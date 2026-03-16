import { describe, expect, it } from 'vitest';

import {
  HYDRATION_GOAL_DEFAULT_ML,
  HYDRATION_GOAL_MAX_ML,
  HYDRATION_GOAL_MIN_ML,
  getHydrationGoalDraftMl,
  hydrationGoalFromRatio,
  hydrationGoalRatio,
  normalizeHydrationGoalMl,
} from '@/utils/hydration';

describe('normalizeHydrationGoalMl', () => {
  it('clamps values below the minimum', () => {
    expect(normalizeHydrationGoalMl(400)).toBe(HYDRATION_GOAL_MIN_ML);
  });

  it('clamps values above the maximum', () => {
    expect(normalizeHydrationGoalMl(18000)).toBe(HYDRATION_GOAL_MAX_ML);
  });

  it('rounds to the nearest 100ml step', () => {
    expect(normalizeHydrationGoalMl(2449)).toBe(2400);
    expect(normalizeHydrationGoalMl(2451)).toBe(2500);
  });

  it('falls back to the default goal for invalid numbers', () => {
    expect(normalizeHydrationGoalMl(Number.NaN)).toBe(HYDRATION_GOAL_DEFAULT_ML);
  });
});

describe('getHydrationGoalDraftMl', () => {
  it('returns the default goal when there is no saved goal', () => {
    expect(getHydrationGoalDraftMl(0)).toBe(HYDRATION_GOAL_DEFAULT_ML);
    expect(getHydrationGoalDraftMl(null)).toBe(HYDRATION_GOAL_DEFAULT_ML);
  });

  it('normalizes an existing goal before using it in the slider', () => {
    expect(getHydrationGoalDraftMl(4060)).toBe(4100);
  });
});

describe('hydrationGoalRatio', () => {
  it('converts the current goal into slider progress', () => {
    expect(hydrationGoalRatio(HYDRATION_GOAL_MIN_ML)).toBe(0);
    expect(hydrationGoalRatio(HYDRATION_GOAL_MAX_ML)).toBe(1);
  });
});

describe('hydrationGoalFromRatio', () => {
  it('converts slider progress back into a normalized goal', () => {
    expect(hydrationGoalFromRatio(0)).toBe(HYDRATION_GOAL_MIN_ML);
    expect(hydrationGoalFromRatio(1)).toBe(HYDRATION_GOAL_MAX_ML);
    expect(hydrationGoalFromRatio(1 / 3)).toBe(4000);
  });

  it('clamps ratios outside the slider range', () => {
    expect(hydrationGoalFromRatio(-2)).toBe(HYDRATION_GOAL_MIN_ML);
    expect(hydrationGoalFromRatio(5)).toBe(HYDRATION_GOAL_MAX_ML);
  });
});
