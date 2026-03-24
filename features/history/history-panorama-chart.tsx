import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { Brand, Radii, Typography } from '@/constants/theme';
import { formatChartTick, formatMetricPeakValue, getMetricValue } from '@/features/history/history-panorama-utils';
import type { PanoramaDay, PanoramaMetric } from '@/services/progress-panorama';

type Props = {
  days: PanoramaDay[];
  metric: PanoramaMetric;
};

function getMetricTone(metric: PanoramaMetric) {
  if (metric === 'water') {
    return { fill: Brand.hydration, track: '#D9EEF9', accent: Brand.hydrationBg };
  }

  if (metric === 'meals') {
    return { fill: Brand.orange, track: '#FDECCC', accent: '#FFF6E6' };
  }

  return { fill: Brand.greenDark, track: '#DDEFE3', accent: Brand.surfaceSoft };
}

export function HistoryPanoramaChart({ days, metric }: Props) {
  const values = days.map((day) => getMetricValue(day, metric));
  const maxValue = Math.max(0, ...values);
  const tone = getMetricTone(metric);
  const labelStep = days.length <= 7 ? 1 : days.length <= 15 ? 2 : 5;

  if (maxValue <= 0) {
    return (
      <View style={s.emptyState}>
        <View style={[s.emptyIconWrap, { backgroundColor: tone.accent }]}>
          <Ionicons name="bar-chart-outline" size={18} color={tone.fill} />
        </View>
        <Text style={s.emptyTitle}>Ainda não há registros neste período</Text>
        <Text style={s.emptyHint}>Quando você lançar água ou refeições, o gráfico diário aparece aqui.</Text>
      </View>
    );
  }

  return (
    <View style={s.chartShell}>
      <View style={s.chartRow}>
        {days.map((day, index) => {
          const value = getMetricValue(day, metric);
          const height = maxValue > 0 ? Math.max(10, Math.round((value / maxValue) * 128)) : 10;
          const showLabel = index % labelStep === 0 || index === days.length - 1;

          return (
            <View key={day.date} style={s.barItem}>
              <Text style={s.barValue}>{value > 0 ? formatMetricPeakValue(value, metric) : ''}</Text>
              <View style={[s.barTrack, { backgroundColor: tone.track }]}>
                <View style={[s.barFill, { backgroundColor: tone.fill, height }]} />
              </View>
              <Text style={s.barLabel}>{showLabel ? formatChartTick(day.date) : ''}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  chartShell: {
    gap: 12,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    minHeight: 194,
  },
  barItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  barValue: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '700',
    textAlign: 'center',
    minHeight: 16,
  },
  barTrack: {
    width: '100%',
    height: 128,
    borderRadius: 18,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    minHeight: 10,
    borderRadius: 18,
  },
  barLabel: {
    ...Typography.caption,
    color: Brand.textMuted,
    fontWeight: '700',
    minHeight: 16,
  },
  emptyState: {
    borderRadius: 22,
    backgroundColor: Brand.surfaceAlt,
    paddingHorizontal: 18,
    paddingVertical: 24,
    alignItems: 'center',
    gap: 10,
  },
  emptyIconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    ...Typography.subtitle,
    color: Brand.text,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyHint: {
    ...Typography.body,
    color: Brand.textSecondary,
    textAlign: 'center',
  },
});
