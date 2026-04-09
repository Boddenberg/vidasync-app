import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';

import { type ThemePaletteKey } from '@/constants/theme';
import { getUsernameStatusPalette, type ProfileStep, type UsernameCheckState } from '@/features/profile/profile-flow';
import { useAppTheme } from '@/hooks/use-app-theme';
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
  onClose: () => void;
};

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function useEditProfileModal({ onClose }: Props) {
  const router = useRouter();
  const { themeKey, themeOption, options: themeOptions, applyThemeSelection } = useAppTheme();
  const { user, updateProfile, checkUsernameAvailability, updateUsername, updatePassword, logout } = useAuth();

  const usernameCheckId = useRef(0);

  const [step, setStep] = useState<ProfileStep>('overview');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoChanged, setPhotoChanged] = useState(false);
  const [photoPickerVisible, setPhotoPickerVisible] = useState(false);
  const [usernameDraft, setUsernameDraft] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<UsernameCheckState>('idle');
  const [usernameStatusMessage, setUsernameStatusMessage] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [selectedThemeKey, setSelectedThemeKey] = useState<ThemePaletteKey>(themeKey);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const currentUsername = user?.username ?? '-';
  const normalizedCurrentUsername = currentUsername.trim().toLowerCase();
  const displayPhoto = photoChanged ? photoUri : (user?.profileImageUrl ?? null);
  const showDeveloperTools = Boolean(user?.isDeveloper);
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
    (usernameStatus === 'available' || usernameStatus === 'error');

  const canSubmitPassword =
    !loading &&
    !!currentPassword.trim() &&
    !!newPassword.trim() &&
    !!confirmNewPassword.trim() &&
    !passwordValidationMessage;

  useEffect(() => {
    setSelectedThemeKey(themeKey);
  }, [themeKey]);

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
            result.message ?? (result.available ? 'Nome de usuario disponivel.' : 'Esse nome de usuario ja esta em uso.'),
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
    setUsernameStatus('idle');
    setUsernameStatusMessage(null);
  }

  function resetPasswordFlow() {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
  }

  function resetThemeFlow() {
    setSelectedThemeKey(themeKey);
  }

  function resetForm() {
    setStep('overview');
    setPhotoUri(null);
    setPhotoChanged(false);
    setPhotoPickerVisible(false);
    resetUsernameFlow();
    resetPasswordFlow();
    resetThemeFlow();
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
    } else if (step === 'password') {
      resetPasswordFlow();
    } else if (step === 'theme') {
      resetThemeFlow();
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

  function openThemeFlow() {
    clearMessages();
    resetThemeFlow();
    setStep('theme');
  }

  function openBmiFlow() {
    clearMessages();
    setStep('bmi');
  }

  function handlePickPhoto() {
    clearMessages();
    setPhotoPickerVisible(true);
  }

  async function runPhotoPicker(action: () => Promise<string | null>) {
    clearMessages();
    setPhotoPickerVisible(false);

    await wait(180);

    try {
      const uri = await action();
      if (!uri) return;

      setPhotoUri(uri);
      setPhotoChanged(true);
    } catch (err: any) {
      setError(err?.message ?? 'Nao foi possivel abrir o seletor de imagem.');
    }
  }

  async function pickFromCamera() {
    await runPhotoPicker(() => pickDishImage(true));
  }

  async function pickFromGallery() {
    await runPhotoPicker(() => pickDishImage(false));
  }

  function removePhoto() {
    Alert.alert('Remover foto', 'Tem certeza que deseja remover a foto do perfil?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: () => {
          clearMessages();
          setPhotoPickerVisible(false);
          setPhotoUri(null);
          setPhotoChanged(true);
        },
      },
    ]);
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

    clearMessages();
    setLoading(true);

    try {
      await updateUsername({ username: normalizedUsername });
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

  async function handleSaveTheme() {
    if (selectedThemeKey === themeKey) {
      setStep('overview');
      return;
    }

    clearMessages();
    setLoading(true);

    try {
      await applyThemeSelection(selectedThemeKey);
    } catch (err: any) {
      setError(err?.message ?? 'Erro ao aplicar a nova paleta.');
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
    openBmiFlow();
  }

  function handleOpenDeveloperTools() {
    handleClose();
    router.push('/(tabs)/devtools' as any);
  }

  const title =
    step === 'overview'
      ? 'Editar perfil'
      : step === 'username'
        ? 'Alterar usuario'
        : step === 'password'
          ? 'Alterar senha'
          : step === 'theme'
            ? 'Paleta do app'
            : 'Calculadora de IMC';

  return {
    step,
    title,
    loading,
    error,
    success,
    currentUsername,
    displayPhoto,
    photoChanged,
    showDeveloperTools,
    themeKey,
    themeOption,
    themeOptions,
    selectedThemeKey,
    photoPickerVisible,
    usernameDraft,
    usernameStatusMessage,
    usernamePalette,
    currentPassword,
    newPassword,
    confirmNewPassword,
    passwordValidationMessage,
    canSubmitUsername,
    canSubmitPassword,
    handleOpen,
    handleClose,
    handleBack,
    openUsernameFlow,
    openPasswordFlow,
    openThemeFlow,
    handlePickPhoto,
    pickFromCamera,
    pickFromGallery,
    removePhoto,
    handleSavePhoto,
    handleSaveUsername,
    handleSavePassword,
    handleSaveTheme,
    handleLogout,
    handleOpenFeedback,
    handleOpenBmi,
    handleOpenDeveloperTools,
    setPhotoPickerVisible,
    setUsernameDraft: (value: string) => setUsernameDraft(sanitizeUsernameInput(value)),
    setSelectedThemeKey,
    setCurrentPassword,
    setNewPassword,
    setConfirmNewPassword,
    usernameMaxLength: USERNAME_MAX_LENGTH,
    passwordMaxLength: PASSWORD_MAX_LENGTH,
  };
}
