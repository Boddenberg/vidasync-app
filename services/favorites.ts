/**
 * Serviço de Favoritos
 *
 * Salva e lista alimentos favoritos para lançar rápido.
 * Envia a foto em base64 dentro do JSON.
 */

import type {
    DeleteResponse,
    Favorite,
    FavoriteResponse,
    FavoritesListResponse,
    NutritionData,
} from '@/types/nutrition';
import { apiDelete, apiGetJson, apiPost } from './api';

/** Lista todos os favoritos */
export async function getFavorites(): Promise<Favorite[]> {
  const data = await apiGetJson<FavoritesListResponse>('/favorites');
  return data?.favorites ?? [];
}

/** Adiciona um novo favorito (com foto opcional em base64) */
export async function createFavorite(params: {
  foods: string;
  nutrition: NutritionData;
  imageBase64?: string | null;
}): Promise<Favorite> {
  const data = await apiPost<FavoriteResponse>('/favorites', {
    foods: params.foods,
    nutrition: params.nutrition,
    image: params.imageBase64 ?? null,
  });
  return data.favorite;
}

/** Remove um favorito */
export async function deleteFavorite(id: string): Promise<boolean> {
  const data = await apiDelete<DeleteResponse>(`/favorites/${id}`);
  return data?.success ?? false;
}
