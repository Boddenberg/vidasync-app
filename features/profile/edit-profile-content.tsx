import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { AppInput } from '@/components/app-input';
import { BmiCalculatorCard } from '@/components/health/bmi-calculator-card';
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
  showDeveloperTools: boolean;
  loading: boolean;
  onOpenUsername: () => void;
  onOpenPassword: () => void;
  onSavePhoto: () => void;
  onOpenFeedback: () => void;
  onOpenBmi: () => void;
  onOpenDeveloperTools: () => void;
  onLogout: () => void;
};

type UsernameStepProps = {
  currentUsername: string;
  usernameDraft: string;
  usernameStatusMessage: string | null;
  usernamePalette: StatusPalette;
  loading: boolean;
  canSubmitUsername: boolean;
  onChangeUsername: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  usernameMaxLength: number;
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

type PasswordFieldProps = {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  maxLength: number;
};

function PasswordField({ label, placeholder, value, onChangeText, maxLength }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={s.fieldGroup}>
      <Text style={s.fieldLabel}>{label}</Text>
      <View style={s.passwordInputWrap}>
        <AppInput
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={maxLength}
          style={s.passwordInput}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={visible ? 'Ocultar senha' : 'Mostrar senha'}
          hitSlop={8}
          onPress={() => setVisible((current) => !current)}
          style={({ pressed }) => [s.passwordToggle, pressed && s.passwordTogglePressed]}>
          <Ionicons
            name={visible ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color={Brand.textSecondary}
          />
        </Pressable>
      </View>
    </View>
  );
}

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
  showDeveloperTools,
  loading,
  onOpenUsername,
  onOpenPassword,
  onSavePhoto,
  onOpenFeedback,
  onOpenBmi,
  onOpenDeveloperTools,
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

      {photoChanged ? <AppButton title="Salvar alteração da foto" onPress={onSavePhoto} loading={loading} /> : null}

      <View style={s.utilityGroup}>
        <AppButton title="Enviar feedback" onPress={onOpenFeedback} variant="secondary" disabled={loading} />
        <AppButton title="Calculadora de IMC" onPress={onOpenBmi} variant="secondary" disabled={loading} />
        {showDeveloperTools ? (
          <AppButton
            title="Observabilidade"
            onPress={onOpenDeveloperTools}
            variant="secondary"
            disabled={loading}
          />
        ) : null}
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
  usernameStatusMessage,
  usernamePalette,
  loading,
  canSubmitUsername,
  onChangeUsername,
  onSubmit,
  onCancel,
  usernameMaxLength,
}: UsernameStepProps) {
  return (
    <View style={s.formCard}>
      <Text style={s.sectionTitle}>Alterar nome de usuário</Text>
      <Text style={s.sectionSubtitle}>Escolha um nome novo e salve quando ele estiver disponivel.</Text>

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

      <AppButton title="Salvar nome de usuário" onPress={onSubmit} loading={loading} disabled={!canSubmitUsername} />
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

      <PasswordField
        label="Senha atual"
        placeholder="Digite sua senha atual"
        value={currentPassword}
        onChangeText={onChangeCurrentPassword}
        maxLength={passwordMaxLength}
      />

      <PasswordField
        label="Nova senha"
        placeholder="Digite a nova senha"
        value={newPassword}
        onChangeText={onChangeNewPassword}
        maxLength={passwordMaxLength}
      />

      <PasswordField
        label="Repita a nova senha"
        placeholder="Repita a nova senha"
        value={confirmNewPassword}
        onChangeText={onChangeConfirmPassword}
        maxLength={passwordMaxLength}
      />

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

export function EditProfileBmiStep() {
  return (
    <View style={s.formCard}>
      <BmiCalculatorCard
        title="Calculadora de IMC"
        subtitle="Use peso e altura para uma leitura rapida sem sair dos ajustes do perfil."
      />
    </View>
  );
}
