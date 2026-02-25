/**
 * Serviço de Refeições
 *
 * CRUD de refeições do dia + summary + range.
 * Cada função chama UMA rota do backend.
 */

import type {
    DeleteResponse,
    Meal,
    MealResponse,
    MealsListResponse,
    MealType,
    NutritionData,
    SummaryResponse,
} from '@/types/nutrition';
import { apiDelete, apiGetJson, apiPost, apiPut } from './api';

/** Busca o resumo do dia (refeicoes ordenadas por horario + totais) */
export async function getDaySummary(date: string): Promise<SummaryResponse> {
  return apiGetJson<SummaryResponse>(`/meals/summary?date=${date}`);
}

/** Busca refeições de um período (para calendário) */
export async function getMealsByRange(startDate: string, endDate: string): Promise<Meal[]> {
  const data = await apiGetJson<MealsListResponse>(
    `/meals/range?startDate=${startDate}&endDate=${endDate}`,
  );
  return data?.meals ?? [];
}

/** Salva uma nova refeição */
export async function createMeal(params: {
  foods: string;
  mealType: MealType;
  date: string;
  time?: string;
  nutrition?: NutritionData;
  image?: string;
}): Promise<Meal> {
  // Se a imagem já é uma URL (ex: vindo de favorito), envia como imageUrl
  // Se é base64, envia como image para o backend fazer upload
  const body: Record<string, unknown> = { ...params };
  if (params.image && params.image.startsWith('http')) {
    body.imageUrl = params.image;
    delete body.image;
  }
  const data = await apiPost<MealResponse>('/meals', body);
  return data.meal;
}

/** Edita uma refeição existente (campos parciais) */
export async function updateMeal(
  id: string,
  params: Partial<{
    foods: string;
    mealType: MealType;
    date: string;
    time: string;
    nutrition: NutritionData;
    image: string;
  }>,
): Promise<Meal> {
  // Se a imagem já é uma URL, envia como imageUrl para preservar
  const body: Record<string, unknown> = { ...params };
  if (params.image && params.image.startsWith('http')) {
    body.imageUrl = params.image;
    delete body.image;
  }
  const data = await apiPut<MealResponse>(`/meals/${id}`, body);
  return data.meal;
}

/** Apaga uma refeição */
export async function deleteMeal(id: string): Promise<boolean> {
  const data = await apiDelete<DeleteResponse>(`/meals/${id}`);
  return data?.success ?? false;
}

/** Duplica uma refeição existente */
export async function duplicateMeal(id: string): Promise<Meal> {
  const data = await apiPost<MealResponse>(`/meals/${id}/duplicate`, {});
  return data.meal;
}
