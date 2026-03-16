/**
 * Contexto de autenticacao do app.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import {
  checkUsernameAvailability as apiCheckUsernameAvailability,
  login as apiLogin,
  SessionExpiredError,
  signup as apiSignup,
  updatePassword as apiUpdatePassword,
  updateProfile as apiUpdateProfile,
  updateUsername as apiUpdateUsername,
  type UsernameAvailabilityResponse,
} from '@/services/auth';
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
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  signup: (username: string, password: string, profileImage?: string | null) => Promise<void>;
  updateProfile: (params: { profileImage?: string | null }) => Promise<void>;
  checkUsernameAvailability: (username: string) => Promise<UsernameAvailabilityResponse>;
  updateUsername: (params: { username: string; currentPassword: string }) => Promise<void>;
  updatePassword: (params: { currentPassword: string; newPassword: string }) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  login: async () => {},
  signup: async () => {},
  updateProfile: async () => {},
  checkUsernameAvailability: async () => ({ username: '', available: false }),
  updateUsername: async () => {},
  updatePassword: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const clearStoredSession = useCallback(async () => {
    await AsyncStorage.multiRemove([
      STORAGE_KEY_USER_ID,
      STORAGE_KEY_USERNAME,
      STORAGE_KEY_PROFILE_IMG,
      STORAGE_KEY_ACCESS_TOKEN,
    ]);
    setUser(null);
  }, []);

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

          if (!storedUsername) {
            await AsyncStorage.setItem(STORAGE_KEY_USERNAME, usernameToUse);
          }

          setUser({
            userId: storedUserId,
            username: usernameToUse,
            profileImageUrl: storedProfileImageUrl,
          });
        } else if (storedUserId || storedUsername || storedProfileImageUrl || storedAccessToken) {
          await clearStoredSession();
        }
      } catch {
        // Ignora falhas de leitura do storage.
      } finally {
        setLoading(false);
      }
    })();
  }, [clearStoredSession]);

  const persistUser = useCallback(async (payload: AuthResponse) => {
    const row = payload as AuthResponse & Record<string, unknown>;
    const userId = asTrimmedString(row.userId) || asTrimmedString(row.user_id);
    const username = asTrimmedString(row.username) || asTrimmedString(row.user_name) || FALLBACK_USERNAME;
    const profileImageUrl = asTrimmedString(row.profileImageUrl) || asTrimmedString(row.profile_image_url) || null;
    const accessToken = asTrimmedString(row.accessToken) || asTrimmedString(row.access_token) || '';

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

    if (accessToken) {
      await AsyncStorage.setItem(STORAGE_KEY_ACCESS_TOKEN, accessToken);
    }

    setUser({ userId, username, profileImageUrl });
  }, []);

  const handleProtectedAuthResponse = useCallback(async (request: () => Promise<AuthResponse>) => {
    try {
      const data = await request();
      await persistUser(data);
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        await clearStoredSession();
      }
      throw err;
    }
  }, [clearStoredSession, persistUser]);

  const loginFn = useCallback(async (username: string, password: string) => {
    const data = await apiLogin({ username, password });
    await persistUser(data);
  }, [persistUser]);

  const signupFn = useCallback(async (username: string, password: string, profileImage?: string | null) => {
    const data = await apiSignup({ username, password, profileImage });
    await persistUser(data);
  }, [persistUser]);

  const updateProfileFn = useCallback(async (params: { profileImage?: string | null }) => {
    await handleProtectedAuthResponse(() => apiUpdateProfile(params));
  }, [handleProtectedAuthResponse]);

  const checkUsernameAvailabilityFn = useCallback(async (username: string) => {
    try {
      return await apiCheckUsernameAvailability(username);
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        await clearStoredSession();
      }
      throw err;
    }
  }, [clearStoredSession]);

  const updateUsernameFn = useCallback(async (params: { username: string; currentPassword: string }) => {
    await handleProtectedAuthResponse(() => apiUpdateUsername(params));
  }, [handleProtectedAuthResponse]);

  const updatePasswordFn = useCallback(async (params: { currentPassword: string; newPassword: string }) => {
    await handleProtectedAuthResponse(() => apiUpdatePassword(params));
  }, [handleProtectedAuthResponse]);

  const logoutFn = useCallback(async () => {
    await clearStoredSession();
  }, [clearStoredSession]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login: loginFn,
        signup: signupFn,
        updateProfile: updateProfileFn,
        checkUsernameAvailability: checkUsernameAvailabilityFn,
        updateUsername: updateUsernameFn,
        updatePassword: updatePasswordFn,
        logout: logoutFn,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export async function getStoredUserId(): Promise<string | null> {
  return AsyncStorage.getItem(STORAGE_KEY_USER_ID);
}

export async function getStoredAccessToken(): Promise<string | null> {
  return AsyncStorage.getItem(STORAGE_KEY_ACCESS_TOKEN);
}
