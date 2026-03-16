/**
 * Modal de perfil com fluxos separados para foto, usuario e senha.
 */

import { useEffect, useRef, useState } from 'react';
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

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { AppButton } from '@/components/app-button';
import { AppInput } from '@/components/app-input';
import { Brand } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { pickDishImage } from '@/services/dish-images';
import {
  PASSWORD_MAX_LENGTH,
  sanitizeUsernameInput,
  USERNAME_MAX_LENGTH,
  validatePasswordLength,
  validateUsername,
} from '@/utils/auth-validation';

type Props = {
  visible: boolean;
  onClose: () => void;
};

type ProfileStep = 'overview' | 'username' | 'password';
type UsernameCheckState = 'idle' | 'checking' | 'available' | 'unavailable' | 'invalid' | 'same' | 'error';

function getUsernameStatusPalette(status: UsernameCheckState) {
  if (status === 'available') {
    return {
      backgroundColor: '#F0FFF4',
      borderColor: '#C7E9D0',
      textColor: Brand.greenDark,
    };
  }

  if (status === 'checking' || status === 'error') {
    return {
      backgroundColor: '#FFF8E8',
      borderColor: '#F1D49A',
      textColor: '#9A6700',
    };
  }

  return {
    backgroundColor: '#FFF0F0',
    borderColor: '#F2C6CB',
    textColor: Brand.danger,
  };
}

