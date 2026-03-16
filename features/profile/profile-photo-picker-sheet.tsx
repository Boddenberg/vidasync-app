import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, Text, View } from 'react-native';

import { Brand } from '@/constants/theme';
import { s } from '@/features/profile/edit-profile-modal.styles';

type Props = {
  visible: boolean;
  canRemove: boolean;
  onClose: () => void;
  onPickFromCamera: () => void;
  onPickFromGallery: () => void;
  onRemovePhoto: () => void;
};

export function ProfilePhotoPickerSheet({
  visible,
  canRemove,
  onClose,
  onPickFromCamera,
  onPickFromGallery,
  onRemovePhoto,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.ppOverlay} onPress={onClose}>
        <Pressable style={s.ppSheet} onPress={(event) => event.stopPropagation()}>
          <View style={s.ppHandleWrap}>
            <View style={s.ppHandle} />
          </View>
          <Text style={s.ppTitle}>Foto de perfil</Text>

          <View style={s.ppActions}>
            <Pressable style={({ pressed }) => [s.ppBtn, pressed && s.ppBtnPressed]} onPress={onPickFromCamera}>
              <View style={[s.ppIconWrap, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="camera-outline" size={20} color={Brand.greenDark} />
              </View>
              <Text style={s.ppBtnLabel}>Camera</Text>
            </Pressable>

            <View style={s.ppBtnBorder} />

            <Pressable style={({ pressed }) => [s.ppBtn, pressed && s.ppBtnPressed]} onPress={onPickFromGallery}>
              <View style={[s.ppIconWrap, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="images-outline" size={20} color="#1976D2" />
              </View>
              <Text style={s.ppBtnLabel}>Galeria</Text>
            </Pressable>

            {canRemove ? (
              <>
                <View style={s.ppBtnBorder} />
                <Pressable style={({ pressed }) => [s.ppBtn, pressed && s.ppBtnPressed]} onPress={onRemovePhoto}>
                  <View style={[s.ppIconWrap, { backgroundColor: '#FFF0F0' }]}>
                    <Ionicons name="trash-outline" size={20} color={Brand.danger} />
                  </View>
                  <Text style={[s.ppBtnLabel, { color: Brand.danger }]}>Remover foto</Text>
                </Pressable>
              </>
            ) : null}
          </View>

          <Pressable style={({ pressed }) => [s.ppCancelBtn, pressed && s.ppBtnPressed]} onPress={onClose}>
            <Text style={s.ppCancelText}>Cancelar</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
