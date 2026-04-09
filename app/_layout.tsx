import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { router, Stack, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';

import { VidaSyncLogo } from '@/components/vida-sync-logo';
import { Brand, type ThemePaletteKey } from '@/constants/theme';
import { AppThemeProvider, bootstrapThemePalette, useAppTheme } from '@/hooks/use-app-theme';
import { AuthProvider, useAuth } from '@/hooks/use-auth';
import { installNetworkInspector } from '@/services/network-inspector';

export const unstable_settings = {
  anchor: '(tabs)',
};

void SplashScreen.preventAutoHideAsync().catch(() => {});

function buildNavigationTheme() {
  return {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: Brand.green,
      background: Brand.bg,
      card: Brand.card,
      text: Brand.text,
      border: Brand.border,
      notification: Brand.coral,
    },
  };
}

function AuthGuard() {
  const { user, loading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const onLoginScreen = segments[0] === 'login';

    if (!user && !onLoginScreen) {
      router.replace('/login');
    } else if (user && onLoginScreen) {
      router.replace('/(tabs)');
    }
  }, [user, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Brand.bg, gap: 32 }}>
        <VidaSyncLogo size={44} tagline />
        <ActivityIndicator size="large" color={Brand.green} />
      </View>
    );
  }

  return null;
}

function RootNavigation() {
  const { themeKey } = useAppTheme();
  const navigationTheme = buildNavigationTheme();

  return (
    <ThemeProvider key={themeKey} value={navigationTheme}>
      <AuthGuard />
      <Stack>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="review/assistida"
          options={{
            title: 'Resultado da analise',
            headerBackTitle: '',
            headerBackButtonDisplayMode: 'minimal',
            headerTintColor: Brand.greenDark,
            headerTitleStyle: { fontWeight: '700' },
            headerShadowVisible: false,
            headerStyle: { backgroundColor: Brand.bg },
          }}
        />
        <Stack.Screen
          name="feedback"
          options={{
            title: 'Enviar feedback',
            headerBackTitle: '',
            headerBackButtonDisplayMode: 'minimal',
            headerTintColor: Brand.greenDark,
            headerTitleStyle: { fontWeight: '700' },
            headerShadowVisible: false,
            headerStyle: { backgroundColor: Brand.bg },
          }}
        />
        <Stack.Screen
          name="tools/imc"
          options={{
            title: 'Calculadora de IMC',
            headerBackTitle: '',
            headerBackButtonDisplayMode: 'minimal',
            headerTintColor: Brand.greenDark,
            headerTitleStyle: { fontWeight: '700' },
            headerShadowVisible: false,
            headerStyle: { backgroundColor: Brand.bg },
          }}
        />
        <Stack.Screen name="nutrition/review" options={{ title: 'Revisao nutricional' }} />
        <Stack.Screen name="plan/review" options={{ title: 'Revisao do plano' }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="dark" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [themeReady, setThemeReady] = useState(false);
  const [initialThemeKey, setInitialThemeKey] = useState<ThemePaletteKey>('meadow');

  useEffect(() => {
    installNetworkInspector();
  }, []);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const themeKey = await bootstrapThemePalette();
        if (active) {
          setInitialThemeKey(themeKey);
        }
      } finally {
        if (active) {
          setThemeReady(true);
          await SplashScreen.hideAsync().catch(() => {});
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  if (!themeReady) {
    return null;
  }

  return (
    <AuthProvider>
      <AppThemeProvider initialThemeKey={initialThemeKey}>
        <RootNavigation />
      </AppThemeProvider>
    </AuthProvider>
  );
}
