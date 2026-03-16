import type { NutritionData } from '@/types/nutrition';
import { extractNum } from '@/utils/helpers';

function formatNutritionValue(value: number, unit: 'kcal' | 'g') {
  const rounded = Math.round(value * 10) / 10;
  const display = Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(1);

  return unit === 'kcal' ? `${display} kcal` : `${display}g`;
}

export function sumNutritionData(base: NutritionData, increment: NutritionData): NutritionData {
  return {
    calories: formatNutritionValue(
      extractNum(base.calories) + extractNum(increment.calories),
      'kcal',
    ),
    protein: formatNutritionValue(extractNum(base.protein) + extractNum(increment.protein), 'g'),
    carbs: formatNutritionValue(extractNum(base.carbs) + extractNum(increment.carbs), 'g'),
    fat: formatNutritionValue(extractNum(base.fat) + extractNum(increment.fat), 'g'),
  };
}
