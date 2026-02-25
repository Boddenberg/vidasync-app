/**
 * Hook para gerenciar refeicoes do dia
 *
 * Usa o endpoint /meals/summary para ter refeicoes + totais do backend.
 * Injeta imagens do cache local (o backend nao retorna imageUrl no summary).
 */

import { useCallback, useEffect, useState } from 'react';

import {
    cacheMealImage,
    injectCachedImages,
    removeCachedMealImage,
} from '@/services/meal-image-cache';
import {
    createMeal,
    deleteMeal,
    duplicateMeal,
    getDaySummary,
    updateMeal,
} from '@/services/meals';
import type { Meal, MealType, NutritionData } from '@/types/nutrition';
import { nowTimeStr, todayStr } from '@/utils/helpers';

export function useMeals() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [totals, setTotals] = useState<NutritionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [date, setDate] = useState(todayStr);

  /** Carrega o resumo do dia (refeições ordenadas + totais) */
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const summary = await getDaySummary(date);
      const mealsData = summary.meals ?? [];
      // Backend nao retorna imageUrl no summary — injeta do cache local
      await injectCachedImages(mealsData);
      setMeals(mealsData);
      setTotals(summary.totals ?? null);
    } catch (err: any) {
      setError(err?.message ?? 'Erro ao carregar refeições');
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /** Adiciona uma refeição */
  const add = useCallback(
    async (
      foods: string,
      mealType: MealType,
      nutrition: NutritionData,
      time?: string,
      mealDate?: string,
      imageBase64?: string | null,
    ) => {
      try {
        const meal = await createMeal({
          foods,
          mealType,
          date: mealDate || date,
          time: time || nowTimeStr(),
          nutrition,
          image: imageBase64 || undefined,
        });
        // Salva imagem no cache local (backend nao retorna imageUrl no summary)
        if (imageBase64 && meal?.id) {
          await cacheMealImage(meal.id, imageBase64);
        }
        await refresh();
      } catch (err: any) {
        setError(err?.message ?? 'Erro ao salvar refeição');
      }
    },
    [date, refresh],
  );

  /** Edita uma refeição (campos parciais) */
  const edit = useCallback(
    async (id: string, params: Partial<{
      foods: string;
      mealType: MealType;
      date: string;
      time: string;
      nutrition: NutritionData;
    }>) => {
      try {
        await updateMeal(id, params);
        await refresh();
      } catch (err: any) {
        setError(err?.message ?? 'Erro ao editar refeição');
      }
    },
    [refresh],
  );

  /** Apaga uma refeição */
  const remove = useCallback(
    async (id: string) => {
      try {
        await deleteMeal(id);
        await removeCachedMealImage(id);
        await refresh();
      } catch (err: any) {
        setError(err?.message ?? 'Erro ao apagar refeição');
      }
    },
    [refresh],
  );

  /** Duplica uma refeição */
  const duplicate = useCallback(
    async (id: string) => {
      try {
        await duplicateMeal(id);
        await refresh();
      } catch (err: any) {
        setError(err?.message ?? 'Erro ao duplicar refeição');
      }
    },
    [refresh],
  );

  return { meals, totals, loading, error, date, setDate, refresh, add, edit, remove, duplicate };
}
