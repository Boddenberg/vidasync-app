/**
 * Servico de autenticacao.
 *
 * Centraliza login, signup e alteracoes protegidas do perfil.
 */

import { API_BASE_URL } from '@/constants/config';
import { getStoredAccessToken, getStoredUserId, isValidUuid } from '@/hooks/use-auth';
import type { AuthResponse, PasswordUpdateResponse, ProfileIdentityResponse } from '@/types/nutrition';

export type UsernameAvailabilityResponse = {
  username: string;
  available: boolean;
  message?: string;
};

type AuthHeadersOptions = {
  includeContentType?: boolean;
};

export class SessionExpiredError extends Error {
  constructor() {
    super('Sessao expirada. Faca login novamente.');
    this.name = 'SessionExpiredError';
  }
}

function translateError(msg: string): string {
  const lower = msg.toLowerCase();

  if (lower.includes('email') && lower.includes('invalid')) {
    return 'Nome de usuario invalido. Use apenas letras e numeros, comecando com uma letra.';
  }
  if (lower.includes('already registered') || lower.includes('already exists') || lower.includes('already taken')) {
    return 'Esse nome de usuario ja esta em uso.';
  }
  if (lower.includes('username') && lower.includes('unavailable')) {
    return 'Esse nome de usuario ja esta em uso.';
  }
  if (lower.includes('rate limit')) {
    return 'Muitas tentativas. Aguarde um momento e tente novamente.';
  }
  if (lower.includes('invalid login') || lower.includes('invalid credentials')) {
    return 'Usuario ou senha incorretos.';
  }
  if (lower.includes('current password') && (lower.includes('invalid') || lower.includes('incorrect') || lower.includes('wrong'))) {
    return 'Senha atual incorreta.';
  }
  if (lower.includes('user not found')) {
    return 'Usuario nao encontrado.';
  }
  if (lower.includes('not allowed') || lower.includes('not permitted') || lower.includes('forbidden')) {
    return 'Operacao nao permitida. Tente novamente mais tarde.';
  }
  if (/^erro \d+$/.test(lower)) {
    return 'Erro no servidor. Tente novamente mais tarde.';
  }
  return msg;
}

async function buildAuthHeaders(options: AuthHeadersOptions = {}): Promise<Record<string, string>> {
  const userId = await getStoredUserId();
  const accessToken = await getStoredAccessToken();
  const headers: Record<string, string> = {};

  if (options.includeContentType !== false) {
    headers['Content-Type'] = 'application/json';
  }
  if (isValidUuid(userId)) {
    headers['X-User-Id'] = userId;
  }
  if (accessToken) {
    headers['X-Access-Token'] = accessToken;
  }

  return headers;
}

function parseErrorMessage(status: number, text: string): string {
  let message = `Erro ${status}`;

  try {
    const json = JSON.parse(text);
    message = json.error || json.message || message;
  } catch {
    message = text || message;
  }

  return translateError(message);
}

function parseJson<T>(text: string): T {
  if (!text.trim()) {
    return {} as T;
  }
  return JSON.parse(text) as T;
}

function ensureSession(res: Response) {
  if (res.status === 401 || res.status === 403) {
    throw new SessionExpiredError();
  }
}

async function readJsonResponse<T>(res: Response): Promise<T> {
  const text = await res.text();

  if (!res.ok) {
    ensureSession(res);
    throw new Error(parseErrorMessage(res.status, text));
  }

  return parseJson<T>(text);
}

export async function signup(params: {
  username: string;
  password: string;
  profileImage?: string | null;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  return readJsonResponse<AuthResponse>(res);
}

export async function login(params: {
  username: string;
  password: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  return readJsonResponse<AuthResponse>(res);
}

export async function updateProfile(params: {
  profileImage?: string | null;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/profile`, {
    method: 'PUT',
    headers: await buildAuthHeaders(),
    body: JSON.stringify(params),
  });

  return readJsonResponse<AuthResponse>(res);
}

export async function getProfile(): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/profile`, {
    method: 'GET',
    headers: await buildAuthHeaders({ includeContentType: false }),
  });

  const text = await res.text();

  if (!res.ok) {
    ensureSession(res);

    if (res.status === 404 || res.status === 405) {
      throw new Error('Endpoint de perfil ainda nao existe no backend.');
    }

    throw new Error(parseErrorMessage(res.status, text));
  }

  return parseJson<AuthResponse>(text);
}

export async function checkUsernameAvailability(username: string): Promise<UsernameAvailabilityResponse> {
  const normalizedUsername = username.trim();
  const res = await fetch(
    `${API_BASE_URL}/auth/profile/username/availability?username=${encodeURIComponent(normalizedUsername)}`,
    {
      method: 'GET',
      headers: await buildAuthHeaders({ includeContentType: false }),
    },
  );

  const text = await res.text();

  if (!res.ok) {
    ensureSession(res);

    if (res.status === 404 || res.status === 405) {
      throw new Error('Endpoint de disponibilidade de usuario ainda nao existe no backend.');
    }

    throw new Error(parseErrorMessage(res.status, text));
  }

  const data = parseJson<Partial<UsernameAvailabilityResponse>>(text);
  return {
    username: `${data.username ?? normalizedUsername}`.trim() || normalizedUsername,
    available: Boolean(data.available),
    message: data.message,
  };
}

export async function updateUsername(params: {
  username: string;
}): Promise<ProfileIdentityResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/profile/username`, {
    method: 'PUT',
    headers: await buildAuthHeaders(),
    body: JSON.stringify(params),
  });

  const text = await res.text();

  if (!res.ok) {
    ensureSession(res);

    if (res.status === 404 || res.status === 405) {
      throw new Error('Endpoint para alterar usuario ainda nao existe no backend.');
    }

    throw new Error(parseErrorMessage(res.status, text));
  }

  return parseJson<ProfileIdentityResponse>(text);
}

export async function updatePassword(params: {
  currentPassword: string;
  newPassword: string;
}): Promise<PasswordUpdateResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/profile/password`, {
    method: 'PUT',
    headers: await buildAuthHeaders(),
    body: JSON.stringify(params),
  });

  const text = await res.text();

  if (!res.ok) {
    ensureSession(res);

    if (res.status === 404 || res.status === 405) {
      throw new Error('Endpoint para alterar senha ainda nao existe no backend.');
    }

    throw new Error(parseErrorMessage(res.status, text));
  }

  return parseJson<PasswordUpdateResponse>(text);
}
