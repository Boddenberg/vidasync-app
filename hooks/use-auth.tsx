/**
 * Contexto de autenticacao do app.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

import {
  checkUsernameAvailability as apiCheckUsernameAvailability,
  getProfile as apiGetProfile,
  login as apiLogin,
  SessionExpiredError,
  signup as apiSignup,
  updatePassword as apiUpdatePassword,
  updateProfile as apiUpdateProfile,
  updateUsername as apiUpdateUsername,
  type UsernameAvailabilityResponse,
} from '@/services/auth';
import type { AuthResponse, AuthUser, ProfileIdentityResponse } from '@/types/nutrition';

const STORAGE_KEY_USER_ID = '@vidasync:userId';
const STORAGE_KEY_USERNAME = '@vidasync:username';
const STORAGE_KEY_PROFILE_IMG = '@vidasync:profileImageUrl';
const STORAGE_KEY_ACCESS_TOKEN = '@vidasync:accessToken';
const STORAGE_KEY_IS_DEVELOPER = '@vidasync:isDeveloper';
const FALLBACK_USERNAME = 'usuario';
const ALWAYS_ENABLED_DEVELOPER_USERNAMES = new Set(['boddenberg']);
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUuid(value: string | null | undefined): value is string {
  return !!value && UUID_REGEX.test(value.trim());
}

function asTrimmedString(value: unknown): string {
  return `${value ?? ''}`.trim();
}

function hasOwnProperty(value: unknown, key: string): boolean {
  return typeof value === 'object' && value != null && Object.prototype.hasOwnProperty.call(value, key);
}

function hasAlwaysEnabledDeveloperAccess(username: string | null | undefined): boolean {
  return ALWAYS_ENABLED_DEVELOPER_USERNAMES.has(asTrimmedString(username).toLowerCase());
}

function resolveDeveloperAccess(username: string | null | undefined, isDeveloper: boolean): boolean {
  return isDeveloper || hasAlwaysEnabledDeveloperAccess(username);
}

function normalizeBoolean(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes'].includes(normalized)) return true;
    if (['false', '0', 'no'].includes(normalized)) return false;
  }

  return null;
}

function firstDefinedValue(source: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (hasOwnProperty(source, key)) {
      return source[key];
    }
  }

  return undefined;
}

function readOptionalString(
  source: Record<string, unknown>,
  keys: string[],
  fallback: string | null,
): string | null {
  const rawValue = firstDefinedValue(source, keys);

  if (rawValue === undefined) {
    return fallback;
  }

  const normalized = asTrimmedString(rawValue);
  return normalized || null;
}

function readBoolean(
  source: Record<string, unknown>,
  keys: string[],
  fallback: boolean,
): boolean {
  const rawValue = firstDefinedValue(source, keys);

  if (rawValue === undefined) {
    return fallback;
  }

  return normalizeBoolean(rawValue) ?? fallback;
}

type NormalizedAuthPayload = {
  user: AuthUser;
  accessToken?: string;
};

type PersistableAuthPayload = AuthResponse | ProfileIdentityResponse;

function normalizeAuthPayload(payload: PersistableAuthPayload, fallbackUser: AuthUser | null): NormalizedAuthPayload {
  const row = payload as PersistableAuthPayload & Record<string, unknown>;
  const userId = readOptionalString(row, ['userId', 'user_id'], fallbackUser?.userId ?? null);
  const username = readOptionalString(row, ['username', 'user_name'], fallbackUser?.username ?? FALLBACK_USERNAME);
  const profileImageUrl = readOptionalString(
    row,
    ['profileImageUrl', 'profile_image_url'],
    fallbackUser?.profileImageUrl ?? null,
  );
  const normalizedUsername = username ?? FALLBACK_USERNAME;
  const isDeveloper = resolveDeveloperAccess(
    normalizedUsername,
    readBoolean(row, ['isDeveloper', 'is_developer'], fallbackUser?.isDeveloper ?? false),
  );
  const accessTokenValue = firstDefinedValue(row, ['accessToken', 'access_token']);

  if (!isValidUuid(userId)) {
    throw new Error('Sessao invalida recebida do servidor. Faca login novamente.');
  }

  return {
    user: {
      userId,
      username: normalizedUsername,
      profileImageUrl,
      isDeveloper,
    },
    accessToken:
      accessTokenValue === undefined
        ? undefined
        : asTrimmedString(accessTokenValue),
  };
}

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  signup: (username: string, password: string, profileImage?: string | null) => Promise<void>;
  updateProfile: (params: { profileImage?: string | null }) => Promise<void>;
  checkUsernameAvailability: (username: string) => Promise<UsernameAvailabilityResponse>;
  updateUsername: (params: { username: string }) => Promise<void>;
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
  const userRef = useRef<AuthUser | null>(null);

  const clearStoredSession = useCallback(async () => {
    await AsyncStorage.multiRemove([
      STORAGE_KEY_USER_ID,
      STORAGE_KEY_USERNAME,
      STORAGE_KEY_PROFILE_IMG,
      STORAGE_KEY_ACCESS_TOKEN,
      STORAGE_KEY_IS_DEVELOPER,
    ]);
    userRef.current = null;
    setUser(null);
  }, []);

  const persistUser = useCallback(async (payload: PersistableAuthPayload, fallbackUser?: AuthUser | null) => {
    const normalized = normalizeAuthPayload(payload, fallbackUser ?? userRef.current);

    await AsyncStorage.setItem(STORAGE_KEY_USER_ID, normalized.user.userId);
    await AsyncStorage.setItem(STORAGE_KEY_USERNAME, normalized.user.username);
    await AsyncStorage.setItem(STORAGE_KEY_IS_DEVELOPER, normalized.user.isDeveloper ? 'true' : 'false');

    if (normalized.user.profileImageUrl) {
      await AsyncStorage.setItem(STORAGE_KEY_PROFILE_IMG, normalized.user.profileImageUrl);
    } else {
      await AsyncStorage.removeItem(STORAGE_KEY_PROFILE_IMG);
    }

    if (normalized.accessToken !== undefined) {
      if (normalized.accessToken) {
        await AsyncStorage.setItem(STORAGE_KEY_ACCESS_TOKEN, normalized.accessToken);
      } else {
        await AsyncStorage.removeItem(STORAGE_KEY_ACCESS_TOKEN);
      }
    }

    userRef.current = normalized.user;
    setUser(normalized.user);
  }, []);

  const syncProfileSession = useCallback(async (fallbackUser: AuthUser) => {
    try {
      const data = await apiGetProfile();
      await persistUser(data, fallbackUser);
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        await clearStoredSession();
      }
    }
  }, [clearStoredSession, persistUser]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    (async () => {
      try {
        const rows = await AsyncStorage.multiGet([
          STORAGE_KEY_USER_ID,
          STORAGE_KEY_USERNAME,
          STORAGE_KEY_PROFILE_IMG,
          STORAGE_KEY_ACCESS_TOKEN,
          STORAGE_KEY_IS_DEVELOPER,
        ]);

        const storedUserId = asTrimmedString(rows[0]?.[1]);
        const storedUsername = asTrimmedString(rows[1]?.[1]);
        const storedProfileImageUrl = asTrimmedString(rows[2]?.[1]) || null;
        const storedAccessToken = asTrimmedString(rows[3]?.[1]);
        const storedIsDeveloper = normalizeBoolean(rows[4]?.[1]) ?? false;

        if (isValidUuid(storedUserId)) {
          const usernameToUse = storedUsername || FALLBACK_USERNAME;
          const resolvedIsDeveloper = resolveDeveloperAccess(usernameToUse, storedIsDeveloper);
          const restoredUser: AuthUser = {
            userId: storedUserId,
            username: usernameToUse,
            profileImageUrl: storedProfileImageUrl,
            isDeveloper: resolvedIsDeveloper,
          };

          if (!storedUsername) {
            await AsyncStorage.setItem(STORAGE_KEY_USERNAME, usernameToUse);
          }
          if ((rows[4]?.[1] ?? null) !== (resolvedIsDeveloper ? 'true' : 'false')) {
            await AsyncStorage.setItem(STORAGE_KEY_IS_DEVELOPER, resolvedIsDeveloper ? 'true' : 'false');
          }

          userRef.current = restoredUser;
          setUser(restoredUser);
          void syncProfileSession(restoredUser);
        } else if (storedUserId || storedUsername || storedProfileImageUrl || storedAccessToken || rows[4]?.[1]) {
          await clearStoredSession();
        }
      } catch {
        // Ignora falhas de leitura do storage.
      } finally {
        setLoading(false);
      }
    })();
  }, [clearStoredSession, syncProfileSession]);

  const handleProtectedAuthResponse = useCallback(async (request: () => Promise<PersistableAuthPayload>) => {
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

  const updateUsernameFn = useCallback(async (params: { username: string }) => {
    await handleProtectedAuthResponse(() => apiUpdateUsername({ username: params.username }));
  }, [handleProtectedAuthResponse]);

  const updatePasswordFn = useCallback(async (params: { currentPassword: string; newPassword: string }) => {
    try {
      const data = await apiUpdatePassword(params);

      if (!data.success) {
        throw new Error('Nao foi possivel atualizar a senha.');
      }
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        await clearStoredSession();
      }
      throw err;
    }
  }, [clearStoredSession]);

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
