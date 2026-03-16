import { describe, expect, it } from 'vitest';

import { sumNutritionData } from '@/utils/nutrition-math';

describe('sumNutritionData', () => {
  it('sums nutrition fields preserving expected units', () => {
    expect(
      sumNutritionData(
        {
          calories: '145 kcal',
          protein: '8g',
          carbs: '20g',
          fat: '3g',
        },
        {
          calories: '95 kcal',
          protein: '4g',
          carbs: '12g',
          fat: '1g',
        },
      ),
    ).toEqual({
      calories: '240 kcal',
      protein: '12g',
      carbs: '32g',
      fat: '4g',
    });
  });

  it('keeps one decimal place when the sum is fractional', () => {
    expect(
      sumNutritionData(
        {
          calories: '100.5 kcal',
          protein: '8.2g',
          carbs: '20g',
          fat: '3g',
        },
        {
          calories: '20 kcal',
          protein: '0.3g',
          carbs: '1.5g',
          fat: '0.2g',
        },
      ),
    ).toEqual({
      calories: '120.5 kcal',
      protein: '8.5g',
      carbs: '21.5g',
      fat: '3.2g',
    });
  });
});
