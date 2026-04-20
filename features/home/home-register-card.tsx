import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Brand, Radii, Shadows, Typography } from '@/constants/theme';

type Props = {
  selectedDate: string;
  onOpenRegisterOptions: () => void;
  onOpenSearch?: () => void;
  onOpenPhoto?: () => void;
};

export function HomeRegisterCard({
  onOpenRegisterOptions,
  onOpenSearch = onOpenRegisterOptions,
  onOpenPhoto = onOpenRegisterOptions,
}: Props) {
  return (
    <View style={s.card}>
      <View pointerEvents="none" style={s.glow} />

      <View style={s.heading}>
        <View style={s.iconWrap}>
          <Ionicons name="restaurant" size={20} color={Brand.greenDeeper} />
        </View>
        <View style={s.headingCopy}>
          <Text style={s.title}>O que você comeu?</Text>
          <Text style={s.support}>Registre em segundos</Text>
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [s.primaryButton, pressed && s.primaryButtonPressed]}
        onPress={onOpenRegisterOptions}>
        <View style={s.primaryContent}>
          <View style={s.primaryIconWrap}>
            <Ionicons name="add" size={18} color={Brand.greenDeeper} />
          </View>
          <Text style={s.primaryText}>Registrar refeição</Text>
          <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
        </View>
      </Pressable>

      <View style={s.secondaryRow}>
        <Pressable
          style={({ pressed }) => [s.secondaryBtn, pressed && s.secondaryBtnPressed]}
          onPress={onOpenPhoto}>
          <View style={[s.secondaryIconWrap, { backgroundColor: Brand.coralSoft }]}>
            <Ionicons name="camera" size={16} color={Brand.coral} />
          </View>
          <View style={s.secondaryCopy}>
            <Text style={s.secondaryLabel}>Foto</Text>
            <Text style={s.secondaryHint}>Identifica por IA</Text>
          </View>
        </Pressable>

        <Pressable
          style={({ pressed }) => [s.secondaryBtn, pressed && s.secondaryBtnPressed]}
          onPress={onOpenSearch}>
          <View style={[s.secondaryIconWrap, { backgroundColor: Brand.hydrationBg }]}>
            <Ionicons name="search" size={16} color={Brand.hydration} />
          </View>
          <View style={s.secondaryCopy}>
            <Text style={s.secondaryLabel}>Buscar</Text>
            <Text style={s.secondaryHint}>Base de alimentos</Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.xxl,
    borderWidth: 1,
    borderColor: 'rgba(20,108,56,0.08)',
    padding: 20,
    gap: 16,
    overflow: 'hidden',
    ...Shadows.floating,
  },
  glow: {
    position: 'absolute',
    top: -80,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(244,166,42,0.10)',
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Brand.mintSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headingCopy: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 20,
    lineHeight: 24,
    color: Brand.text,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  support: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
  primaryButton: {
    minHeight: 58,
    borderRadius: 18,
    backgroundColor: Brand.greenDark,
    paddingHorizontal: 16,
    justifyContent: 'center',
    ...Shadows.card,
  },
  primaryButtonPressed: {
    backgroundColor: Brand.greenDeeper,
    transform: [{ scale: 0.99 }],
  },
  primaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  primaryIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    flex: 1,
    ...Typography.body,
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.1,
    textAlign: 'left',
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(21,32,24,0.08)',
    backgroundColor: '#F7FAF7',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  secondaryBtnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  secondaryIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryCopy: {
    flex: 1,
    gap: 1,
  },
  secondaryLabel: {
    ...Typography.caption,
    color: Brand.text,
    fontWeight: '800',
    fontSize: 14,
  },
  secondaryHint: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '600',
    fontSize: 11,
  },
});
