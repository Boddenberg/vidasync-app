/**
 * Servico de nutricao.
 *
 * Toda consulta de calorias do app passa por aqui.
 * Mantemos a normalizacao da resposta em um ponto unico para
 * evitar acoplamento da UI com variacoes de contrato da API.
 */

import type {
  NutritionAnalysisResult,
  NutritionCorrection,
  NutritionData,
  NutritionIngredientAnalysis,
} from '@/types/nutrition';
import { apiPost } from './api';

type CalorieResponseWire = {
  nutrition?: NutritionData | null;
  ingredients?: Array<{
    name?: string | null;
    nutrition?: NutritionData | null;
    cached?: boolean | null;
    precisa_revisao?: boolean | null;
    precisaRevisao?: boolean | null;
    warnings?: string[] | null;
    trace_id?: string | null;
    traceId?: string | null;
  }> | null;
  corrections?: Array<{ original?: string | null; corrected?: string | null }> | null;
  invalidItems?: string[] | null;
  error?: string | null;
  precisa_revisao?: boolean | null;
  precisaRevisao?: boolean | null;
  warnings?: string[] | null;
  trace_id?: string | null;
  traceId?: string | null;
};

function asWarnings(value?: string[] | null): string[] {
  return Array.isArray(value) ? value.filter((item) => !!item && item.trim().length > 0) : [];
}

/*
 * Normaliza a resposta do BFF para um formato consistente no app.
 *
 * O backend pode retornar snake_case ou camelCase dependendo da versao.
 * Esta normalizacao permite evolucao de contrato sem espalhar ifs na UI.
 */
export function normalizeCalorieResponse(response: CalorieResponseWire): NutritionAnalysisResult {
  if (response.error) {
    throw new Error(response.error);
  }

  if (!response.nutrition) {
    throw new Error('Resposta invalida do servidor');
  }

  const corrections: NutritionCorrection[] = (response.corrections ?? [])
    .filter((item) => !!item?.original && !!item?.corrected)
    .map((item) => ({
      original: item.original!.trim(),
      corrected: item.corrected!.trim(),
    }));

  const ingredients: NutritionIngredientAnalysis[] = (response.ingredients ?? [])
    .filter((item) => !!item?.nutrition)
    .map((item) => ({
      name: item?.name?.trim() || 'Ingrediente',
      nutrition: item.nutrition!,
      cached: Boolean(item.cached),
      precisaRevisao: Boolean(item.precisa_revisao ?? item.precisaRevisao),
      warnings: asWarnings(item.warnings),
      traceId: item.trace_id ?? item.traceId ?? null,
    }));

  return {
    nutrition: response.nutrition,
    ingredients,
    corrections,
    invalidItems: response.invalidItems ?? [],
    error: response.error ?? null,
    precisaRevisao: Boolean(response.precisa_revisao ?? response.precisaRevisao),
    warnings: asWarnings(response.warnings),
    traceId: response.trace_id ?? response.traceId ?? null,
  };
}

/**
 * Consulta informacoes nutricionais a partir de texto.
 */
export async function getNutrition(foods: string): Promise<NutritionData> {
  const data = await apiPost<CalorieResponseWire>('/nutrition/calories', { foods });
  const normalized = normalizeCalorieResponse(data);
  return normalized.nutrition;
}

/*
 * Envia foto para analise nutricional no BFF.
 *
 * O app continua falando com rota de dominio do BFF, sem acoplamento
 * com a camada de agentes. Caso o backend ainda nao suporte foto,
 * o erro retorna para UI com retry.
 */
export async function getNutritionFromPhoto(imageDataUri: string): Promise<NutritionAnalysisResult> {
  const data = await apiPost<CalorieResponseWire>('/nutrition/calories', {
    image: imageDataUri,
    imageBase64: imageDataUri,
    image_base64: imageDataUri,
  });

  return normalizeCalorieResponse(data);
}
