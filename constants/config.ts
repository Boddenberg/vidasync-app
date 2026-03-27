/*
 * Configuracoes globais do app.
 *
 * URLs e flags de integracao devem ficar centralizadas aqui.
 */

function normalizeBaseUrl(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

function normalizeOptionalBaseUrl(url?: string | null): string {
  const trimmed = `${url ?? ''}`.trim();
  if (!trimmed) return '';
  return normalizeBaseUrl(trimmed);
}

function normalizePath(path: string, fallback: string): string {
  const trimmed = path.trim();
  if (!trimmed) return fallback;
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

function normalizeOptionalPath(path?: string | null): string {
  const trimmed = `${path ?? ''}`.trim();
  if (!trimmed) return '';
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

const LOCAL_API_BASE_URL = 'http://localhost:8080';
const RAILWAY_API_BASE_URL = 'https://vidasync-bff-production.up.railway.app';
const isDevEnv = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';
const configuredBaseUrl = normalizeOptionalBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL);
const defaultBaseUrl = configuredBaseUrl || normalizeBaseUrl(isDevEnv ? LOCAL_API_BASE_URL : RAILWAY_API_BASE_URL);

/* URL base padrao do BFF (backend). */
export const API_BASE_URL = defaultBaseUrl;

/*
 * Bases opcionais para fluxos novos.
 * Se nao forem definidas, usam o mesmo BFF padrao.
 */
export const API_AUDIO_BASE_URL = normalizeBaseUrl(
  process.env.EXPO_PUBLIC_API_AUDIO_BASE_URL?.trim() || API_BASE_URL,
);
export const API_PLAN_BASE_URL = normalizeBaseUrl(
  process.env.EXPO_PUBLIC_API_PLAN_BASE_URL?.trim() || API_BASE_URL,
);
export const API_REVIEW_BASE_URL = normalizeBaseUrl(
  process.env.EXPO_PUBLIC_API_REVIEW_BASE_URL?.trim() || API_BASE_URL,
);

/*
 * Supabase publico para leituras client-side controladas por RLS.
 *
 * Usado pela dashboard de desenvolvedor para ler as avaliacoes
 * do LLM-as-a-judge diretamente do PostgREST.
 */
export const SUPABASE_URL = normalizeOptionalBaseUrl(process.env.EXPO_PUBLIC_SUPABASE_URL);
export const SUPABASE_ANON_KEY = `${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? ''}`.trim();
export const SUPABASE_JUDGE_TABLE =
  `${process.env.EXPO_PUBLIC_SUPABASE_JUDGE_TABLE ?? 'llm_judge_evaluations'}`.trim() ||
  'llm_judge_evaluations';
export const SUPABASE_JUDGE_FEATURE =
  `${process.env.EXPO_PUBLIC_SUPABASE_JUDGE_FEATURE ?? 'chat'}`.trim() || 'chat';
export const INTERNAL_ADMIN_JUDGE_FEATURE =
  `${process.env.EXPO_PUBLIC_INTERNAL_ADMIN_JUDGE_FEATURE ?? SUPABASE_JUDGE_FEATURE}`.trim() ||
  SUPABASE_JUDGE_FEATURE;
const supabaseJudgeLimitRaw = Number(process.env.EXPO_PUBLIC_SUPABASE_JUDGE_LIMIT ?? '50');
export const SUPABASE_JUDGE_LIMIT =
  Number.isFinite(supabaseJudgeLimitRaw) && supabaseJudgeLimitRaw > 0
    ? Math.min(Math.round(supabaseJudgeLimitRaw), 200)
    : 50;

/* Endpoint de audio para analise nutricional via BFF.
 * Ajuste conforme contrato ativo no backend.
 */
export const API_NUTRITION_AUDIO_PATH = normalizePath(
  process.env.EXPO_PUBLIC_API_NUTRITION_AUDIO_PATH?.trim() || '',
  '/nutrition/calories/audio',
);

/* Endpoint de PDF para analise de plano alimentar via BFF.
 * Ajuste conforme contrato ativo no backend.
 */
export const API_PLAN_PDF_PATH = normalizePath(
  process.env.EXPO_PUBLIC_API_PLAN_PDF_PATH?.trim() || '',
  '/plans/pdf/analyze',
);

/* Endpoint para confirmar/reenviar ajustes da revisao assistida no BFF.
 * Ajuste conforme contrato ativo do backend.
 */
export const API_REVIEW_CONFIRM_PATH = normalizePath(
  process.env.EXPO_PUBLIC_API_REVIEW_CONFIRM_PATH?.trim() || '',
  '/review/confirm',
);

/*
 * Upload opcional para converter arquivo local/base64 em URL publica.
 * Quando configurado, audio/PDF podem ser enviados como link para o backend.
 */
export const API_UPLOAD_BASE_URL = normalizeBaseUrl(
  API_BASE_URL,
);
export const API_UPLOAD_PATH = normalizeOptionalPath(
  process.env.EXPO_PUBLIC_API_UPLOAD_PATH?.trim(),
);

/*
 * true: exige referencia remota (URL ou fileKey) e falha se nao conseguir upload.
 * false: usa referencia remota quando possivel e cai para base64 como fallback.
 *
 * Padrao em branco/ausente: true (evita enviar base64 por engano quando
 * o backend espera link).
 */
const requireRemoteFileUrlRaw = process.env.EXPO_PUBLIC_API_REQUIRE_REMOTE_FILE_URL;
const requireRemoteFileUrlNormalized = `${requireRemoteFileUrlRaw ?? ''}`.trim().toLowerCase();
export const API_REQUIRE_REMOTE_FILE_URL =
  !requireRemoteFileUrlRaw || requireRemoteFileUrlNormalized.length === 0
    ? true
    : requireRemoteFileUrlNormalized === 'true';

/*
 * Chave opcional para painel interno/admin de feedback.
 *
 * Como roda no frontend, use apenas em builds internas controladas.
 */
export const INTERNAL_ADMIN_API_KEY = `${process.env.EXPO_PUBLIC_INTERNAL_ADMIN_API_KEY ?? ''}`.trim();
export const INTERNAL_ADMIN_USER_ID = `${process.env.EXPO_PUBLIC_INTERNAL_ADMIN_USER_ID ?? ''}`.trim();

/* Nome do app. */
export const APP_NAME = 'VidaSync';

/* Ano atual (footer e metadados visuais). */
export const APP_YEAR = 2026;
