import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';

import { useAuth } from '@/hooks/use-auth';
import { pickDishImage } from '@/services/dish-images';
import {
  PASSWORD_MAX_LENGTH,
  sanitizeUsernameInput,
  USERNAME_MAX_LENGTH,
  validatePasswordLength,
  validateUsername,
} from '@/utils/auth-validation';
import {
  getUsernameStatusPalette,
  type ProfileStep,
  type UsernameCheckState,
} from '@/features/profile/profile-flow';

type Props = {
  onClose: () => void;
};

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function useEditProfileModal({ onClose }: Props) {
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
      return 'As senhas não coincidem.';
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
      setUsernameStatusMessage('Esse já é o seu usuário atual.');
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
                ? 'Nome de usuário disponível.'
                : 'Esse nome de usuário já está em uso.'),
          );
        } catch (err: any) {
          if (requestId !== usernameCheckId.current) {
            return;
          }

          setUsernameStatus('error');
          setUsernameStatusMessage(err?.message ?? 'Não foi possível verificar agora.');
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
    } else if (step === 'password') {
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

    // Wait for the action sheet/modal stack to close before launching native pickers.
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
      setError('Escolha um nome de usuário diferente do atual.');
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
      setSuccess('Nome de usuário atualizado com sucesso.');
    } catch (err: any) {
      if (err?.name === 'SessionExpiredError') {
        handleClose();
        return;
      }
      setError(err?.message ?? 'Erro ao atualizar o nome de usuário.');
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
        ? 'Alterar usuário'
        : step === 'password'
          ? 'Alterar senha'
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
    photoPickerVisible,
    usernameDraft,
    usernamePassword,
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
    handlePickPhoto,
    pickFromCamera,
    pickFromGallery,
    removePhoto,
    handleSavePhoto,
    handleSaveUsername,
    handleSavePassword,
    handleLogout,
    handleOpenFeedback,
    handleOpenBmi,
    handleOpenDeveloperTools,
    setPhotoPickerVisible,
    setUsernameDraft: (value: string) => setUsernameDraft(sanitizeUsernameInput(value)),
    setUsernamePassword,
    setCurrentPassword,
    setNewPassword,
    setConfirmNewPassword,
    usernameMaxLength: USERNAME_MAX_LENGTH,
    passwordMaxLength: PASSWORD_MAX_LENGTH,
  };
}
