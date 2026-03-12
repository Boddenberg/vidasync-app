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
import { resolveRemoteFileUrl } from './file-url';

type CalorieResponseWire = {
  nutrition?: NutritionData | null;
  nome_prato_detectado?: string | null;
  nomePratoDetectado?: string | null;
  detectedDishName?: string | null;
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

type PhotoNutritionDraft = {
  dataUri: string;
  uri?: string;
  mimeType?: string;
  fileName?: string;
  sizeBytes?: number;
};

type PhotoAnalysisCacheEntry = {
  cachedAt: number;
  result: NutritionAnalysisResult;
};

const PHOTO_ANALYSIS_CACHE_TTL_MS = 20 * 60 * 1000;
const PHOTO_ANALYSIS_CACHE_LIMIT = 12;
const photoAnalysisCache = new Map<string, PhotoAnalysisCacheEntry>();

function hashString(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function resolvePhotoAnalysisCacheKey(input: string | PhotoNutritionDraft): string {
  const dataUri = typeof input === 'string' ? input : input.dataUri;
  const normalizedDataUri = `${dataUri}`.trim();
  return `photo:${normalizedDataUri.length}:${hashString(normalizedDataUri)}`;
}

function readPhotoAnalysisFromCache(cacheKey: string): NutritionAnalysisResult | null {
  const cached = photoAnalysisCache.get(cacheKey);
  if (!cached) return null;

  if (Date.now() - cached.cachedAt > PHOTO_ANALYSIS_CACHE_TTL_MS) {
    photoAnalysisCache.delete(cacheKey);
    return null;
  }

  return cached.result;
}

function savePhotoAnalysisInCache(cacheKey: string, result: NutritionAnalysisResult) {
  photoAnalysisCache.set(cacheKey, {
    cachedAt: Date.now(),
    result,
  });

  if (photoAnalysisCache.size > PHOTO_ANALYSIS_CACHE_LIMIT) {
    const oldestKey = photoAnalysisCache.keys().next().value;
    if (oldestKey) {
      photoAnalysisCache.delete(oldestKey);
    }
  }
}

function asWarnings(value?: string[] | null): string[] {
  return Array.isArray(value) ? value.filter((item) => !!item && item.trim().length > 0) : [];
}

function mimeTypeFromDataUri(dataUri: string, fallback = 'image/jpeg'): string {
  const matched = dataUri.match(/^data:([^;]+);base64,/i);
  const value = matched?.[1]?.trim();
  return value || fallback;
}

function normalizeMessageForMatch(rawMessage: string): string {
  return rawMessage
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function mapPhotoRequestErrorMessage(rawMessage: string): string {
  const normalized = normalizeMessageForMatch(rawMessage);
  const hasInvalidPhotoHint =
    normalized.includes('nao foi possivel identificar') ||
    normalized.includes('nao foi possivel detectar') ||
    (normalized.includes('comida') && normalized.includes('porcao'));

  if (hasInvalidPhotoHint) {
    return 'Nao foi possivel identificar comida/porcoes na foto. Tire outra foto com boa luz e enquadre o prato inteiro.';
  }

  if (
    normalized.includes('presign nao retornou uploadurl') ||
    normalized.includes('nao foi publicado no storage')
  ) {
    return 'Nao foi possivel publicar a imagem no storage. Tente novamente em alguns segundos.';
  }

  if (
    normalized.includes('bad request') ||
    normalized.includes('"status":400') ||
    normalized.includes(' status 400')
  ) {
    return 'Foto invalida para analise. Tire outra foto com boa luz e foco no prato.';
  }

  return rawMessage;
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
  const detectedDishName =
    `${response.nome_prato_detectado ?? response.nomePratoDetectado ?? response.detectedDishName ?? ''}`.trim() ||
    'meu prato';

  return {
    nutrition: response.nutrition,
    ingredients,
    detectedDishName,
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
export async function getNutritionFromPhoto(
  input: string | PhotoNutritionDraft,
): Promise<NutritionAnalysisResult> {
  try {
    const cacheKey = resolvePhotoAnalysisCacheKey(input);
    const cachedResult = readPhotoAnalysisFromCache(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    const dataUri = typeof input === 'string' ? input : input.dataUri;
    const localUri = typeof input === 'string' ? '' : `${input.uri ?? ''}`;
    const mimeType =
      typeof input === 'string'
        ? mimeTypeFromDataUri(dataUri)
        : `${input.mimeType ?? ''}`.trim() || mimeTypeFromDataUri(dataUri);
    const fileName =
      typeof input === 'string' ? 'photo.jpg' : `${input.fileName ?? ''}`.trim() || 'photo.jpg';

    const remoteFile = await resolveRemoteFileUrl({
      kind: 'photo',
      localUri: localUri || dataUri,
      dataUri,
      mimeType,
      fileName,
      sizeBytes: typeof input === 'string' ? undefined : input.sizeBytes,
    });

    if (!remoteFile.fileKey && !remoteFile.remoteUrl) {
      throw new Error(
        'Upload remoto da foto nao retornou file_key nem image_url para envio ao dominio.',
      );
    }

    if (!remoteFile.fileKey) {
      throw new Error(
        'Upload remoto da foto nao retornou file_key para envio ao dominio.',
      );
    }

    const payload = {
      file_key: remoteFile.fileKey,
    };
    const data = await apiPost<CalorieResponseWire>('/nutrition/calories', payload);
    const normalized = normalizeCalorieResponse(data);
    savePhotoAnalysisInCache(cacheKey, normalized);
    return normalized;
  } catch (err: any) {
    throw new Error(mapPhotoRequestErrorMessage(err?.message ?? 'Falha ao enviar foto.'));
  }
}
