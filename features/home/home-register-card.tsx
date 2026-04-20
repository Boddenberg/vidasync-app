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
      <View pointerEvents="none" style={s.actionGlowSecondary} />

      <View style={s.actionTop}>
        <View style={s.actionEyebrowWrap}>
          <Ionicons name="leaf" size={12} color={Brand.greenDeeper} />
          <Text style={s.actionEyebrow}>Registro rápido</Text>
        </View>
        <View style={s.actionDateChip}>
          <Ionicons name="calendar-outline" size={13} color={Brand.greenDark} />
          <Text style={s.actionDateText}>{formatDateChip(selectedDate)}</Text>
        </View>
      </View>

      <View style={s.actionBody}>
        <Text style={s.actionTitle}>O que você comeu?</Text>
        <Text style={s.actionSupport}>Registre com foto, busca ou manualmente — leva segundos.</Text>
      </View>

      <Pressable
        style={({ pressed }) => [s.actionPrimaryButton, pressed && s.actionPrimaryButtonPressed]}
        onPress={onOpenRegisterOptions}>
        <View style={s.actionPrimaryButtonContent}>
          <Ionicons name="restaurant" size={18} color="#FFFFFF" />
          <Text style={s.actionPrimaryButtonText}>Registrar refeição</Text>
        </View>
      </Pressable>

      <View style={s.actionSecondaryRow}>
        <Pressable
          style={({ pressed }) => [s.actionSecondaryButton, pressed && s.actionSecondaryButtonPressed]}
          onPress={onOpenPhoto}>
          <View style={[s.actionSecondaryIconWrap, { backgroundColor: Brand.coralSoft }]}>
            <Ionicons name="camera" size={14} color={Brand.coral} />
          </View>
          <Text style={s.actionSecondaryButtonText}>Foto</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [s.actionSecondaryButton, pressed && s.actionSecondaryButtonPressed]}
          onPress={onOpenSearch}>
          <View style={[s.actionSecondaryIconWrap, { backgroundColor: Brand.mintSoft }]}>
            <Ionicons name="search" size={14} color={Brand.greenDark} />
          </View>
          <Text style={s.actionSecondaryButtonText}>Buscar</Text>
        </Pressable>
      </View>
    </View>
  );
}
