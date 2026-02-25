/**
 * Modal de edicao de perfil
 *
 * Permite alterar nome de usuario, senha e foto de perfil.
 * Abre ao tocar no avatar na Home.
 */

import { useState } from 'react';
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { AppButton } from '@/components/app-button';
import { AppInput } from '@/components/app-input';
import { Brand } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { pickDishImage } from '@/services/dish-images';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function EditProfileModal({ visible, onClose }: Props) {
  const { user, updateProfile, logout } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoChanged, setPhotoChanged] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function resetForm() {
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setPhotoUri(null);
    setPhotoChanged(false);
    setError(null);
    setSuccess(null);
  }

  function handleOpen() {
    resetForm();
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  function handlePickPhoto() {
    Alert.alert('Foto de perfil', undefined, [
      {
        text: 'Camera',
        onPress: async () => {
          const uri = await pickDishImage(true);
          if (uri) {
            setPhotoUri(uri);
            setPhotoChanged(true);
          }
        },
      },
      {
        text: 'Galeria',
        onPress: async () => {
          const uri = await pickDishImage(false);
          if (uri) {
            setPhotoUri(uri);
            setPhotoChanged(true);
          }
        },
      },
      {
        text: 'Remover foto',
        style: 'destructive',
        onPress: () => {
          setPhotoUri(null);
          setPhotoChanged(true);
        },
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  async function handleSave() {
    const newUser = username.trim();
    const newPass = password.trim();
    const newConfirm = confirmPassword.trim();

    // Validar que algo foi alterado
    if (!newUser && !newPass && !photoChanged) {
      setError('Altere pelo menos um campo');
      return;
    }

    // Validar username
    if (newUser) {
      if (newUser.length < 3) {
        setError('Usuario deve ter pelo menos 3 caracteres');
        return;
      }
      if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(newUser)) {
        setError('Usuario deve comecar com letra e conter apenas letras e numeros');
        return;
      }
    }

    // Validar senha
    if (newPass) {
      if (newPass.length < 6) {
        setError('Senha deve ter pelo menos 6 caracteres');
        return;
      }
      if (newPass !== newConfirm) {
        setError('As senhas nao coincidem');
        return;
      }
    }

    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const params: { username?: string; password?: string; profileImage?: string | null } = {};
      if (newUser) params.username = newUser;
      if (newPass) params.password = newPass;
      if (photoChanged) params.profileImage = photoUri;

      await updateProfile(params);
      setSuccess('Perfil atualizado!');
      setUsername('');
      setPassword('');
      setConfirmPassword('');
      setPhotoChanged(false);
    } catch (err: any) {
      setError(err?.message ?? 'Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    Alert.alert('Sair da conta', 'Tem certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: () => {
          handleClose();
          logout();
        },
      },
    ]);
  }

  // Foto exibida: nova > atual do perfil
  const displayPhoto = photoChanged ? photoUri : (user?.profileImageUrl ?? null);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
      onShow={handleOpen}>
      <KeyboardAvoidingView
        style={s.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* Header */}
        <View style={s.header}>
          <Pressable onPress={handleClose} hitSlop={12}>
            <Text style={s.headerCancel}>Fechar</Text>
          </Pressable>
          <Text style={s.headerTitle}>Editar perfil</Text>
          <View style={{ width: 50 }} />
        </View>

        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">

          {/* Avatar */}
          <Pressable style={s.avatarWrap} onPress={handlePickPhoto}>
            {displayPhoto ? (
              <Image source={{ uri: displayPhoto }} style={s.avatarImg} />
            ) : (
              <View style={s.avatarPlaceholder}>
                <Text style={s.avatarLetter}>
                  {(user?.username ?? 'V').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={s.avatarBadge}>
              <Text style={s.avatarBadgeText}>E</Text>
            </View>
          </Pressable>
          <Text style={s.avatarHint}>Toque para alterar a foto</Text>

          {/* Username atual */}
          <View style={s.currentInfo}>
            <Text style={s.currentLabel}>Usuario atual</Text>
            <Text style={s.currentValue}>{user?.username ?? '-'}</Text>
          </View>

          {/* Campos */}
          <View style={s.fieldGroup}>
            <Text style={s.fieldLabel}>Novo nome de usuario</Text>
            <AppInput
              placeholder="Deixe vazio para manter"
              value={username}
              onChangeText={(t: string) => setUsername(t.replace(/[^a-zA-Z0-9]/g, ''))}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={30}
            />
          </View>

          <View style={s.fieldGroup}>
            <Text style={s.fieldLabel}>Nova senha</Text>
            <AppInput
              placeholder="Deixe vazio para manter"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={50}
            />
          </View>

          {password.length > 0 && (
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>Confirmar nova senha</Text>
              <AppInput
                placeholder="Repita a nova senha"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={50}
              />
            </View>
          )}

          {/* Mensagens */}
          {error && (
            <View style={s.errorBox}>
              <Text style={s.errorText}>{error}</Text>
            </View>
          )}

          {success && (
            <View style={s.successBox}>
              <Text style={s.successText}>{success}</Text>
            </View>
          )}

          {/* Salvar */}
          <AppButton
            title="Salvar alteracoes"
            onPress={handleSave}
            loading={loading}
          />

          {/* Logout */}
          <Pressable style={s.logoutBtn} onPress={handleLogout}>
            <Text style={s.logoutText}>Sair da conta</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Brand.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Brand.border,
    backgroundColor: Brand.card,
  },
  headerCancel: {
    fontSize: 15,
    fontWeight: '600',
    color: Brand.textSecondary,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Brand.text,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 48,
    gap: 16,
  },

  // Avatar
  avatarWrap: {
    alignSelf: 'center',
    position: 'relative',
  },
  avatarImg: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Brand.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Brand.greenDark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Brand.bg,
  },
  avatarBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  avatarHint: {
    fontSize: 12,
    color: Brand.textSecondary,
    textAlign: 'center',
    marginTop: -8,
  },

  // Current info
  currentInfo: {
    backgroundColor: Brand.card,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentLabel: {
    fontSize: 13,
    color: Brand.textSecondary,
    fontWeight: '500',
  },
  currentValue: {
    fontSize: 15,
    fontWeight: '700',
    color: Brand.text,
  },

  // Fields
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Brand.text,
    marginLeft: 4,
  },

  // Messages
  errorBox: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFF0F0',
    borderRadius: 12,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 13,
    color: Brand.danger,
    textAlign: 'center',
  },
  successBox: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F0FFF4',
    borderRadius: 12,
    alignItems: 'center',
  },
  successText: {
    fontSize: 13,
    color: Brand.greenDark,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Logout
  logoutBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 8,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: Brand.danger,
  },
});
