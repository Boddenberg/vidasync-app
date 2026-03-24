import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/components/app-card';
import { Brand, Radii, Typography } from '@/constants/theme';
import type { PanoramaDataset, PanoramaPeriod } from '@/services/progress-panorama';
import { formatDateChip } from '@/features/home/home-utils';

const PERIOD_OPTIONS: PanoramaPeriod[] = [7, 15, 30];

type Props = {
  dataset: PanoramaDataset | null;
  loading: boolean;
  error: string | null;
  period: PanoramaPeriod;
  onSelectPeriod: (period: PanoramaPeriod) => void;
};

export function HistoryPanoramaCard({ dataset, loading, error, period, onSelectPeriod }: Props) {
  const dateLabel = dataset ? formatDateChip(dataset.endDate) : 'Hoje';

  return (
    <AppCard style={s.card}>
      <View style={s.header}>
        <View style={s.iconWrap}>
          <Ionicons name="stats-chart-outline" size={18} color={Brand.greenDark} />
        </View>

        <View style={s.copy}>
          <Text style={s.eyebrow}>Panorama</Text>
          <Text style={s.title}>Visão rápida dos últimos dias</Text>
          <Text style={s.hint}>Um resumo leve para acompanhar seus registros recentes até {dateLabel.toLowerCase()}.</Text>
        </View>
      </View>

      <View style={s.periodRow}>
        {PERIOD_OPTIONS.map((option) => {
          const active = option === period;

          return (
            <Pressable
              key={option}
              accessibilityRole="button"
              onPress={() => onSelectPeriod(option)}
              style={({ pressed }) => [
                s.periodChip,
                active && s.periodChipActive,
                pressed && s.periodChipPressed,
              ]}>
              <Text style={[s.periodChipText, active && s.periodChipTextActive]}>{option} dias</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={s.panel}>
        {loading ? <Text style={s.panelText}>Carregando panorama...</Text> : null}
        {!loading && error ? <Text style={s.panelText}>Não consegui atualizar o panorama agora.</Text> : null}
        {!loading && !error ? <Text style={s.panelText}>Selecione um período para acompanhar seus registros recentes.</Text> : null}
      </View>
    </AppCard>
  );
}

const s = StyleSheet.create({
  card: {
    gap: 16,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: Radii.md,
    backgroundColor: Brand.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: 4,
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
  periodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  periodChip: {
    borderRadius: Radii.pill,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: Brand.surfaceAlt,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  periodChipActive: {
    backgroundColor: Brand.surfaceSoft,
    borderColor: '#CFE5D5',
  },
  periodChipPressed: {
    opacity: 0.92,
  },
  periodChipText: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '800',
  },
  periodChipTextActive: {
    color: Brand.greenDark,
  },
  panel: {
    borderRadius: Radii.lg,
    backgroundColor: Brand.surfaceAlt,
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  panelText: {
    ...Typography.body,
    color: Brand.textSecondary,
  },
});
