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

type ActionRowProps = {
  title: string;
  description?: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  disabled?: boolean;
  onPress: () => void;
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

function ActionRow({ title, description, icon, iconColor, iconBg, disabled, onPress }: ActionRowProps) {
  return (
    <Pressable
      disabled={disabled}
      style={({ pressed }) => [s.actionCard, pressed && s.cardPressed, disabled && { opacity: 0.5 }]}
      onPress={onPress}>
      <View style={[s.actionIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={19} color={iconColor} />
      </View>
      <View style={s.actionCopy}>
        <Text style={s.actionTitle}>{title}</Text>
        {description ? <Text style={s.actionDescription}>{description}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={17} color={Brand.textMuted} />
    </Pressable>
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
      <Text style={s.avatarHint}>Toque para alterar foto</Text>
    </>
  );
}

export function ProfileMessageBanner({ tone, message }: BannerProps) {
  const toneBox = tone === 'error' ? s.errorBox : s.successBox;
  const toneText = tone === 'error' ? s.errorText : s.successText;
  const iconName = tone === 'error' ? 'alert-circle' : 'checkmark-circle';
  const iconColor = tone === 'error' ? Brand.danger : Brand.greenDark;

  return (
    <View style={[s.messageBox, toneBox]}>
      <Ionicons name={iconName} size={16} color={iconColor} />
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
      <Text style={s.sectionLabel}>CONTA</Text>

      <Pressable style={({ pressed }) => [s.infoCard, pressed && s.cardPressed]} onPress={onOpenUsername}>
        <View style={[s.actionIcon, { backgroundColor: Brand.surfaceSoft }]}>
          <Ionicons name="person" size={19} color={Brand.greenDeeper} />
        </View>
        <View style={s.infoCopy}>
          <Text style={s.actionTitle}>{currentUsername}</Text>
          <Text style={s.infoHint}>Alterar nome de usuário</Text>
        </View>
        <Ionicons name="chevron-forward" size={17} color={Brand.textMuted} />
      </Pressable>

      <ActionRow
        title="Alterar senha"
        description="Defina uma nova senha segura"
        icon="lock-closed"
        iconColor="#2563EB"
        iconBg="#EEF4FF"
        disabled={loading}
        onPress={onOpenPassword}
      />

      {photoChanged ? (
        <AppButton title="Salvar alteração da foto" onPress={onSavePhoto} loading={loading} />
      ) : null}

      <Text style={s.sectionLabel}>FERRAMENTAS</Text>

      <View style={s.utilityGroup}>
        <ActionRow
          title="Calculadora de IMC"
          description="Acompanhe peso e altura"
          icon="fitness"
          iconColor={Brand.coral}
          iconBg="#FFE8E1"
          disabled={loading}
          onPress={onOpenBmi}
        />

        <ActionRow
          title="Enviar feedback"
          description="Compartilhe sugestões"
          icon="chatbubble-ellipses"
          iconColor={Brand.mango}
          iconBg="#FFF4DD"
          disabled={loading}
          onPress={onOpenFeedback}
        />

        {showDeveloperTools ? (
          <ActionRow
            title="Observabilidade"
            description="Dashboards internos"
            icon="terminal"
            iconColor={Brand.indigo}
            iconBg="#EEF0FF"
            disabled={loading}
            onPress={onOpenDeveloperTools}
          />
        ) : null}
      </View>

      <Pressable style={({ pressed }) => [s.logoutBtn, pressed && s.cardPressed]} onPress={onLogout}>
        <Ionicons name="log-out-outline" size={16} color={Brand.danger} />
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
      <Text style={s.sectionSubtitle}>Escolha um nome novo e salve quando estiver disponível.</Text>

      <View style={s.currentInfo}>
        <Text style={s.currentLabel}>Usuário atual</Text>
        <Text style={s.currentValue}>{currentUsername}</Text>
      </View>

      <View style={s.fieldGroup}>
        <Text style={s.fieldLabel}>Novo usuário</Text>
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
        subtitle="Use peso e altura para uma leitura rápida sem sair dos ajustes do perfil."
      />
    </View>
  );
}
