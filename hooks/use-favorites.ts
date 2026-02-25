/**
 * Hook para gerenciar favoritos
 *
 * Centraliza o estado de favoritos: listar, adicionar, remover.
 */

import { useCallback, useEffect, useState } from 'react';

import { createFavorite, deleteFavorite, getFavorites } from '@/services/favorites';
import type { Favorite, NutritionData } from '@/types/nutrition';

export function useFavorites() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Carrega a lista de favoritos */
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await getFavorites();
      setFavorites(list);
    } catch (err: any) {
      setError(err?.message ?? 'Erro ao carregar favoritos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /** Adiciona favorito e retorna o objeto criado */
  const add = useCallback(
    async (foods: string, nutrition: NutritionData, imageBase64?: string | null): Promise<Favorite | null> => {
      try {
        const fav = await createFavorite({ foods, nutrition, imageBase64 });
        await refresh();
        return fav;
      } catch (err: any) {
        setError(err?.message ?? 'Erro ao favoritar');
        return null;
      }
    },
    [refresh],
  );

  /** Remove favorito */
  const remove = useCallback(
    async (id: string) => {
      try {
        await deleteFavorite(id);
        await refresh();
      } catch (err: any) {
        setError(err?.message ?? 'Erro ao remover favorito');
      }
    },
    [refresh],
  );

  return { favorites, loading, error, refresh, add, remove };
}
