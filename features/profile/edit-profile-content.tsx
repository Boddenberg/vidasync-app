import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { AppInput } from '@/components/app-input';
import { BmiCalculatorCard } from '@/components/health/bmi-calculator-card';
import { Brand, type ThemePaletteKey } from '@/constants/theme';
import { s } from '@/features/profile/edit-profile-modal.styles';

type StatusPalette = {
  backgroundColor: string;
  borderColor: string;
  textColor: string;
};

type ThemeOption = {
  key: ThemePaletteKey;
  label: string;
  description: string;
  preview: readonly [string, string, string];
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
  activeTheme: ThemeOption;
  onOpenUsername: () => void;
  onOpenPassword: () => void;
  onOpenTheme: () => void;
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

type ThemeStepProps = {
  activeThemeKey: ThemePaletteKey;
  selectedThemeKey: ThemePaletteKey;
  themeOptions: readonly ThemeOption[];
  loading: boolean;
  onSelectTheme: (value: ThemePaletteKey) => void;
  onSubmit: () => void;
  onCancel: () => void;
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

function ThemePalettePreview({ preview }: { preview: ThemeOption['preview'] }) {
  return (
    <View style={s.themeSwatches}>
      {preview.map((color, index) => (
        <View key={`${color}-${index}`} style={[s.themeSwatch, { backgroundColor: color }]} />
      ))}
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
  activeTheme,
  onOpenUsername,
  onOpenPassword,
  onOpenTheme,
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
          <Text style={s.currentLabel}>Usuario atual</Text>
          <Text style={s.currentValue}>{currentUsername}</Text>
          <Text style={s.infoHint}>Toque para alterar o nome de usuario</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={Brand.textSecondary} />
      </Pressable>

      <Pressable style={({ pressed }) => [s.actionCard, pressed && s.cardPressed]} onPress={onOpenTheme}>
        <View style={[s.actionIcon, { backgroundColor: activeTheme.preview[2] }]}>
          <Ionicons name="color-palette-outline" size={20} color={activeTheme.preview[0]} />
        </View>
        <View style={s.actionCopy}>
          <Text style={s.actionTitle}>Paleta do app</Text>
          <Text style={s.actionDescription}>{activeTheme.label}</Text>
        </View>
        <ThemePalettePreview preview={activeTheme.preview} />
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

      {photoChanged ? <AppButton title="Salvar alteracao da foto" onPress={onSavePhoto} loading={loading} /> : null}

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
      <Text style={s.sectionTitle}>Alterar nome de usuario</Text>
      <Text style={s.sectionSubtitle}>Escolha um nome novo e salve quando ele estiver disponivel.</Text>

      <View style={s.currentInfo}>
        <Text style={s.currentLabel}>Usuario atual</Text>
        <Text style={s.currentValue}>{currentUsername}</Text>
      </View>

      <View style={s.fieldGroup}>
        <Text style={s.fieldLabel}>Novo nome de usuario</Text>
        <AppInput
          placeholder="Digite o novo usuario"
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

      <AppButton title="Salvar nome de usuario" onPress={onSubmit} loading={loading} disabled={!canSubmitUsername} />
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

export function EditProfileThemeStep({
  activeThemeKey,
  selectedThemeKey,
  themeOptions,
  loading,
  onSelectTheme,
  onSubmit,
  onCancel,
}: ThemeStepProps) {
  const hasPendingChange = selectedThemeKey !== activeThemeKey;

  return (
    <View style={s.formCard}>
      <Text style={s.sectionTitle}>Escolha a paleta do app</Text>
      <Text style={s.sectionSubtitle}>
        A nova paleta sera aplicada ao app inteiro. Para atualizar todas as telas, o app recarrega logo depois.
      </Text>

      <View style={s.themeOptionList}>
        {themeOptions.map((option) => {
          const selected = option.key === selectedThemeKey;
          const active = option.key === activeThemeKey;

          return (
            <Pressable
              key={option.key}
              onPress={() => onSelectTheme(option.key)}
              style={({ pressed }) => [
                s.themeOptionCard,
                selected && s.themeOptionCardSelected,
                pressed && s.cardPressed,
              ]}>
              <View style={s.themeOptionHeader}>
                <View style={s.themeOptionCopy}>
                  <View style={s.themeOptionTitleRow}>
                    <Text style={s.themeOptionTitle}>{option.label}</Text>
                    {active ? (
                      <View style={s.themeActiveBadge}>
                        <Text style={s.themeActiveBadgeText}>Ativa</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={s.themeOptionDescription}>{option.description}</Text>
                </View>
                <Ionicons
                  name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                  size={22}
                  color={selected ? option.preview[0] : Brand.textMuted}
                />
              </View>

              <ThemePalettePreview preview={option.preview} />
            </Pressable>
          );
        })}
      </View>

      <AppButton
        title={hasPendingChange ? 'Aplicar paleta e recarregar' : 'Paleta atual selecionada'}
        onPress={onSubmit}
        loading={loading}
        disabled={!hasPendingChange}
      />
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
