/**
 * Tela de Login / Cadastro
 *
 * Primeira tela do app. Permite logar ou criar conta.
 * Após autenticar, redireciona para as tabs.
 */

import { router } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { AppInput } from '@/components/app-input';
import { NutritionIllustration } from '@/components/nutrition-illustration';
import { VidaSyncLogo } from '@/components/vida-sync-logo';
import { Brand } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { pickDishImage } from '@/services/dish-images';

type Mode = 'login' | 'signup';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login, signup } = useAuth();

  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handlePickPhoto() {
    Alert.alert('Foto de perfil', undefined, [
      {
        text: 'Camera',
        onPress: async () => {
          const uri = await pickDishImage(true);
          if (uri) setPhotoUri(uri);
        },
      },
      {
        text: 'Galeria',
        onPress: async () => {
          const uri = await pickDishImage(false);
          if (uri) setPhotoUri(uri);
        },
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  async function handleSubmit() {
    const user = username.trim();
    const pass = password.trim();

    if (!user || !pass) {
      setError('Preencha usuario e senha');
      return;
    }

    if (mode === 'signup' && user.length < 3) {
      setError('Usuario deve ter pelo menos 3 caracteres');
      return;
    }

    if (mode === 'signup' && !/^[a-zA-Z][a-zA-Z0-9]*$/.test(user)) {
      setError('Usuario deve comecar com letra e conter apenas letras e numeros');
      return;
    }

    if (mode === 'signup' && pass.length < 6) {
      setError('Senha deve ter pelo menos 6 caracteres');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(user, pass);
      } else {
        await signup(user, pass, photoUri);
      }
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err?.message ?? 'Erro ao autenticar');
    } finally {
      setLoading(false);
    }
  }

  const isLogin = mode === 'login';

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="dark-content" backgroundColor={Brand.bg} />

      <ScrollView
        contentContainerStyle={[s.scroll, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        {/* Logo / Ilustracao */}
        <View style={s.logoArea}>
          <NutritionIllustration size={64} />
          <VidaSyncLogo size={36} tagline />
        </View>

        {/* Card do formulario */}
        <View style={s.card}>
          <Text style={s.cardTitle}>
            {isLogin ? 'Entrar' : 'Criar conta'}
          </Text>

          {/* Foto de perfil (apenas cadastro) */}
          {!isLogin && (
            <View style={s.photoRow}>
              <Pressable style={s.photoBtn} onPress={handlePickPhoto}>
                {photoUri ? (
                  <Image source={{ uri: photoUri }} style={s.photoImg} />
                ) : (
                  <View style={s.photoPlaceholder}>
                    <Text style={s.photoIcon}>+</Text>
                    <Text style={s.photoHint}>FOTO</Text>
                  </View>
                )}
              </Pressable>
              <Text style={s.photoLabel}>Foto de perfil (opcional)</Text>
            </View>
          )}

          {/* Campos */}
          <AppInput
            placeholder="Usuario"
            value={username}
            onChangeText={(t: string) => setUsername(t.replace(/[^a-zA-Z0-9]/g, ''))}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={30}
          />

          <AppInput
            placeholder="Senha"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={50}
          />

          {/* Erro */}
          {error && (
            <View style={s.errorBox}>
              <Text style={s.errorText}>{error}</Text>
            </View>
          )}

          {/* Botao principal */}
          <AppButton
            title={isLogin ? 'Entrar' : 'Criar conta'}
            onPress={handleSubmit}
            loading={loading}
            disabled={!username.trim() || !password.trim()}
          />

          {/* Toggle login/signup */}
          <Pressable style={s.toggleRow} onPress={() => {
            setMode(isLogin ? 'signup' : 'login');
            setError(null);
          }}>
            <Text style={s.toggleText}>
              {isLogin
                ? 'Nao tem conta? '
                : 'Ja tem conta? '}
            </Text>
            <Text style={s.toggleLink}>
              {isLogin ? 'Criar conta' : 'Entrar'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Brand.bg,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },

  // Logo
  logoArea: {
    alignItems: 'center',
    marginBottom: 32,
    gap: 8,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: Brand.greenDark,
    letterSpacing: -0.5,
  },
  appTagline: {
    fontSize: 14,
    color: Brand.textSecondary,
    fontWeight: '500',
  },

  // Card
  card: {
    backgroundColor: Brand.card,
    borderRadius: 24,
    padding: 24,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Brand.text,
    textAlign: 'center',
    marginBottom: 4,
  },

  // Photo
  photoRow: {
    alignItems: 'center',
    gap: 8,
  },
  photoBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
  },
  photoImg: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  photoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Brand.bg,
    borderWidth: 2,
    borderColor: Brand.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoIcon: {
    fontSize: 24,
    fontWeight: '700',
    color: Brand.textSecondary,
    marginTop: -2,
  },
  photoHint: {
    fontSize: 8,
    fontWeight: '700',
    color: Brand.textSecondary,
    letterSpacing: 1,
    marginTop: -2,
  },
  photoLabel: {
    fontSize: 12,
    color: Brand.textSecondary,
    fontWeight: '500',
  },

  // Error
  errorBox: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#FFF0F0',
    borderRadius: 12,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 13,
    color: Brand.danger,
    textAlign: 'center',
  },

  // Toggle
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: 4,
  },
  toggleText: {
    fontSize: 14,
    color: Brand.textSecondary,
  },
  toggleLink: {
    fontSize: 14,
    fontWeight: '700',
    color: Brand.green,
  },
});
