import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, Text, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { Brand } from '@/constants/theme';
import { s } from '@/features/home/home-screen.styles';
import { formatDateChip } from '@/features/home/home-utils';

type Props = {
  selectedDate: string;
  onOpenRegister: () => void;
  onOpenPhotoTool: () => void;
  onOpenSearchTool: () => void;
};

export function HomeRegisterCard({ selectedDate, onOpenRegister, onOpenPhotoTool, onOpenSearchTool }: Props) {
  return (
    <View style={s.actionCard}>
      <Text style={s.sectionTitle}>Registrar refeicao</Text>
      <Text style={s.sectionSub}>
        Tudo que voce salvar aqui entra no resumo de {formatDateChip(selectedDate)}.
      </Text>
      <AppButton title="Registrar refeicao" onPress={onOpenRegister} />
      <View style={s.quickRow}>
        <Shortcut label="Foto" icon="camera-outline" onPress={onOpenPhotoTool} />
        <Shortcut label="Buscar" icon="search-outline" onPress={onOpenSearchTool} />
      </View>
    </View>
  );
}

function Shortcut({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  return (
    <Pressable style={({ pressed }) => [s.shortcut, pressed && s.pressed]} onPress={onPress}>
      <Ionicons name={icon} size={15} color={Brand.greenDark} />
      <Text style={s.shortcutText}>{label}</Text>
    </Pressable>
  );
}
