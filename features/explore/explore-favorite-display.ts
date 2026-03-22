import { parseFoodsToIngredients, splitFoodsAndDishName } from '@/utils/helpers';

const INLINE_INGREDIENTS_LIMIT = 3;
const INLINE_SUBTITLE_MAX_LENGTH = 38;

function formatIngredientCount(count: number) {
  return `${count} ${count === 1 ? 'ingrediente' : 'ingredientes'}`;
}

function buildInlineIngredientsLabel(ingredientNames: string[]) {
  const inlineLabel = ingredientNames.join(', ');
  if (
    ingredientNames.length <= INLINE_INGREDIENTS_LIMIT &&
    inlineLabel.length <= INLINE_SUBTITLE_MAX_LENGTH
  ) {
    return inlineLabel;
  }

  return formatIngredientCount(ingredientNames.length);
}

export function getFavoriteDisplayText(foods: string) {
  const normalizedFoods = foods.trim();
  const { dishName, ingredientsRaw } = splitFoodsAndDishName(normalizedFoods);
  const ingredientSource = ingredientsRaw || normalizedFoods;
  const ingredientNames = parseFoodsToIngredients(ingredientSource)
    .map((ingredient) => ingredient.name.trim())
    .filter(Boolean);

  if (dishName) {
    return {
      title: dishName,
      subtitle: ingredientNames.length > 0 ? buildInlineIngredientsLabel(ingredientNames) : '',
    };
  }

  if (ingredientNames.length === 0) {
    return {
      title: normalizedFoods,
      subtitle: '',
    };
  }

  return {
    title: ingredientNames[0],
    subtitle: ingredientNames.length > 1 ? formatIngredientCount(ingredientNames.length) : '',
  };
}
