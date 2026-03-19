/**
 * Modal de perfil com fluxos separados para foto, usuario e senha.
 */

import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';

import {
  EditProfileBmiStep,
  EditProfileOverviewStep,
  EditProfilePasswordStep,
  EditProfileUsernameStep,
  ProfileAvatarHeader,
  ProfileMessageBanner,
} from '@/features/profile/edit-profile-content';
import { s } from '@/features/profile/edit-profile-modal.styles';
import { ProfilePhotoPickerSheet } from '@/features/profile/profile-photo-picker-sheet';
import { useEditProfileModal } from '@/features/profile/use-edit-profile-modal';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function EditProfileModal({ visible, onClose }: Props) {
  const profile = useEditProfileModal({ onClose });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={profile.handleBack}
      onShow={profile.handleOpen}>
      <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.header}>
          <Pressable onPress={profile.handleBack} hitSlop={12}>
            <Text style={s.headerAction}>{profile.step === 'overview' ? 'Fechar' : 'Voltar'}</Text>
          </Pressable>
          <Text style={s.headerTitle}>{profile.title}</Text>
          <View style={s.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {profile.step !== 'bmi' ? (
            <ProfileAvatarHeader
              currentUsername={profile.currentUsername}
              displayPhoto={profile.displayPhoto}
              onPress={profile.handlePickPhoto}
            />
          ) : null}

          {profile.error ? <ProfileMessageBanner tone="error" message={profile.error} /> : null}
          {profile.success ? <ProfileMessageBanner tone="success" message={profile.success} /> : null}

          {profile.step === 'overview' ? (
            <EditProfileOverviewStep
              currentUsername={profile.currentUsername}
              photoChanged={profile.photoChanged}
              loading={profile.loading}
              onOpenUsername={profile.openUsernameFlow}
              onOpenPassword={profile.openPasswordFlow}
              onSavePhoto={profile.handleSavePhoto}
              onOpenFeedback={profile.handleOpenFeedback}
              onOpenBmi={profile.handleOpenBmi}
              onOpenLogs={profile.handleOpenLogs}
              onLogout={profile.handleLogout}
            />
          ) : null}

          {profile.step === 'username' ? (
            <EditProfileUsernameStep
              currentUsername={profile.currentUsername}
              usernameDraft={profile.usernameDraft}
              usernamePassword={profile.usernamePassword}
              usernameStatusMessage={profile.usernameStatusMessage}
              usernamePalette={profile.usernamePalette}
              loading={profile.loading}
              canSubmitUsername={profile.canSubmitUsername}
              onChangeUsername={profile.setUsernameDraft}
              onChangePassword={profile.setUsernamePassword}
              onSubmit={profile.handleSaveUsername}
              onCancel={profile.handleBack}
              usernameMaxLength={profile.usernameMaxLength}
              passwordMaxLength={profile.passwordMaxLength}
            />
          ) : null}

          {profile.step === 'password' ? (
            <EditProfilePasswordStep
              currentPassword={profile.currentPassword}
              newPassword={profile.newPassword}
              confirmNewPassword={profile.confirmNewPassword}
              passwordValidationMessage={profile.passwordValidationMessage}
              loading={profile.loading}
              canSubmitPassword={profile.canSubmitPassword}
              onChangeCurrentPassword={profile.setCurrentPassword}
              onChangeNewPassword={profile.setNewPassword}
              onChangeConfirmPassword={profile.setConfirmNewPassword}
              onSubmit={profile.handleSavePassword}
              onCancel={profile.handleBack}
              passwordMaxLength={profile.passwordMaxLength}
            />
          ) : null}

          {profile.step === 'bmi' ? <EditProfileBmiStep /> : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <ProfilePhotoPickerSheet
        visible={profile.photoPickerVisible}
        canRemove={Boolean(profile.displayPhoto)}
        onClose={() => profile.setPhotoPickerVisible(false)}
        onPickFromCamera={profile.pickFromCamera}
        onPickFromGallery={profile.pickFromGallery}
        onRemovePhoto={profile.removePhoto}
      />
    </Modal>
  );
}
