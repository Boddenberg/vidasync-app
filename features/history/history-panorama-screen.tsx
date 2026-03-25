import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { AppCard } from '@/components/app-card';
import { Brand, Radii, Typography } from '@/constants/theme';
import { HistoryPanoramaSimpleChart } from '@/features/history/history-panorama-simple-chart';
import { formatDateChip } from '@/features/home/home-utils';
import {
  buildPanoramaDisplayPoints,
  buildPanoramaInsight,
  formatCaloriesAverage,
  formatPanoramaMetricValue,
  formatWaterAverage,
  getAverageCalories,
  getAverageWaterMl,
  getDaysWithRecords,
  getDisplayPointValue,
  type PanoramaChartGranularity,
  type PanoramaDisplayPoint,
} from '@/features/history/history-panorama-utils';
import {
  getProgressPanorama,
  type PanoramaDataset,
  type PanoramaDay,
  type PanoramaMetric,
  type PanoramaPeriod,
} from '@/services/progress-panorama';
import { todayStr } from '@/utils/helpers';

const PERIOD_OPTIONS: PanoramaPeriod[] = [7, 15, 30];
const METRIC_OPTIONS: Array<{ key: PanoramaMetric; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { key: 'water', label: 'Agua', icon: 'water-outline' },
  { key: 'calories', label: 'Calorias', icon: 'flame-outline' },
  { key: 'meals', label: 'Refeicoes', icon: 'restaurant-outline' },
];

function resolveEndDate(param: string | string[] | undefined): string {
  if (typeof param === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(param)) {
    return param;
  }

  if (Array.isArray(param) && typeof param[0] === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(param[0])) {
    return param[0];
  }

  return todayStr();
}

function getChartGranularity(period: PanoramaPeriod): PanoramaChartGranularity {
  return period === 30 ? 'weekly' : 'daily';
}

function getMetricLabel(metric: PanoramaMetric): string {
  return METRIC_OPTIONS.find((option) => option.key === metric)?.label ?? 'Agua';
}

function getChartTitle(metric: PanoramaMetric, granularity: PanoramaChartGranularity): string {
  const metricLabel = getMetricLabel(metric).toLowerCase();
  return granularity === 'weekly' ? `Resumo semanal de ${metricLabel}` : `${getMetricLabel(metric)} por dia`;
}

function getChartHint(metric: PanoramaMetric, period: PanoramaPeriod, granularity: PanoramaChartGranularity): string {
  if (granularity === 'weekly') {
    return 'Os 30 dias sao agrupados em blocos semanais para manter o grafico claro no mobile.';
  }

  if (metric === 'water') {
    return period === 15
      ? 'Leitura diaria com espacamento fixo e rolagem horizontal leve.'
      : 'Barras diarias para acompanhar o ritmo recente de hidratacao.';
  }

  if (metric === 'calories') {
    return period === 15
      ? 'As barras mantem a comparacao diaria sem comprimir datas.'
      : 'Leitura compacta para ver rapidamente dias mais fortes e mais leves.';
  }

  return period === 15
    ? 'A rolagem lateral preserva o espacamento entre os dias.'
    : 'Barras simples mostram quantas refeicoes entraram em cada dia.';
}

function getMetricTone(metric: PanoramaMetric) {
  if (metric === 'water') return Brand.hydration;
  if (metric === 'meals') return Brand.orange;
  return Brand.greenDark;
}

function getBestRecordStreak(days: PanoramaDay[]): number {
  let best = 0;
  let current = 0;

  days.forEach((day) => {
    if (day.hasAnyRecord) {
      current += 1;
      best = Math.max(best, current);
      return;
    }

    current = 0;
  });

  return best;
}

function getSelectionMeta(point: PanoramaDisplayPoint, granularity: PanoramaChartGranularity): string {
  if (granularity === 'weekly') {
    const dayLabel = point.dayCount === 1 ? '1 dia' : `${point.dayCount} dias`;
    const recordLabel = point.daysWithRecords === 1 ? '1 com registro' : `${point.daysWithRecords} com registro`;
    return `${dayLabel} • ${recordLabel}`;
  }

  return point.hasAnyRecord ? 'Dia com registro' : 'Sem registro';
}

function getSelectionHint(
  point: PanoramaDisplayPoint,
  metric: PanoramaMetric,
  granularity: PanoramaChartGranularity,
): string {
  if (granularity === 'weekly') {
    if (metric === 'water') {
      return `Total do bloco: ${formatPanoramaMetricValue(point.waterMl, 'water', false)}.`;
    }

    if (metric === 'calories') {
      return `Total do bloco: ${formatPanoramaMetricValue(point.calories, 'calories', false)}.`;
    }

    return `Total do bloco: ${formatPanoramaMetricValue(point.mealsCount, 'meals', false)}.`;
  }

  if (!point.hasAnyRecord) {
    return 'Nao houve registro nessa data.';
  }

  if (metric === 'water') return 'Volume de agua registrado neste dia.';
  if (metric === 'calories') return 'Calorias registradas neste dia.';
  return 'Quantidade de refeicoes registradas neste dia.';
}

