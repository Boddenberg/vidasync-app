import Ionicons from '@expo/vector-icons/Ionicons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

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
  caption: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  featured?: boolean;
  gradientFrom?: string;
  gradientTo?: string;
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

          <View style={s.header}>
            <Text style={s.eyebrow}>NOVA REFEIÇÃO</Text>
            <Text style={s.title}>Como você quer registrar?</Text>
          </View>

          <View style={s.grid}>
            <OptionCard
              label="Buscar"
              caption="Por nome"
              icon="search"
              iconColor="#FFFFFF"
              iconBg="rgba(255,255,255,0.24)"
              featured
              gradientFrom={Brand.fresh}
              gradientTo={Brand.forest}
              onPress={onOpenSearch}
            />
            <OptionCard
              label="Salvos"
              caption="Meus pratos"
              icon="bookmark"
              iconColor={Brand.greenDeeper}
              iconBg={Brand.surfaceSoft}
              onPress={onOpenSavedDishes}
            />
            <OptionCard
              label="Foto"
              caption="Analisar imagem"
              icon="camera"
              iconColor={Brand.mango}
              iconBg="#FFF4DD"
              onPress={onOpenPhoto}
            />
            <OptionCard
              label="Manual"
              caption="Compor do zero"
              icon="create"
              iconColor={Brand.sky}
              iconBg={Brand.hydrationBg}
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

function OptionCard({
  label,
  caption,
  icon,
  iconColor,
  iconBg,
  featured,
  gradientFrom,
  gradientTo,
  onPress,
}: OptionCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [s.optionCard, featured && s.optionCardFeatured, pressed && s.pressed]}
      onPress={onPress}>
      {featured && gradientFrom && gradientTo ? (
        <View style={StyleSheet.absoluteFill}>
          <Svg width="100%" height="100%">
            <Defs>
              <LinearGradient id={`grad-${label}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={gradientFrom} stopOpacity="1" />
                <Stop offset="100%" stopColor={gradientTo} stopOpacity="1" />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" rx="22" ry="22" fill={`url(#grad-${label})`} />
          </Svg>
        </View>
      ) : null}

      <View style={[s.optionIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>

      <Text style={[s.optionLabel, featured && s.optionLabelFeatured]}>{label}</Text>
      <Text style={[s.optionCaption, featured && s.optionCaptionFeatured]}>{caption}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(16, 32, 22, 0.36)',
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  sheet: {
    backgroundColor: Brand.bg,
    borderRadius: 30,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 22,
    gap: 14,
    ...Shadows.floating,
  },
  handle: {
    width: 42,
    height: 4,
    borderRadius: Radii.pill,
    backgroundColor: Brand.border,
    alignSelf: 'center',
    marginBottom: 4,
  },
  header: {
    gap: 4,
    paddingHorizontal: 4,
  },
  eyebrow: {
    ...Typography.caption,
    fontSize: 10,
    color: Brand.greenDark,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  title: {
    ...Typography.subtitle,
    fontSize: 19,
    lineHeight: 23,
    color: Brand.text,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionCard: {
    flexBasis: '48%',
    flexGrow: 1,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(20,108,56,0.08)',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 6,
    overflow: 'hidden',
    ...Shadows.card,
  },
  optionCardFeatured: {
    borderWidth: 0,
    ...Shadows.floating,
  },
  optionIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  optionLabel: {
    ...Typography.body,
    fontSize: 15,
    color: Brand.text,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  optionLabelFeatured: {
    color: '#FFFFFF',
  },
  optionCaption: {
    ...Typography.caption,
    fontSize: 11,
    color: Brand.textSecondary,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  optionCaptionFeatured: {
    color: 'rgba(255,255,255,0.86)',
  },
  cancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderRadius: Radii.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Brand.border,
  },
  cancelText: {
    ...Typography.body,
    fontSize: 14,
    color: Brand.textSecondary,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
});
