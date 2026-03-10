/**
 * Contexto de autenticação do VidaSync
 *
 * Gerencia login, signup, logout e persistência do userId via AsyncStorage.
 * Todas as telas que precisam saber se o usuário está logado usam useAuth().
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { login as apiLogin, signup as apiSignup, updateProfile as apiUpdateProfile, SessionExpiredError } from '@/services/auth';
import type { AuthResponse, AuthUser } from '@/types/nutrition';

const STORAGE_KEY_USER_ID = '@vidasync:userId';
const STORAGE_KEY_USERNAME = '@vidasync:username';
const STORAGE_KEY_PROFILE_IMG = '@vidasync:profileImageUrl';
const STORAGE_KEY_ACCESS_TOKEN = '@vidasync:accessToken';
const FALLBACK_USERNAME = 'usuario';
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUuid(value: string | null | undefined): value is string {
  return !!value && UUID_REGEX.test(value.trim());
}

function asTrimmedString(value: unknown): string {
  return `${value ?? ''}`.trim();
}

type AuthState = {
  /** Usuário logado (null = não autenticado) */
  user: AuthUser | null;
  /** Ainda carregando do storage */
  loading: boolean;
  /** Faz login */
  login: (username: string, password: string) => Promise<void>;
  /** Cria conta */
  signup: (username: string, password: string, profileImage?: string | null) => Promise<void>;
  /** Atualiza perfil */
  updateProfile: (params: { username?: string; password?: string; profileImage?: string | null }) => Promise<void>;
  /** Desloga */
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  login: async () => {},
  signup: async () => {},
  updateProfile: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Restaura sessão do storage ao abrir o app
  useEffect(() => {
    (async () => {
      try {
        const rows = await AsyncStorage.multiGet([
          STORAGE_KEY_USER_ID,
          STORAGE_KEY_USERNAME,
          STORAGE_KEY_PROFILE_IMG,
          STORAGE_KEY_ACCESS_TOKEN,
        ]);

        const storedUserId = asTrimmedString(rows[0]?.[1]);
        const storedUsername = asTrimmedString(rows[1]?.[1]);
        const storedProfileImageUrl = asTrimmedString(rows[2]?.[1]) || null;
        const storedAccessToken = asTrimmedString(rows[3]?.[1]);

        if (isValidUuid(storedUserId)) {
          const usernameToUse = storedUsername || FALLBACK_USERNAME;
          // Evita derrubar sessao por username ausente em storage legado.
          if (!storedUsername) {
            await AsyncStorage.setItem(STORAGE_KEY_USERNAME, usernameToUse);
          }
          setUser({ userId: storedUserId, username: usernameToUse, profileImageUrl: storedProfileImageUrl });
        } else if (storedUserId || storedUsername || storedProfileImageUrl || storedAccessToken) {
          // Sessao antiga/corrompida: evita enviar X-User-Id invalido e quebrar endpoints.
          await AsyncStorage.multiRemove([
            STORAGE_KEY_USER_ID,
            STORAGE_KEY_USERNAME,
            STORAGE_KEY_PROFILE_IMG,
            STORAGE_KEY_ACCESS_TOKEN,
          ]);
          setUser(null);
        }
      } catch {
        // ignora erro de leitura
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persistUser = useCallback(async (u: AuthResponse) => {
    const row = u as AuthResponse & Record<string, unknown>;
    const userId = asTrimmedString(row.userId) || asTrimmedString(row.user_id);
    const username =
      asTrimmedString(row.username) ||
      asTrimmedString(row.user_name) ||
      FALLBACK_USERNAME;
    const profileImageUrl =
      asTrimmedString(row.profileImageUrl) ||
      asTrimmedString(row.profile_image_url) ||
      null;
    const accessToken =
      asTrimmedString(row.accessToken) ||
      asTrimmedString(row.access_token) ||
      '';

    if (!isValidUuid(userId)) {
      throw new Error('Sessao invalida recebida do servidor. Faca login novamente.');
    }

    await AsyncStorage.setItem(STORAGE_KEY_USER_ID, userId);
    await AsyncStorage.setItem(STORAGE_KEY_USERNAME, username);
    if (profileImageUrl) {
      await AsyncStorage.setItem(STORAGE_KEY_PROFILE_IMG, profileImageUrl);
    } else {
      await AsyncStorage.removeItem(STORAGE_KEY_PROFILE_IMG);
    }
    // Salva accessToken quando presente (login/signup)
    if (accessToken) {
      await AsyncStorage.setItem(STORAGE_KEY_ACCESS_TOKEN, accessToken);
    }
    setUser({ userId, username, profileImageUrl });
  }, []);

  const loginFn = useCallback(async (username: string, password: string) => {
    const data = await apiLogin({ username, password });
    await persistUser(data);
  }, [persistUser]);

  const signupFn = useCallback(async (username: string, password: string, profileImage?: string | null) => {
    const data = await apiSignup({ username, password, profileImage });
    await persistUser(data);
  }, [persistUser]);

  const updateProfileFn = useCallback(async (params: { username?: string; password?: string; profileImage?: string | null }) => {
    try {
      const data = await apiUpdateProfile(params);
      await persistUser(data);
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        // Limpa sessão local — o app vai redirecionar para login
        await AsyncStorage.multiRemove([STORAGE_KEY_USER_ID, STORAGE_KEY_USERNAME, STORAGE_KEY_PROFILE_IMG, STORAGE_KEY_ACCESS_TOKEN]);
        setUser(null);
      }
      throw err; // re-lança para o componente exibir a mensagem
    }
  }, [persistUser]);

  const logoutFn = useCallback(async () => {
    await AsyncStorage.multiRemove([STORAGE_KEY_USER_ID, STORAGE_KEY_USERNAME, STORAGE_KEY_PROFILE_IMG, STORAGE_KEY_ACCESS_TOKEN]);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login: loginFn, signup: signupFn, updateProfile: updateProfileFn, logout: logoutFn }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Hook para acessar o contexto de autenticação */
export function useAuth() {
  return useContext(AuthContext);
}

/** Retorna o userId atual (lê do AsyncStorage). Usado pelo api.ts */
export async function getStoredUserId(): Promise<string | null> {
  return AsyncStorage.getItem(STORAGE_KEY_USER_ID);
}

/** Retorna o accessToken atual (lê do AsyncStorage). Usado pelo auth.ts */
export async function getStoredAccessToken(): Promise<string | null> {
  return AsyncStorage.getItem(STORAGE_KEY_ACCESS_TOKEN);
}
