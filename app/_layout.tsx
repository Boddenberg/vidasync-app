import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { router, Stack, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';

import { VidaSyncLogo } from '@/components/vida-sync-logo';
import { Brand } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/hooks/use-auth';

export const unstable_settings = {
  anchor: '(tabs)',
};

const VidaSyncTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Brand.green,
    background: Brand.bg,
    card: Brand.card,
    text: Brand.text,
    border: Brand.border,
  },
};

/** Redireciona automaticamente baseado no estado de autenticação */
function AuthGuard() {
  const { user, loading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const onLoginScreen = segments[0] === 'login';

    if (!user && !onLoginScreen) {
      // Não autenticado → vai para login
      router.replace('/login');
    } else if (user && onLoginScreen) {
      // Já autenticado → vai para tabs
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

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider value={VidaSyncTheme}>
        <AuthGuard />
        <Stack>
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="dark" />
      </ThemeProvider>
    </AuthProvider>
  );
}
