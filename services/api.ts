/**
 * Cliente HTTP base do VidaSync.
 *
 * Toda comunicação com o backend (BFF) passa por aqui.
 * Se um dia precisar trocar a URL, adicionar token, ou
 * mudar a forma de chamar a API, é SÓ AQUI que muda.
 *
 * Injeta automaticamente o header X-User-Id em todas as requests.
 */

import { API_BASE_URL } from '@/constants/config';
import { getStoredUserId } from '@/hooks/use-auth';

/** Monta os headers padrão (com X-User-Id se logado) */
async function authHeaders(extra?: Record<string, string>): Promise<Record<string, string>> {
  const headers: Record<string, string> = { ...extra };
  const userId = await getStoredUserId();
  if (userId) {
    headers['X-User-Id'] = userId;
  }
  return headers;
}

/**
 * Faz uma requisição GET e retorna o texto da resposta.
 */
export async function apiGet(path: string): Promise<string> {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE_URL}${path}`, { headers });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(body || `Erro ${res.status}`);
  }
  return res.text();
}

/**
 * Faz uma requisição GET e retorna JSON parseado.
 */
export async function apiGetJson<T = unknown>(path: string): Promise<T> {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE_URL}${path}`, { headers });
  const text = await res.text();
  if (!res.ok) throw new Error(text || `Erro ${res.status}`);
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as T;
  }
}

/**
 * Faz uma requisição POST com JSON e retorna a resposta parseada.
 */
export async function apiPost<T = unknown>(path: string, body: unknown): Promise<T> {
  const headers = await authHeaders({ 'Content-Type': 'application/json' });
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const text = await res.text();
  if (!res.ok) throw new Error(text || `Erro ${res.status}`);

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as T;
  }
}

/**
 * Faz uma requisição PUT com JSON e retorna a resposta parseada.
 */
export async function apiPut<T = unknown>(path: string, body: unknown): Promise<T> {
  const headers = await authHeaders({ 'Content-Type': 'application/json' });
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  });

  const text = await res.text();
  if (!res.ok) throw new Error(text || `Erro ${res.status}`);

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as T;
  }
}

/**
 * Faz uma requisição DELETE e retorna a resposta parseada.
 */
export async function apiDelete<T = unknown>(path: string): Promise<T> {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'DELETE',
    headers,
  });

  const text = await res.text();
  if (!res.ok) throw new Error(text || `Erro ${res.status}`);

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as T;
  }
}
