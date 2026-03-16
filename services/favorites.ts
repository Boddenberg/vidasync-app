/**
 * Servico de Favoritos
 *
 * Salva e lista alimentos favoritos para lancar rapido.
 * Envia a foto em base64 dentro do JSON.
 */

import type {
    DeleteResponse,
    Favorite,
    FavoriteResponse,
    FavoritesListResponse,
    NutritionData,
} from '@/types/nutrition';
import { apiDelete, apiGetJson, apiPost, apiPut } from './api';

function buildFavoriteBody(params: {
  foods: string;
  nutrition: NutritionData;
  imageBase64?: string | null;
  omitImageWhenUndefined?: boolean;
}): Record<string, unknown> {
  const body: Record<string, unknown> = {
    foods: params.foods,
    nutrition: params.nutrition,
  };

  if (params.imageBase64 === undefined && params.omitImageWhenUndefined) {
    return body;
  }

  if (params.imageBase64 && params.imageBase64.startsWith('http')) {
    body.imageUrl = params.imageBase64;
    return body;
  }

  body.image = params.imageBase64;
  return body;
}

/** Lista todos os favoritos */
export async function getFavorites(): Promise<Favorite[]> {
  const data = await apiGetJson<FavoritesListResponse>('/favorites');
  return data?.favorites ?? [];
}

/** Adiciona um novo favorito (com foto opcional em base64 ou URL existente) */
export async function createFavorite(params: {
  foods: string;
  nutrition: NutritionData;
  imageBase64?: string | null;
}): Promise<Favorite> {
  const data = await apiPost<FavoriteResponse>(
    '/favorites',
    buildFavoriteBody({ ...params, omitImageWhenUndefined: false }),
  );
  return data.favorite;
}

/** Atualiza um favorito existente */
export async function updateFavorite(
  id: string,
  params: {
    foods: string;
    nutrition: NutritionData;
    imageBase64?: string | null;
  },
): Promise<Favorite> {
  const data = await apiPut<FavoriteResponse>(
    `/favorites/${id}`,
    buildFavoriteBody({ ...params, omitImageWhenUndefined: true }),
  );
  return data.favorite;
}

/** Remove um favorito */
export async function deleteFavorite(id: string): Promise<boolean> {
  const data = await apiDelete<DeleteResponse>(`/favorites/${id}`);
  return data?.success ?? false;
}
