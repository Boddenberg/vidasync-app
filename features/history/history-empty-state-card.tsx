import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { Brand, Radii, Shadows, Typography } from '@/constants/theme';
import { dayHeading } from '@/features/history/history-utils';

type Props = {
  selectedDate: string;
};

export function HistoryEmptyStateCard({ selectedDate }: Props) {
  return (
    <View style={s.card}>
      <View pointerEvents="none" style={s.glowTop} />
      <View pointerEvents="none" style={s.glowBottom} />

      <View style={s.iconWrap}>
        <Ionicons name="sparkles-outline" size={22} color={Brand.greenDark} />
      </View>

      <View style={s.copy}>
        <Text style={s.eyebrow}>Painel do dia</Text>
        <Text style={s.title}>{'Ainda n\u00E3o sei como foi seu dia'}</Text>
        <Text style={s.hint}>
          {`Registre uma refei\u00E7\u00E3o ou um consumo de \u00E1gua e eu monto o panorama de ${dayHeading(selectedDate)} aqui.`}
        </Text>
      </View>

      <View style={s.chipRow}>
        <View style={[s.chip, s.chipMeals]}>
          <Ionicons name="restaurant-outline" size={16} color={Brand.greenDark} />
          <Text style={s.chipText}>Pratos</Text>
        </View>
        <View style={[s.chip, s.chipWater]}>
          <Ionicons name="water-outline" size={16} color={Brand.hydration} />
          <Text style={s.chipText}>{'\u00C1gua'}</Text>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: Brand.card,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: 22,
    gap: 16,
    overflow: 'hidden',
    ...Shadows.card,
  },
  glowTop: {
    position: 'absolute',
    top: -64,
    right: -34,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(31, 167, 80, 0.10)',
  },
  glowBottom: {
    position: 'absolute',
    left: -30,
    bottom: -56,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(45, 156, 219, 0.10)',
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.surfaceSoft,
  },
  copy: {
    gap: 6,
  },
  eyebrow: {
    ...Typography.caption,
    color: Brand.greenDark,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  title: {
    ...Typography.subtitle,
    color: Brand.text,
    fontWeight: '800',
  },
  hint: {
    ...Typography.body,
    color: Brand.textSecondary,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: Radii.pill,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chipMeals: {
    backgroundColor: Brand.surfaceSoft,
  },
  chipWater: {
    backgroundColor: Brand.hydrationBg,
  },
  chipText: {
    ...Typography.caption,
    color: Brand.text,
    fontWeight: '700',
  },
});
