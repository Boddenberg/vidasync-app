import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, Text, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { AppInput } from '@/components/app-input';
import { Brand } from '@/constants/theme';
import { s } from '@/features/profile/edit-profile-modal.styles';

type StatusPalette = {
  backgroundColor: string;
  borderColor: string;
  textColor: string;
};

type AvatarProps = {
  currentUsername: string;
  displayPhoto: string | null;
  onPress: () => void;
};

type OverviewProps = {
  currentUsername: string;
  photoChanged: boolean;
  loading: boolean;
  onOpenUsername: () => void;
  onOpenPassword: () => void;
  onSavePhoto: () => void;
  onOpenFeedback: () => void;
  onOpenBmi: () => void;
  onOpenLogs: () => void;
  onLogout: () => void;
};

type UsernameStepProps = {
  currentUsername: string;
  usernameDraft: string;
  usernamePassword: string;
  usernameStatusMessage: string | null;
  usernamePalette: StatusPalette;
  loading: boolean;
  canSubmitUsername: boolean;
  onChangeUsername: (value: string) => void;
  onChangePassword: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  usernameMaxLength: number;
  passwordMaxLength: number;
};

type PasswordStepProps = {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
  passwordValidationMessage: string | null;
  loading: boolean;
  canSubmitPassword: boolean;
  onChangeCurrentPassword: (value: string) => void;
  onChangeNewPassword: (value: string) => void;
  onChangeConfirmPassword: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  passwordMaxLength: number;
};

type BannerProps = {
  tone: 'error' | 'success';
  message: string;
};

export function ProfileAvatarHeader({ currentUsername, displayPhoto, onPress }: AvatarProps) {
  return (
    <>
      <Pressable style={s.avatarWrap} onPress={onPress}>
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
    </>
  );
}

export function ProfileMessageBanner({ tone, message }: BannerProps) {
  const toneBox = tone === 'error' ? s.errorBox : s.successBox;
  const toneText = tone === 'error' ? s.errorText : s.successText;

  return (
    <View style={[s.messageBox, toneBox]}>
      <Text style={[s.messageText, toneText]}>{message}</Text>
    </View>
  );
}

export function EditProfileOverviewStep({
  currentUsername,
  photoChanged,
  loading,
  onOpenUsername,
  onOpenPassword,
  onSavePhoto,
  onOpenFeedback,
  onOpenBmi,
  onOpenLogs,
  onLogout,
}: OverviewProps) {
  return (
    <>
      <Pressable style={({ pressed }) => [s.infoCard, pressed && s.cardPressed]} onPress={onOpenUsername}>
        <View style={s.infoCopy}>
          <Text style={s.currentLabel}>Usuário atual</Text>
          <Text style={s.currentValue}>{currentUsername}</Text>
          <Text style={s.infoHint}>Toque para alterar o nome de usuário</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={Brand.textSecondary} />
      </Pressable>

      <Pressable style={({ pressed }) => [s.actionCard, pressed && s.cardPressed]} onPress={onOpenPassword}>
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
        <AppButton title="Salvar alteração da foto" onPress={onSavePhoto} loading={loading} />
      ) : null}

      <View style={s.utilityGroup}>
        <AppButton title="Enviar feedback" onPress={onOpenFeedback} variant="secondary" disabled={loading} />
        <AppButton title="Calculadora de IMC" onPress={onOpenBmi} variant="secondary" disabled={loading} />
        <AppButton title="Ver logs" onPress={onOpenLogs} variant="secondary" disabled={loading} />
      </View>

      <Pressable style={s.logoutBtn} onPress={onLogout}>
        <Text style={s.logoutText}>Sair da conta</Text>
      </Pressable>
    </>
  );
}

export function EditProfileUsernameStep({
  currentUsername,
  usernameDraft,
  usernamePassword,
  usernameStatusMessage,
  usernamePalette,
  loading,
  canSubmitUsername,
  onChangeUsername,
  onChangePassword,
  onSubmit,
  onCancel,
  usernameMaxLength,
  passwordMaxLength,
}: UsernameStepProps) {
  return (
    <View style={s.formCard}>
      <Text style={s.sectionTitle}>Alterar nome de usuário</Text>
      <Text style={s.sectionSubtitle}>
        Escolha um nome novo e confirme com sua senha atual antes de salvar.
      </Text>

      <View style={s.currentInfo}>
        <Text style={s.currentLabel}>Usuário atual</Text>
        <Text style={s.currentValue}>{currentUsername}</Text>
      </View>

      <View style={s.fieldGroup}>
        <Text style={s.fieldLabel}>Novo nome de usuário</Text>
        <AppInput
          placeholder="Digite o novo usuário"
          value={usernameDraft}
          onChangeText={onChangeUsername}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={usernameMaxLength}
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
          <Text style={[s.statusText, { color: usernamePalette.textColor }]}>{usernameStatusMessage}</Text>
        </View>
      ) : null}

      <View style={s.fieldGroup}>
        <Text style={s.fieldLabel}>Sua senha atual</Text>
        <AppInput
          placeholder="Digite sua senha atual"
          value={usernamePassword}
          onChangeText={onChangePassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={passwordMaxLength}
        />
      </View>

      <AppButton
        title="Confirmar nome de usuário"
        onPress={onSubmit}
        loading={loading}
        disabled={!canSubmitUsername}
      />

      <AppButton title="Cancelar" onPress={onCancel} variant="secondary" disabled={loading} />
    </View>
  );
}

export function EditProfilePasswordStep({
  currentPassword,
  newPassword,
  confirmNewPassword,
  passwordValidationMessage,
  loading,
  canSubmitPassword,
  onChangeCurrentPassword,
  onChangeNewPassword,
  onChangeConfirmPassword,
  onSubmit,
  onCancel,
  passwordMaxLength,
}: PasswordStepProps) {
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
          onChangeText={onChangeCurrentPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={passwordMaxLength}
        />
      </View>

      <View style={s.fieldGroup}>
        <Text style={s.fieldLabel}>Nova senha</Text>
        <AppInput
          placeholder="Digite a nova senha"
          value={newPassword}
          onChangeText={onChangeNewPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={passwordMaxLength}
        />
      </View>

      <View style={s.fieldGroup}>
        <Text style={s.fieldLabel}>Repita a nova senha</Text>
        <AppInput
          placeholder="Repita a nova senha"
          value={confirmNewPassword}
          onChangeText={onChangeConfirmPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={passwordMaxLength}
        />
      </View>

      {passwordValidationMessage ? (
        <View style={s.inlineHelper}>
          <Text style={s.inlineHelperText}>{passwordValidationMessage}</Text>
        </View>
      ) : null}

      <AppButton title="Confirmar nova senha" onPress={onSubmit} loading={loading} disabled={!canSubmitPassword} />
      <AppButton title="Cancelar" onPress={onCancel} variant="secondary" disabled={loading} />
    </View>
  );
}
