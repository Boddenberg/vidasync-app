/**
 * Serviço de Nutrição
 *
 * Tudo relacionado a nutrição, calorias, alimentos, etc.
 * Cada função chama UMA rota do backend.
 */

import type { NutritionData, NutritionResponse } from '@/types/nutrition';
import { apiPost } from './api';

/**
 * Consulta informações nutricionais de uma descrição de alimentos.
 *
 * @param foods - Texto descrevendo o que a pessoa comeu (ex: "uma paçoquinha")
 * @returns Objeto com calories, protein, carbs e fat
 */
export async function getNutrition(foods: string): Promise<NutritionData> {
  const data = await apiPost<NutritionResponse>('/nutrition/calories', { foods });

  if (data?.error) throw new Error(data.error);
  if (!data?.nutrition) throw new Error('Resposta inválida do servidor');

  return data.nutrition;
}
