import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { DevSettings, Platform } from 'react-native';

import {
  applyBrandPalette,
  DEFAULT_THEME_PALETTE_KEY,
  getThemePaletteOption,
  isThemePaletteKey,
  THEME_PALETTE_OPTIONS,
  type ThemePaletteKey,
} from '@/constants/theme';
import { getStoredUserId, useAuth } from '@/hooks/use-auth';

const STORAGE_KEY_LAST_THEME = '@vidasync:themePalette';
const STORAGE_KEY_USER_THEME_PREFIX = '@vidasync:themePalette:user:';

type AppThemeState = {
  themeKey: ThemePaletteKey;
  themeOption: ReturnType<typeof getThemePaletteOption>;
  options: typeof THEME_PALETTE_OPTIONS;
  applyThemeSelection: (nextThemeKey: ThemePaletteKey) => Promise<void>;
};

const AppThemeContext = createContext<AppThemeState>({
  themeKey: DEFAULT_THEME_PALETTE_KEY,
  themeOption: getThemePaletteOption(DEFAULT_THEME_PALETTE_KEY),
  options: THEME_PALETTE_OPTIONS,
  applyThemeSelection: async () => {},
});

function getUserThemeStorageKey(userId: string) {
  return `${STORAGE_KEY_USER_THEME_PREFIX}${userId}`;
}

async function readStoredThemeKey(key: string): Promise<ThemePaletteKey | null> {
  const value = await AsyncStorage.getItem(key);
  return isThemePaletteKey(value) ? value : null;
}

export async function loadPersistedThemePaletteKey(userId?: string | null): Promise<ThemePaletteKey> {
  if (userId) {
    const userThemeKey = await readStoredThemeKey(getUserThemeStorageKey(userId));
    if (userThemeKey) {
      return userThemeKey;
    }
  }

  const globalThemeKey = await readStoredThemeKey(STORAGE_KEY_LAST_THEME);
  return globalThemeKey ?? DEFAULT_THEME_PALETTE_KEY;
}

export async function bootstrapThemePalette() {
  const storedUserId = await getStoredUserId();
  const themeKey = await loadPersistedThemePaletteKey(storedUserId);
  applyBrandPalette(themeKey);
  return themeKey;
}

async function persistThemePaletteKey(themeKey: ThemePaletteKey, userId?: string | null) {
  const operations = [AsyncStorage.setItem(STORAGE_KEY_LAST_THEME, themeKey)];

  if (userId) {
    operations.push(AsyncStorage.setItem(getUserThemeStorageKey(userId), themeKey));
  }

  await Promise.all(operations);
}

async function reloadApplication() {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
    return;
  }

  if (__DEV__) {
    DevSettings.reload();
    return;
  }

  try {
    await Updates.reloadAsync();
  } catch {
    DevSettings.reload();
  }
}

type ProviderProps = PropsWithChildren<{
  initialThemeKey: ThemePaletteKey;
}>;

export function AppThemeProvider({ children, initialThemeKey }: ProviderProps) {
  const { user } = useAuth();
  const [themeKey, setThemeKey] = useState<ThemePaletteKey>(initialThemeKey);
  const userIdRef = useRef<string | null>(user?.userId ?? null);

  useEffect(() => {
    userIdRef.current = user?.userId ?? null;
  }, [user?.userId]);

  useEffect(() => {
    let active = true;

    if (!user?.userId) {
      return () => {
        active = false;
      };
    }

    (async () => {
      const persistedThemeKey = await loadPersistedThemePaletteKey(user.userId);
      if (!active || persistedThemeKey === themeKey) {
        return;
      }

      applyBrandPalette(persistedThemeKey);
      setThemeKey(persistedThemeKey);
    })();

    return () => {
      active = false;
    };
  }, [themeKey, user?.userId]);

  const applyThemeSelection = useCallback(
    async (nextThemeKey: ThemePaletteKey) => {
      if (nextThemeKey === themeKey) {
        return;
      }

      await persistThemePaletteKey(nextThemeKey, userIdRef.current);
      applyBrandPalette(nextThemeKey);
      setThemeKey(nextThemeKey);
      await reloadApplication();
    },
    [themeKey],
  );

  return (
    <AppThemeContext.Provider
      value={{
        themeKey,
        themeOption: getThemePaletteOption(themeKey),
        options: THEME_PALETTE_OPTIONS,
        applyThemeSelection,
      }}>
      {children}
    </AppThemeContext.Provider>
  );
}

export function useAppTheme() {
  return useContext(AppThemeContext);
}
