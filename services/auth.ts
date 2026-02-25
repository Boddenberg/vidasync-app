/**
 * Serviço de Autenticação
 *
 * Signup, login e perfil do usuário.
 * Rotas públicas (sem X-User-Id).
 */

import { API_BASE_URL } from '@/constants/config';
import { getStoredUserId } from '@/hooks/use-auth';
import type { AuthResponse } from '@/types/nutrition';

/** Traduz erros comuns do backend para português */
function translateError(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes('email') && lower.includes('invalid')) return 'Nome de usuario invalido. Use apenas letras e numeros, comecando com uma letra.';
  if (lower.includes('already registered') || lower.includes('already exists')) return 'Esse nome de usuario ja esta em uso.';
  if (lower.includes('rate limit')) return 'Muitas tentativas. Aguarde um momento e tente novamente.';
  if (lower.includes('invalid login') || lower.includes('invalid credentials')) return 'Usuario ou senha incorretos.';
  if (lower.includes('user not found')) return 'Usuario nao encontrado.';
  return msg;
}

/** Cria uma conta nova */
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
  const text = await res.text();
  if (!res.ok) {
    let msg = `Erro ${res.status}`;
    try {
      const json = JSON.parse(text);
      msg = json.error || json.message || msg;
    } catch {
      msg = text || msg;
    }
    throw new Error(translateError(msg));
  }
  return JSON.parse(text) as AuthResponse;
}

/** Faz login */
export async function login(params: {
  username: string;
  password: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const text = await res.text();
  if (!res.ok) {
    let msg = `Erro ${res.status}`;
    try {
      const json = JSON.parse(text);
      msg = json.error || json.message || msg;
    } catch {
      msg = text || msg;
    }
    throw new Error(translateError(msg));
  }
  return JSON.parse(text) as AuthResponse;
}

/** Atualiza o perfil do usuario logado */
export async function updateProfile(params: {
  username?: string;
  password?: string;
  profileImage?: string | null;
}): Promise<AuthResponse> {
  const userId = await getStoredUserId();
  const res = await fetch(`${API_BASE_URL}/auth/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(userId ? { 'X-User-Id': userId } : {}),
    },
    body: JSON.stringify(params),
  });
  const text = await res.text();
  if (!res.ok) {
    let msg = `Erro ${res.status}`;
    try {
      const json = JSON.parse(text);
      msg = json.error || json.message || msg;
    } catch {
      msg = text || msg;
    }
    throw new Error(translateError(msg));
  }
  return JSON.parse(text) as AuthResponse;
}