export function HistoryPanoramaScreen() {
  const params = useLocalSearchParams<{ endDate?: string }>();
  const endDate = useMemo(() => resolveEndDate(params.endDate), [params.endDate]);

  const [period, setPeriod] = useState<PanoramaPeriod>(7);
  const [metric, setMetric] = useState<PanoramaMetric>('water');
  const [dataset, setDataset] = useState<PanoramaDataset | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPanorama() {
      setLoading(true);
      setError(null);

      try {
        const nextDataset = await getProgressPanorama(endDate, period);
        if (cancelled) return;

        setDataset(nextDataset);
      } catch (loadError) {
        if (cancelled) return;

        setError(loadError instanceof Error ? loadError.message : 'Falha ao carregar panorama.');
        setDataset(null);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadPanorama();

    return () => {
      cancelled = true;
    };
  }, [endDate, period, reloadKey]);

  const days = dataset?.days ?? [];
  const averageWater = getAverageWaterMl(days);
  const averageCalories = getAverageCalories(days);
  const daysWithRecords = getDaysWithRecords(days);
  const bestRecordStreak = getBestRecordStreak(days);
  const granularity = getChartGranularity(period);
  const displayPoints = useMemo(() => buildPanoramaDisplayPoints(days, granularity), [days, granularity]);
  const selectedPoint =
    displayPoints.find((point) => point.key === selectedKey) ?? displayPoints[displayPoints.length - 1] ?? null;
  const summaryText = buildPanoramaInsight(days, period, metric);
  const hasRecords = daysWithRecords > 0;

  useEffect(() => {
    if (!displayPoints.some((point) => point.key === selectedKey)) {
      setSelectedKey(displayPoints[displayPoints.length - 1]?.key ?? null);
    }
  }, [displayPoints, selectedKey]);

  return (
    <View style={s.root}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.hero}>
          <Text style={s.eyebrow}>Panorama</Text>
          <Text style={s.title}>Seus registros em leitura rapida</Text>
          <Text style={s.subtitle}>
            Um resumo mais claro de agua, calorias e consistencia ate {formatDateChip(endDate).toLowerCase()}.
          </Text>
        </View>

        <AppCard style={s.sectionCard}>
          <Text style={s.sectionLabel}>Periodo</Text>
          <View style={s.segmentedRow}>
            {PERIOD_OPTIONS.map((option) => {
              const active = option === period;

              return (
                <Pressable
                  key={option}
                  accessibilityRole="button"
                  onPress={() => setPeriod(option)}
                  style={({ pressed }) => [s.segmentedButton, active && s.segmentedButtonActive, pressed && s.pressed]}>
                  <Text style={[s.segmentedText, active && s.segmentedTextActive]}>{option} dias</Text>
                </Pressable>
              );
            })}
          </View>
        </AppCard>

        <View style={s.summaryGrid}>
          <AppCard style={s.summaryCard}>
            <Text style={s.summaryLabel}>Agua media</Text>
            <Text style={s.summaryValue}>{formatWaterAverage(averageWater)}</Text>
            <Text style={s.summaryNote}>Por dia neste periodo</Text>
          </AppCard>

          <AppCard style={s.summaryCard}>
            <Text style={s.summaryLabel}>Calorias medias</Text>
            <Text style={s.summaryValue}>{formatCaloriesAverage(averageCalories)}</Text>
            <Text style={s.summaryNote}>Leitura diaria consolidada</Text>
          </AppCard>

          <AppCard style={s.summaryCard}>
            <Text style={s.summaryLabel}>Consistencia</Text>
            <Text style={s.summaryValue}>
              {daysWithRecords}/{period}
            </Text>
            <Text style={s.summaryNote}>
              Melhor sequencia {bestRecordStreak} {bestRecordStreak === 1 ? 'dia' : 'dias'}
            </Text>
          </AppCard>
        </View>

        <AppCard style={s.chartCard}>
          <View style={s.chartHeader}>
            <View style={s.chartHeaderCopy}>
              <Text style={s.chartEyebrow}>Leitura principal</Text>
              <Text style={s.chartTitle}>{getChartTitle(metric, granularity)}</Text>
              <Text style={s.chartHint}>{getChartHint(metric, period, granularity)}</Text>
            </View>
          </View>

          <View style={s.metricTabs}>
            {METRIC_OPTIONS.map((option) => {
              const active = option.key === metric;

              return (
                <Pressable
                  key={option.key}
                  accessibilityRole="button"
                  onPress={() => setMetric(option.key)}
                  style={({ pressed }) => [s.metricTab, active && s.metricTabActive, pressed && s.pressed]}>
                  <Ionicons name={option.icon} size={15} color={active ? getMetricTone(option.key) : Brand.textSecondary} />
                  <Text style={[s.metricTabText, active && { color: getMetricTone(option.key) }]}>{option.label}</Text>
                </Pressable>
              );
            })}
          </View>

          {loading ? (
            <View style={s.feedbackState}>
              <ActivityIndicator size="small" color={Brand.greenDark} />
              <Text style={s.feedbackText}>Carregando panorama...</Text>
            </View>
          ) : null}

          {!loading && error ? (
            <View style={s.feedbackState}>
              <Text style={s.feedbackTitle}>Nao consegui atualizar o panorama agora.</Text>
              <Text style={s.feedbackText}>Tente novamente em instantes para recarregar esse periodo.</Text>
              <AppButton
                title="Tentar novamente"
                onPress={() => {
                  setReloadKey((current) => current + 1);
                }}
                variant="secondary"
              />
            </View>
          ) : null}

          {!loading && !error && !hasRecords ? (
            <View style={s.emptyState}>
              <Text style={s.emptyTitle}>Ainda nao ha registros neste periodo</Text>
              <Text style={s.emptyHint}>
                Quando voce registrar agua ou refeicoes, o panorama passa a mostrar esse intervalo aqui.
              </Text>
            </View>
          ) : null}

          {!loading && !error && hasRecords ? (
            <>
              <HistoryPanoramaSimpleChart
                points={displayPoints}
                metric={metric}
                granularity={granularity}
                selectedKey={selectedPoint?.key ?? null}
                onSelect={setSelectedKey}
              />

              {selectedPoint ? (
                <View style={s.selectionCard}>
                  <View style={s.selectionHeader}>
                    <Text style={s.selectionTitle}>{selectedPoint.label}</Text>
                    <Text style={s.selectionMeta}>{getSelectionMeta(selectedPoint, granularity)}</Text>
                  </View>
                  <Text style={[s.selectionValue, { color: getMetricTone(metric) }]}>
                    {formatPanoramaMetricValue(getDisplayPointValue(selectedPoint, metric), metric, false)}
                  </Text>
                  <Text style={s.selectionHint}>{getSelectionHint(selectedPoint, metric, granularity)}</Text>
                </View>
              ) : null}
            </>
          ) : null}
        </AppCard>

        {!loading && !error ? (
          <AppCard style={s.insightCard}>
            <Text style={s.insightLabel}>Insight</Text>
            <Text style={s.insightText}>{summaryText}</Text>
          </AppCard>
        ) : null}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Brand.bg,
  },
  scroll: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 48,
    gap: 16,
  },
  hero: {
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
    ...Typography.title,
    color: Brand.text,
    fontWeight: '800',
  },
  subtitle: {
    ...Typography.body,
    color: Brand.textSecondary,
  },
  sectionCard: {
    gap: 14,
  },
  sectionLabel: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  segmentedRow: {
    flexDirection: 'row',
    gap: 8,
  },
  segmentedButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: Brand.surfaceAlt,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  segmentedButtonActive: {
    backgroundColor: Brand.surfaceSoft,
    borderColor: '#CFE5D5',
  },
  segmentedText: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '800',
  },
  segmentedTextActive: {
    color: Brand.greenDark,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  summaryCard: {
    flexGrow: 1,
    minWidth: 104,
    paddingHorizontal: 14,
    paddingVertical: 14,
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
  summaryNote: {
    ...Typography.caption,
    color: Brand.textMuted,
    fontWeight: '700',
  },
  chartCard: {
    gap: 16,
    padding: 18,
  },
  chartHeader: {
    gap: 4,
  },
  chartHeaderCopy: {
    gap: 4,
  },
  chartEyebrow: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.55,
  },
  chartTitle: {
    ...Typography.subtitle,
    color: Brand.text,
    fontWeight: '800',
  },
  chartHint: {
    ...Typography.body,
    color: Brand.textSecondary,
  },
  metricTabs: {
    flexDirection: 'row',
    gap: 8,
  },
  metricTab: {
    flex: 1,
    minHeight: 42,
    borderRadius: Radii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F7FAF7',
  },
  metricTabActive: {
    backgroundColor: '#F1F6F2',
  },
  metricTabText: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '800',
  },
  feedbackState: {
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 8,
  },
  feedbackTitle: {
    ...Typography.subtitle,
    color: Brand.text,
    fontWeight: '800',
  },
  feedbackText: {
    ...Typography.body,
    color: Brand.textSecondary,
  },
  emptyState: {
    borderRadius: 20,
    backgroundColor: '#F6F8F6',
    paddingHorizontal: 18,
    paddingVertical: 22,
    gap: 8,
  },
  emptyTitle: {
    ...Typography.subtitle,
    color: Brand.text,
    fontWeight: '800',
  },
  emptyHint: {
    ...Typography.body,
    color: Brand.textSecondary,
  },
  selectionCard: {
    borderRadius: 18,
    backgroundColor: '#FAFBFA',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 6,
  },
  selectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  selectionTitle: {
    ...Typography.body,
    color: Brand.text,
    fontWeight: '800',
    flex: 1,
  },
  selectionMeta: {
    ...Typography.caption,
    color: Brand.textMuted,
    fontWeight: '700',
  },
  selectionValue: {
    ...Typography.subtitle,
    fontWeight: '800',
  },
  selectionHint: {
    ...Typography.body,
    color: Brand.textSecondary,
  },
  insightCard: {
    gap: 8,
  },
  insightLabel: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.55,
  },
  insightText: {
    ...Typography.body,
    color: Brand.textSecondary,
  },
  pressed: {
    opacity: 0.92,
  },
});
