/**
 * Cache local de imagens de refeicoes
 *
 * O backend nao retorna imageUrl nos endpoints de meals (summary/range).
 * Este modulo salva o mapeamento mealId -> imageUrl no AsyncStorage
 * para que as fotos aparecam na lista de refeicoes.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@vidasync:mealImages';

type MealImageCache = Record<string, string>;

let memoryCache: MealImageCache | null = null;

/** Carrega o cache do storage (com cache em memoria) */
async function loadCache(): Promise<MealImageCache> {
  if (memoryCache) return memoryCache;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    memoryCache = raw ? JSON.parse(raw) : {};
  } catch {
    memoryCache = {};
  }
  return memoryCache!;
}

/** Persiste o cache em storage */
async function saveCache(cache: MealImageCache): Promise<void> {
  memoryCache = cache;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // ignora erro de escrita
  }
}

/** Salva a imagem de uma refeicao no cache */
export async function cacheMealImage(mealId: string, imageUri: string): Promise<void> {
  const cache = await loadCache();
  cache[mealId] = imageUri;
  await saveCache(cache);
}

/** Retorna a imagem cacheada de uma refeicao (ou null) */
export async function getCachedMealImage(mealId: string): Promise<string | null> {
  const cache = await loadCache();
  return cache[mealId] ?? null;
}

/** Remove a imagem de uma refeicao do cache */
export async function removeCachedMealImage(mealId: string): Promise<void> {
  const cache = await loadCache();
  delete cache[mealId];
  await saveCache(cache);
}

/**
 * Injeta imageUrl do cache local em uma lista de meals.
 * Meals que ja possuem imageUrl do backend nao sao sobrescritos.
 */
export async function injectCachedImages(meals: Array<{ id: string; imageUrl: string | null }>): Promise<void> {
  const cache = await loadCache();
  for (const meal of meals) {
    if (!meal.imageUrl && cache[meal.id]) {
      meal.imageUrl = cache[meal.id];
    }
  }
}

/** Limpa imagens de meals que nao existem mais (garbage collection) */
export async function cleanupCache(activeMealIds: string[]): Promise<void> {
  const cache = await loadCache();
  const activeSet = new Set(activeMealIds);
  let changed = false;
  for (const id of Object.keys(cache)) {
    if (!activeSet.has(id)) {
      delete cache[id];
      changed = true;
    }
  }
  if (changed) await saveCache(cache);
}
