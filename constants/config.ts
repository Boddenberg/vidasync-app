/*
 * Configuracoes globais do app.
 *
 * URLs e flags de integracao devem ficar centralizadas aqui.
 */

function normalizeBaseUrl(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
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

const defaultBaseUrl = normalizeBaseUrl('https://vidasync-bff-production.up.railway.app');

/* URL base padrao do BFF (backend). */
export const API_BASE_URL = normalizeBaseUrl(
  process.env.EXPO_PUBLIC_API_BASE_URL?.trim() || defaultBaseUrl,
);

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
  process.env.EXPO_PUBLIC_API_UPLOAD_BASE_URL?.trim() || API_BASE_URL,
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

/* Nome do app. */
export const APP_NAME = 'VidaSync';

/* Ano atual (footer e metadados visuais). */
export const APP_YEAR = 2026;
