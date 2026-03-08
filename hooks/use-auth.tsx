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
        const userId = await AsyncStorage.getItem(STORAGE_KEY_USER_ID);
        const username = await AsyncStorage.getItem(STORAGE_KEY_USERNAME);
        if (userId && username) {
          const profileImageUrl = await AsyncStorage.getItem(STORAGE_KEY_PROFILE_IMG);
          setUser({ userId, username, profileImageUrl });
        }
      } catch {
        // ignora erro de leitura
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persistUser = useCallback(async (u: AuthResponse) => {
    await AsyncStorage.setItem(STORAGE_KEY_USER_ID, u.userId);
    await AsyncStorage.setItem(STORAGE_KEY_USERNAME, u.username);
    if (u.profileImageUrl) {
      await AsyncStorage.setItem(STORAGE_KEY_PROFILE_IMG, u.profileImageUrl);
    } else {
      await AsyncStorage.removeItem(STORAGE_KEY_PROFILE_IMG);
    }
    // Salva accessToken quando presente (login/signup)
    if (u.accessToken) {
      await AsyncStorage.setItem(STORAGE_KEY_ACCESS_TOKEN, u.accessToken);
    }
    setUser({ userId: u.userId, username: u.username, profileImageUrl: u.profileImageUrl });
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