export function EditProfileModal({ visible, onClose }: Props) {
  const router = useRouter();
  const {
    user,
    updateProfile,
    checkUsernameAvailability,
    updateUsername,
    updatePassword,
    logout,
  } = useAuth();

  const usernameCheckId = useRef(0);

  const [step, setStep] = useState<ProfileStep>('overview');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoChanged, setPhotoChanged] = useState(false);
  const [photoPickerVisible, setPhotoPickerVisible] = useState(false);
  const [usernameDraft, setUsernameDraft] = useState('');
  const [usernamePassword, setUsernamePassword] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<UsernameCheckState>('idle');
  const [usernameStatusMessage, setUsernameStatusMessage] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const currentUsername = user?.username ?? '-';
  const normalizedCurrentUsername = currentUsername.trim().toLowerCase();
  const displayPhoto = photoChanged ? photoUri : (user?.profileImageUrl ?? null);
  const usernamePalette = getUsernameStatusPalette(usernameStatus);

  const passwordValidationMessage = (() => {
    if (!currentPassword.trim() && !newPassword.trim() && !confirmNewPassword.trim()) {
      return null;
    }
    const currentPasswordError = validatePasswordLength(currentPassword, { label: 'Senha atual' });
    if (currentPasswordError) {
      return currentPasswordError;
    }
    const newPasswordError = validatePasswordLength(newPassword, { label: 'A nova senha' });
    if (newPasswordError) {
      return newPasswordError;
    }
    if (newPassword.trim() === currentPassword.trim()) {
      return 'Escolha uma senha diferente da atual.';
    }
    if (newPassword.trim() !== confirmNewPassword.trim()) {
      return 'As senhas nao coincidem.';
    }
    return null;
  })();

  const canSubmitUsername =
    !loading &&
    !!usernameDraft.trim() &&
    !!usernamePassword.trim() &&
    (usernameStatus === 'available' || usernameStatus === 'error');

  const canSubmitPassword =
    !loading &&
    !!currentPassword.trim() &&
    !!newPassword.trim() &&
    !!confirmNewPassword.trim() &&
    !passwordValidationMessage;

  useEffect(() => {
    if (step !== 'username') {
      return;
    }

    const normalizedUsername = usernameDraft.trim();

    if (!normalizedUsername) {
      setUsernameStatus('idle');
      setUsernameStatusMessage(null);
      return;
    }

    const validationMessage = validateUsername(normalizedUsername);
    if (validationMessage) {
      setUsernameStatus('invalid');
      setUsernameStatusMessage(validationMessage);
      return;
    }

    if (normalizedUsername.toLowerCase() === normalizedCurrentUsername) {
      setUsernameStatus('same');
      setUsernameStatusMessage('Esse ja e o seu usuario atual.');
      return;
    }

    const requestId = usernameCheckId.current + 1;
    usernameCheckId.current = requestId;
    setUsernameStatus('checking');
    setUsernameStatusMessage('Verificando disponibilidade...');

    const timer = setTimeout(() => {
      (async () => {
        try {
          const result = await checkUsernameAvailability(normalizedUsername);
          if (requestId !== usernameCheckId.current) {
            return;
          }

          setUsernameStatus(result.available ? 'available' : 'unavailable');
          setUsernameStatusMessage(
            result.message ??
              (result.available
                ? 'Nome de usuario disponivel.'
                : 'Esse nome de usuario ja esta em uso.'),
          );
        } catch (err: any) {
          if (requestId !== usernameCheckId.current) {
            return;
          }

          setUsernameStatus('error');
          setUsernameStatusMessage(err?.message ?? 'Nao foi possivel verificar agora.');
        }
      })();
    }, 450);

    return () => clearTimeout(timer);
  }, [checkUsernameAvailability, normalizedCurrentUsername, step, usernameDraft]);

  function clearMessages() {
    setError(null);
    setSuccess(null);
  }

  function resetUsernameFlow() {
    setUsernameDraft('');
    setUsernamePassword('');
    setUsernameStatus('idle');
    setUsernameStatusMessage(null);
  }

  function resetPasswordFlow() {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
  }

  function resetForm() {
    setStep('overview');
    setPhotoUri(null);
    setPhotoChanged(false);
    setPhotoPickerVisible(false);
    resetUsernameFlow();
    resetPasswordFlow();
    clearMessages();
    setLoading(false);
  }

  function handleOpen() {
    resetForm();
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  function handleBack() {
    if (step === 'overview') {
      handleClose();
      return;
    }

    clearMessages();
    if (step === 'username') {
      resetUsernameFlow();
    } else {
      resetPasswordFlow();
    }
    setStep('overview');
  }

  function openUsernameFlow() {
    clearMessages();
    resetUsernameFlow();
    setStep('username');
  }

  function openPasswordFlow() {
    clearMessages();
    resetPasswordFlow();
    setStep('password');
  }

  function handlePickPhoto() {
    setPhotoPickerVisible(true);
  }

  async function pickFromCamera() {
    setPhotoPickerVisible(false);
    const uri = await pickDishImage(true);
    if (uri) {
      clearMessages();
      setPhotoUri(uri);
      setPhotoChanged(true);
    }
  }

  async function pickFromGallery() {
    setPhotoPickerVisible(false);
    const uri = await pickDishImage(false);
    if (uri) {
      clearMessages();
      setPhotoUri(uri);
      setPhotoChanged(true);
    }
  }

  function removePhoto() {
    clearMessages();
    setPhotoPickerVisible(false);
    setPhotoUri(null);
    setPhotoChanged(true);
  }

  async function handleSavePhoto() {
    if (!photoChanged) {
      return;
    }

    clearMessages();
    setLoading(true);

    try {
      await updateProfile({ profileImage: photoUri });
      setSuccess(photoUri ? 'Foto atualizada com sucesso.' : 'Foto removida com sucesso.');
      setPhotoChanged(false);
      setPhotoUri(null);
    } catch (err: any) {
      if (err?.name === 'SessionExpiredError') {
        handleClose();
        return;
      }
      setError(err?.message ?? 'Erro ao atualizar a foto.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveUsername() {
    const normalizedUsername = usernameDraft.trim();
    const validationMessage = validateUsername(normalizedUsername);

    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    if (normalizedUsername.toLowerCase() === normalizedCurrentUsername) {
      setError('Escolha um nome de usuario diferente do atual.');
      return;
    }

    if (!usernamePassword.trim()) {
      setError('Digite sua senha atual para confirmar.');
      return;
    }

    clearMessages();
    setLoading(true);

    try {
      await updateUsername({
        username: normalizedUsername,
        currentPassword: usernamePassword.trim(),
      });
      resetUsernameFlow();
      setStep('overview');
      setSuccess('Nome de usuario atualizado com sucesso.');
    } catch (err: any) {
      if (err?.name === 'SessionExpiredError') {
        handleClose();
        return;
      }
      setError(err?.message ?? 'Erro ao atualizar o nome de usuario.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSavePassword() {
    if (passwordValidationMessage) {
      setError(passwordValidationMessage);
      return;
    }

    clearMessages();
    setLoading(true);

    try {
      await updatePassword({
        currentPassword: currentPassword.trim(),
        newPassword: newPassword.trim(),
      });
      resetPasswordFlow();
      setStep('overview');
      setSuccess('Senha atualizada com sucesso.');
    } catch (err: any) {
      if (err?.name === 'SessionExpiredError') {
        handleClose();
        return;
      }
      setError(err?.message ?? 'Erro ao atualizar a senha.');
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

  function handleOpenFeedback() {
    handleClose();
    router.push('/feedback' as any);
  }

  function handleOpenBmi() {
    handleClose();
    router.push('/tools/imc' as any);
  }

  function handleOpenLogs() {
    handleClose();
    router.push({ pathname: '/(tabs)/devtools', params: { mode: 'logs' } } as any);
  }

  function renderOverview() {
    return (
      <>
        <Pressable style={({ pressed }) => [s.infoCard, pressed && s.cardPressed]} onPress={openUsernameFlow}>
          <View style={s.infoCopy}>
            <Text style={s.currentLabel}>Usuario atual</Text>
            <Text style={s.currentValue}>{currentUsername}</Text>
            <Text style={s.infoHint}>Toque para alterar o nome de usuario</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Brand.textSecondary} />
        </Pressable>

        <Pressable style={({ pressed }) => [s.actionCard, pressed && s.cardPressed]} onPress={openPasswordFlow}>
          <View style={[s.actionIcon, { backgroundColor: '#EEF4FF' }]}>
            <Ionicons name="lock-closed-outline" size={20} color="#2563EB" />
          </View>
          <View style={s.actionCopy}>
            <Text style={s.actionTitle}>Alterar senha</Text>
            <Text style={s.actionDescription}>Confirme a senha atual e defina uma nova.</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Brand.textSecondary} />
        </Pressable>

        {photoChanged ? (
          <AppButton
            title="Salvar alteracao da foto"
            onPress={handleSavePhoto}
            loading={loading}
          />
        ) : null}

        <View style={s.utilityGroup}>
          <AppButton
            title="Enviar feedback"
            onPress={handleOpenFeedback}
            variant="secondary"
            disabled={loading}
          />
          <AppButton
            title="Calculadora de IMC"
            onPress={handleOpenBmi}
            variant="secondary"
            disabled={loading}
          />
          <AppButton
            title="Ver logs"
            onPress={handleOpenLogs}
            variant="secondary"
            disabled={loading}
          />
        </View>

        <Pressable style={s.logoutBtn} onPress={handleLogout}>
          <Text style={s.logoutText}>Sair da conta</Text>
        </Pressable>
      </>
    );
  }

  function renderUsernameFlow() {
    return (
      <View style={s.formCard}>
        <Text style={s.sectionTitle}>Alterar nome de usuario</Text>
        <Text style={s.sectionSubtitle}>
          Escolha um nome novo e confirme com sua senha atual antes de salvar.
        </Text>

        <View style={s.currentInfo}>
          <Text style={s.currentLabel}>Usuario atual</Text>
          <Text style={s.currentValue}>{currentUsername}</Text>
        </View>

        <View style={s.fieldGroup}>
          <Text style={s.fieldLabel}>Novo nome de usuario</Text>
          <AppInput
            placeholder="Digite o novo usuario"
            value={usernameDraft}
            onChangeText={(text: string) => setUsernameDraft(sanitizeUsernameInput(text))}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={USERNAME_MAX_LENGTH}
          />
        </View>

        {usernameStatusMessage ? (
          <View
            style={[
              s.statusBox,
              {
                backgroundColor: usernamePalette.backgroundColor,
                borderColor: usernamePalette.borderColor,
              },
            ]}>
            <Text style={[s.statusText, { color: usernamePalette.textColor }]}>
              {usernameStatusMessage}
            </Text>
          </View>
        ) : null}

        <View style={s.fieldGroup}>
          <Text style={s.fieldLabel}>Sua senha atual</Text>
          <AppInput
            placeholder="Digite sua senha atual"
            value={usernamePassword}
            onChangeText={setUsernamePassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={PASSWORD_MAX_LENGTH}
          />
        </View>

        <AppButton
          title="Confirmar nome de usuario"
          onPress={handleSaveUsername}
          loading={loading}
          disabled={!canSubmitUsername}
        />

        <AppButton
          title="Cancelar"
          onPress={handleBack}
          variant="secondary"
          disabled={loading}
        />
      </View>
    );
  }

  function renderPasswordFlow() {
    return (
      <View style={s.formCard}>
        <Text style={s.sectionTitle}>Alterar senha</Text>
        <Text style={s.sectionSubtitle}>
          Informe a senha atual, escolha a nova senha e confirme antes de salvar.
        </Text>

        <View style={s.fieldGroup}>
          <Text style={s.fieldLabel}>Senha atual</Text>
          <AppInput
            placeholder="Digite sua senha atual"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={PASSWORD_MAX_LENGTH}
          />
        </View>

        <View style={s.fieldGroup}>
          <Text style={s.fieldLabel}>Nova senha</Text>
          <AppInput
            placeholder="Digite a nova senha"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={PASSWORD_MAX_LENGTH}
          />
        </View>

        <View style={s.fieldGroup}>
          <Text style={s.fieldLabel}>Repita a nova senha</Text>
          <AppInput
            placeholder="Repita a nova senha"
            value={confirmNewPassword}
            onChangeText={setConfirmNewPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={PASSWORD_MAX_LENGTH}
          />
        </View>

        {passwordValidationMessage ? (
          <View style={s.inlineHelper}>
            <Text style={s.inlineHelperText}>{passwordValidationMessage}</Text>
          </View>
        ) : null}

        <AppButton
          title="Confirmar nova senha"
          onPress={handleSavePassword}
          loading={loading}
          disabled={!canSubmitPassword}
        />

        <AppButton
          title="Cancelar"
          onPress={handleBack}
          variant="secondary"
          disabled={loading}
        />
      </View>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleBack}
      onShow={handleOpen}>
      <KeyboardAvoidingView
        style={s.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.header}>
          <Pressable onPress={handleBack} hitSlop={12}>
            <Text style={s.headerAction}>{step === 'overview' ? 'Fechar' : 'Voltar'}</Text>
          </Pressable>
          <Text style={s.headerTitle}>
            {step === 'overview'
              ? 'Editar perfil'
              : step === 'username'
                ? 'Alterar usuario'
                : 'Alterar senha'}
          </Text>
          <View style={s.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <Pressable style={s.avatarWrap} onPress={handlePickPhoto}>
            {displayPhoto ? (
              <Image source={{ uri: displayPhoto }} style={s.avatarImg} />
            ) : (
              <View style={s.avatarPlaceholder}>
                <Text style={s.avatarLetter}>{currentUsername.charAt(0).toUpperCase() || 'V'}</Text>
              </View>
            )}
            <View style={s.avatarBadge}>
              <Ionicons name="camera" size={14} color="#FFFFFF" />
            </View>
          </Pressable>
          <Text style={s.avatarHint}>Toque para alterar a foto do perfil</Text>

          {error ? (
            <View style={[s.messageBox, s.errorBox]}>
              <Text style={[s.messageText, s.errorText]}>{error}</Text>
            </View>
          ) : null}

          {success ? (
            <View style={[s.messageBox, s.successBox]}>
              <Text style={[s.messageText, s.successText]}>{success}</Text>
            </View>
          ) : null}

          {step === 'overview' ? renderOverview() : null}
          {step === 'username' ? renderUsernameFlow() : null}
          {step === 'password' ? renderPasswordFlow() : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={photoPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPhotoPickerVisible(false)}>
        <Pressable style={s.ppOverlay} onPress={() => setPhotoPickerVisible(false)}>
          <Pressable style={s.ppSheet} onPress={(event) => event.stopPropagation()}>
            <View style={s.ppHandleWrap}>
              <View style={s.ppHandle} />
            </View>
            <Text style={s.ppTitle}>Foto de perfil</Text>

            <View style={s.ppActions}>
              <Pressable
                style={({ pressed }) => [s.ppBtn, pressed && s.ppBtnPressed]}
                onPress={pickFromCamera}>
                <View style={[s.ppIconWrap, { backgroundColor: '#E8F5E9' }]}>
                  <Ionicons name="camera-outline" size={20} color={Brand.greenDark} />
                </View>
                <Text style={s.ppBtnLabel}>Camera</Text>
              </Pressable>

              <View style={s.ppBtnBorder} />

              <Pressable
                style={({ pressed }) => [s.ppBtn, pressed && s.ppBtnPressed]}
                onPress={pickFromGallery}>
                <View style={[s.ppIconWrap, { backgroundColor: '#E3F2FD' }]}>
                  <Ionicons name="images-outline" size={20} color="#1976D2" />
                </View>
                <Text style={s.ppBtnLabel}>Galeria</Text>
              </Pressable>

              {(photoUri || displayPhoto) ? (
                <>
                  <View style={s.ppBtnBorder} />
                  <Pressable
                    style={({ pressed }) => [s.ppBtn, pressed && s.ppBtnPressed]}
                    onPress={removePhoto}>
                    <View style={[s.ppIconWrap, { backgroundColor: '#FFF0F0' }]}>
                      <Ionicons name="trash-outline" size={20} color={Brand.danger} />
                    </View>
                    <Text style={[s.ppBtnLabel, { color: Brand.danger }]}>Remover foto</Text>
                  </Pressable>
                </>
              ) : null}
            </View>

            <Pressable
              style={({ pressed }) => [s.ppCancelBtn, pressed && s.ppBtnPressed]}
              onPress={() => setPhotoPickerVisible(false)}>
              <Text style={s.ppCancelText}>Cancelar</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
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
  headerAction: {
    fontSize: 15,
    fontWeight: '600',
    color: Brand.textSecondary,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Brand.text,
  },
  headerSpacer: {
    width: 52,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 48,
    gap: 16,
  },
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
  avatarHint: {
    fontSize: 12,
    color: Brand.textSecondary,
    textAlign: 'center',
    marginTop: -6,
  },
  messageBox: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  messageText: {
    fontSize: 13,
    textAlign: 'center',
  },
  errorBox: {
    backgroundColor: '#FFF0F0',
    borderColor: '#F2C6CB',
  },
  errorText: {
    color: Brand.danger,
  },
  successBox: {
    backgroundColor: '#F0FFF4',
    borderColor: '#C7E9D0',
  },
  successText: {
    color: Brand.greenDark,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: Brand.card,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: Brand.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  infoCopy: {
    flex: 1,
    gap: 4,
  },
  infoHint: {
    fontSize: 12,
    color: Brand.textSecondary,
  },
  actionCard: {
    backgroundColor: Brand.card,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: Brand.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  cardPressed: {
    opacity: 0.9,
  },
  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCopy: {
    flex: 1,
    gap: 4,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Brand.text,
  },
  actionDescription: {
    fontSize: 13,
    color: Brand.textSecondary,
  },
  utilityGroup: {
    gap: 12,
  },
  formCard: {
    backgroundColor: Brand.card,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: Brand.border,
    gap: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Brand.text,
  },
  sectionSubtitle: {
    fontSize: 13,
    lineHeight: 20,
    color: Brand.textSecondary,
  },
  currentInfo: {
    backgroundColor: Brand.bg,
    borderRadius: 14,
    padding: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: Brand.border,
  },
  currentLabel: {
    fontSize: 13,
    color: Brand.textSecondary,
    fontWeight: '500',
  },
  currentValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Brand.text,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Brand.text,
    marginLeft: 4,
  },
  statusBox: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 13,
    lineHeight: 18,
  },
  inlineHelper: {
    paddingHorizontal: 4,
  },
  inlineHelperText: {
    fontSize: 13,
    color: Brand.textSecondary,
    lineHeight: 18,
  },
  logoutBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 6,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: Brand.danger,
  },
  ppOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  ppSheet: {
    backgroundColor: Brand.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 48,
    paddingHorizontal: 20,
  },
  ppHandleWrap: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 14,
  },
  ppHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Brand.border,
  },
  ppTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Brand.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  ppActions: {
    backgroundColor: Brand.card,
    borderRadius: 16,
    overflow: 'hidden',
  },
  ppBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    gap: 14,
  },
  ppBtnPressed: {
    backgroundColor: Brand.bg,
  },
  ppBtnBorder: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Brand.border,
  },
  ppIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Brand.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ppBtnLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Brand.text,
  },
  ppCancelBtn: {
    marginTop: 10,
    backgroundColor: Brand.card,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
  },
  ppCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: Brand.textSecondary,
  },
});
