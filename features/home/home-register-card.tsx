import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, Text, View } from 'react-native';

import { Brand } from '@/constants/theme';
import { s } from '@/features/home/home-screen.styles';
import { formatDateChip } from '@/features/home/home-utils';

type Props = {
  selectedDate: string;
  onOpenRegisterOptions: () => void;
  onOpenSearch?: () => void;
  onOpenPhoto?: () => void;
};

export function HomeRegisterCard({
  selectedDate,
  onOpenRegisterOptions,
  onOpenSearch = onOpenRegisterOptions,
  onOpenPhoto = onOpenRegisterOptions,
}: Props) {
  return (
    <View style={s.actionCard}>
      <View pointerEvents="none" style={s.actionGlow} />

      <View style={s.actionTop}>
        <Text style={s.actionEyebrow}>Registro rapido</Text>
        <View style={s.actionDateChip}>
          <Text style={s.actionDateText}>{formatDateChip(selectedDate)}</Text>
        </View>
      </View>

      <View style={s.actionBody}>
        <Text style={s.actionTitle}>Registrar refeicao</Text>
        <Text style={s.actionSupport}>Adicione sua proxima refeicao.</Text>
      </View>

      <Pressable
        style={({ pressed }) => [s.actionPrimaryButton, pressed && s.actionPrimaryButtonPressed]}
        onPress={onOpenRegisterOptions}>
        <View style={s.actionPrimaryButtonContent}>
          <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
          <Text style={s.actionPrimaryButtonText}>Registrar refeicao</Text>
        </View>
      </Pressable>

      <View style={s.actionSecondaryRow}>
        <Pressable
          style={({ pressed }) => [s.actionSecondaryButton, pressed && s.actionSecondaryButtonPressed]}
          onPress={onOpenPhoto}>
          <Ionicons name="camera-outline" size={16} color={Brand.coral} />
          <Text style={s.actionSecondaryButtonText}>Foto</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [s.actionSecondaryButton, pressed && s.actionSecondaryButtonPressed]}
          onPress={onOpenSearch}>
          <Ionicons name="search-outline" size={16} color={Brand.greenDark} />
          <Text style={s.actionSecondaryButtonText}>Buscar</Text>
        </Pressable>
      </View>
    </View>
  );
}
