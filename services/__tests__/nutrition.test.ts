import { describe, expect, it } from 'vitest';

import { normalizeCalorieResponse } from '@/services/nutrition';

describe('normalizeCalorieResponse', () => {
  it('maps snake_case review fields', () => {
    const result = normalizeCalorieResponse({
      nutrition: {
        calories: '350 kcal',
        protein: '20g',
        carbs: '30g',
        fat: '10g',
      },
      precisa_revisao: true,
      warnings: ['quantidade aproximada'],
      trace_id: 'trace-123',
      ingredients: [
        {
          name: 'frango',
          nutrition: {
            calories: '200 kcal',
            protein: '25g',
            carbs: '0g',
            fat: '8g',
          },
          cached: false,
          precisa_revisao: true,
          warnings: ['estimado por foto'],
          trace_id: 'trace-ingredient-1',
        },
      ],
    });

    expect(result.precisaRevisao).toBe(true);
    expect(result.warnings).toEqual(['quantidade aproximada']);
    expect(result.traceId).toBe('trace-123');
    expect(result.ingredients[0].precisaRevisao).toBe(true);
    expect(result.ingredients[0].traceId).toBe('trace-ingredient-1');
  });

  it('supports camelCase fallback', () => {
    const result = normalizeCalorieResponse({
      nutrition: {
        calories: '120 kcal',
        protein: '3g',
        carbs: '20g',
        fat: '1g',
      },
      precisaRevisao: false,
      traceId: 'trace-camel',
    });

    expect(result.precisaRevisao).toBe(false);
    expect(result.traceId).toBe('trace-camel');
    expect(result.warnings).toEqual([]);
  });

  it('throws when API returns domain error', () => {
    expect(() =>
      normalizeCalorieResponse({
        error: 'falha de validacao',
      }),
    ).toThrow('falha de validacao');
  });
});
