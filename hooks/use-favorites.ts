/**
 * Hook para gerenciar favoritos
 *
 * Centraliza o estado de favoritos: listar, adicionar, editar e remover.
 */

import { useCallback, useEffect, useState } from 'react';

import {
  createFavorite,
  deleteFavorite,
  getFavorites,
  updateFavorite,
} from '@/services/favorites';
import type { Favorite, NutritionData } from '@/types/nutrition';

function shouldFallbackToLegacyUpdate(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const message = error.message.toLowerCase();
  return (
    message.includes('erro 404') ||
    message.includes('erro 405') ||
    message.includes('not found') ||
    message.includes('method not allowed')
  );
}

async function remoteImageToDataUri(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Nao foi possivel reutilizar a foto atual.');
  }
  const blob = await response.blob();

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Nao foi possivel reutilizar a foto atual.'));
    reader.onloadend = () => resolve(`${reader.result ?? ''}`);
    reader.readAsDataURL(blob);
  });
}

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
      setError(null);

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

  /** Atualiza favorito existente e preserva a foto atual quando necessario */
  const update = useCallback(
    async (id: string, foods: string, nutrition: NutritionData, imageBase64?: string | null): Promise<Favorite | null> => {
      setError(null);

      try {
        const fav = await updateFavorite(id, { foods, nutrition, imageBase64 });
        await refresh();
        return fav;
      } catch (err: any) {
        if (!shouldFallbackToLegacyUpdate(err)) {
          setError(err?.message ?? 'Erro ao atualizar favorito');
          return null;
        }

        try {
          const fallbackImage =
            typeof imageBase64 === 'string' && imageBase64.startsWith('http')
              ? await remoteImageToDataUri(imageBase64)
              : imageBase64;

          const created = await createFavorite({ foods, nutrition, imageBase64: fallbackImage });
          const removed = await deleteFavorite(id);
          if (!removed) {
            throw new Error('Erro ao atualizar favorito');
          }
          await refresh();
          return created;
        } catch (legacyErr: any) {
          setError(legacyErr?.message ?? 'Erro ao atualizar favorito');
          return null;
        }
      }
    },
    [refresh],
  );

  /** Remove favorito */
  const remove = useCallback(
    async (id: string) => {
      setError(null);

      try {
        await deleteFavorite(id);
        await refresh();
      } catch (err: any) {
        setError(err?.message ?? 'Erro ao remover favorito');
      }
    },
    [refresh],
  );

  return { favorites, loading, error, refresh, add, update, remove };
}
