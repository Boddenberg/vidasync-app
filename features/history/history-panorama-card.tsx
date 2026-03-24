import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/components/app-card';
import { Brand, Radii, Typography } from '@/constants/theme';
import {
  formatCaloriesAverage,
  formatWaterAverage,
  getAverageCalories,
  getAverageWaterMl,
  getDaysWithRecords,
  getMetricValue,
  getPanoramaDays,
} from '@/features/history/history-panorama-utils';
import { formatDateChip } from '@/features/home/home-utils';
import type { PanoramaDataset, PanoramaMetric, PanoramaPeriod } from '@/services/progress-panorama';

const PERIOD_OPTIONS: PanoramaPeriod[] = [7, 15, 30];
const METRIC_OPTIONS: Array<{ key: PanoramaMetric; label: string }> = [
  { key: 'water', label: 'Água' },
  { key: 'calories', label: 'Calorias' },
  { key: 'meals', label: 'Refeições' },
];

type Props = {
  dataset: PanoramaDataset | null;
  loading: boolean;
  error: string | null;
  period: PanoramaPeriod;
  metric: PanoramaMetric;
  onSelectPeriod: (period: PanoramaPeriod) => void;
  onSelectMetric: (metric: PanoramaMetric) => void;
};

export function HistoryPanoramaCard({
  dataset,
  loading,
  error,
  period,
  metric,
  onSelectPeriod,
  onSelectMetric,
}: Props) {
  const dateLabel = dataset ? formatDateChip(dataset.endDate) : 'Hoje';
  const visibleDays = getPanoramaDays(dataset, period);
  const daysWithRecords = getDaysWithRecords(visibleDays);
  const averageWater = getAverageWaterMl(visibleDays);
  const averageCalories = getAverageCalories(visibleDays);
  const selectedMetricLabel = METRIC_OPTIONS.find((item) => item.key === metric)?.label ?? 'Água';
  const selectedMetricTotal = visibleDays.reduce((sum, day) => sum + getMetricValue(day, metric), 0);

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

      <View style={s.summaryGrid}>
        <View style={s.summaryCard}>
          <Text style={s.summaryLabel}>Água média por dia</Text>
          <Text style={s.summaryValue}>{formatWaterAverage(averageWater)}</Text>
        </View>

        <View style={s.summaryCard}>
          <Text style={s.summaryLabel}>Calorias médias por dia</Text>
          <Text style={s.summaryValue}>{formatCaloriesAverage(averageCalories)}</Text>
        </View>

        <View style={s.summaryCard}>
          <Text style={s.summaryLabel}>Dias com registro</Text>
          <Text style={s.summaryValue}>
            {daysWithRecords}/{period}
          </Text>
        </View>
      </View>

      <View style={s.metricRow}>
        {METRIC_OPTIONS.map((option) => {
          const active = option.key === metric;

          return (
            <Pressable
              key={option.key}
              accessibilityRole="button"
              onPress={() => onSelectMetric(option.key)}
              style={({ pressed }) => [
                s.metricChip,
                active && s.metricChipActive,
                pressed && s.metricChipPressed,
              ]}>
              <Text style={[s.metricChipText, active && s.metricChipTextActive]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={s.panel}>
        {loading ? <Text style={s.panelText}>Carregando panorama...</Text> : null}
        {!loading && error ? <Text style={s.panelText}>Não consegui atualizar o panorama agora.</Text> : null}
        {!loading && !error ? (
          <Text style={s.panelText}>
            {selectedMetricLabel} no período: {Math.round(selectedMetricTotal).toLocaleString('pt-BR')}.
          </Text>
        ) : null}
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
  summaryGrid: {
    gap: 10,
  },
  summaryCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Brand.border,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 6,
  },
  summaryLabel: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '700',
  },
  summaryValue: {
    ...Typography.subtitle,
    color: Brand.text,
    fontWeight: '800',
  },
  metricRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricChip: {
    borderRadius: Radii.pill,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: Brand.card,
    borderWidth: 1,
    borderColor: Brand.border,
  },
  metricChipActive: {
    backgroundColor: Brand.sageMist,
    borderColor: '#C8DDD0',
  },
  metricChipPressed: {
    opacity: 0.92,
  },
  metricChipText: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '800',
  },
  metricChipTextActive: {
    color: Brand.greenDark,
  },
});
