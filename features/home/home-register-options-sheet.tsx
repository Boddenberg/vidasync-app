import Ionicons from '@expo/vector-icons/Ionicons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Brand, Radii, Shadows, Typography } from '@/constants/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  onOpenSearch: () => void;
  onOpenSavedDishes: () => void;
  onOpenPhoto: () => void;
  onOpenManual: () => void;
};

type OptionCardProps = {
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  featured?: boolean;
  onPress: () => void;
};

export function HomeRegisterOptionsSheet({
  visible,
  onClose,
  onOpenSearch,
  onOpenSavedDishes,
  onOpenPhoto,
  onOpenManual,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable style={s.sheet} onPress={(event) => event.stopPropagation()}>
          <View style={s.handle} />
          <Text style={s.title}>Registrar refeição</Text>
          <Text style={s.subtitle}>Escolha o caminho mais rápido para lançar sua refeição sem perder o contexto do dia.</Text>

          <View style={s.options}>
            <OptionCard
              label="Buscar alimento"
              description="Digite o nome e calcule os macros automaticamente."
              icon="search-outline"
              featured
              onPress={onOpenSearch}
            />
            <OptionCard
              label="Usar pratos salvos"
              description="Reaproveite uma refeição que você já montou."
              icon="restaurant-outline"
              featured
              onPress={onOpenSavedDishes}
            />
            <OptionCard
              label="Usar foto"
              description="Envie uma imagem para analisar a refeição."
              icon="camera-outline"
              onPress={onOpenPhoto}
            />
            <OptionCard
              label="Registrar manualmente"
              description="Monte ingredientes, horário e tipo da refeição."
              icon="create-outline"
              onPress={onOpenManual}
            />
          </View>

          <Pressable style={({ pressed }) => [s.cancelButton, pressed && s.pressed]} onPress={onClose}>
            <Text style={s.cancelText}>Cancelar</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function OptionCard({ label, description, icon, featured, onPress }: OptionCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        s.optionCard,
        featured && s.optionCardFeatured,
        pressed && s.pressed,
      ]}
      onPress={onPress}>
      <View style={[s.optionIcon, featured && s.optionIconFeatured]}>
        <Ionicons name={icon} size={18} color={featured ? '#FFFFFF' : Brand.greenDark} />
      </View>
      <View style={s.optionCopy}>
        <Text style={s.optionLabel}>{label}</Text>
        <Text style={s.optionDescription}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={Brand.textMuted} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(20, 32, 24, 0.24)',
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  sheet: {
    backgroundColor: Brand.bg,
    borderRadius: Radii.xxl,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 26,
    gap: 14,
    ...Shadows.floating,
  },
  handle: {
    width: 42,
    height: 4,
    borderRadius: Radii.pill,
    backgroundColor: Brand.border,
    alignSelf: 'center',
  },
  title: {
    ...Typography.subtitle,
    color: Brand.text,
    fontWeight: '800',
  },
  subtitle: {
    ...Typography.body,
    color: Brand.textSecondary,
    marginTop: -6,
  },
  options: {
    gap: 10,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 22,
    backgroundColor: Brand.card,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: 15,
  },
  optionCardFeatured: {
    backgroundColor: Brand.surfaceSoft,
    borderColor: '#CFE3D7',
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 18,
    backgroundColor: Brand.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconFeatured: {
    backgroundColor: Brand.greenDark,
  },
  optionCopy: {
    flex: 1,
    gap: 3,
  },
  optionLabel: {
    ...Typography.body,
    color: Brand.text,
    fontWeight: '800',
  },
  optionDescription: {
    ...Typography.helper,
    color: Brand.textSecondary,
  },
  cancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    borderRadius: 20,
    backgroundColor: Brand.card,
    borderWidth: 1,
    borderColor: Brand.border,
  },
  cancelText: {
    ...Typography.body,
    color: Brand.textSecondary,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
});
