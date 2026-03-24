import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { AppCard } from '@/components/app-card';
import { Brand, Radii, Typography } from '@/constants/theme';
import { formatDateChip } from '@/features/home/home-utils';
import {
  buildPanoramaInsight,
  formatCaloriesAverage,
  formatWaterAverage,
  getAverageCalories,
  getAverageWaterMl,
  getDaysWithRecords,
} from '@/features/history/history-panorama-utils';
import {
  getProgressPanorama,
  type PanoramaDataset,
  type PanoramaMetric,
  type PanoramaPeriod,
} from '@/services/progress-panorama';
import { todayStr } from '@/utils/helpers';

type PanoramaMode = 'individual' | 'compare';

const PERIOD_OPTIONS: PanoramaPeriod[] = [7, 15, 30];
const MODE_OPTIONS: Array<{ key: PanoramaMode; label: string }> = [
  { key: 'individual', label: 'Individual' },
  { key: 'compare', label: 'Comparar' },
];
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

function getMetricLabel(metric: PanoramaMetric): string {
  return METRIC_OPTIONS.find((option) => option.key === metric)?.label ?? 'Agua';
}

function getChartTitle(mode: PanoramaMode, metric: PanoramaMetric): string {
  if (mode === 'compare') {
    return 'Agua e refeicoes ao longo do periodo';
  }

  return `${getMetricLabel(metric)} ao longo do periodo`;
}

function getChartHint(mode: PanoramaMode, metric: PanoramaMetric, period: PanoramaPeriod): string {
  if (mode === 'compare') {
    if (period === 30) {
      return 'Vamos encaixar aqui duas mini visualizacoes sincronizadas, com leitura semanal por padrao.';
    }

    return 'Este espaco vai receber duas mini visualizacoes sincronizadas para comparar agua e refeicoes com calma.';
  }

  if (metric === 'meals') {
    return period === 30
      ? 'Na proxima etapa entra a visualizacao resumida de refeicoes, com leitura mais confortavel para 30 dias.'
      : 'Na proxima etapa entra a visualizacao de refeicoes preparada para manter a leitura limpa no mobile.';
  }

  return period === 30
    ? 'Na proxima etapa entra a visualizacao resumida deste periodo, priorizando leitura confortavel para 30 dias.'
    : 'Na proxima etapa entra a visualizacao diaria com leitura leve e espaco suficiente para os rotulos.';
}

function getPreviewTitle(mode: PanoramaMode, metric: PanoramaMetric): string {
  if (mode === 'compare') {
    return 'Estrutura pronta para o modo comparar';
  }

  return `Estrutura pronta para ${getMetricLabel(metric).toLowerCase()}`;
}

function buildCompareSummaryText(days: PanoramaDataset['days'], period: PanoramaPeriod): string {
  const daysWithRecords = getDaysWithRecords(days);
  const waterDays = days.filter((day) => day.waterMl > 0).length;
  const mealDays = days.filter((day) => day.mealsCount > 0).length;

  if (daysWithRecords === 0) {
    return `Sem registros de agua ou refeicoes nos ultimos ${period} dias.`;
  }

  return `Agua apareceu em ${waterDays} de ${period} dias e refeicoes em ${mealDays} de ${period}. A proxima etapa vai encaixar a comparacao visual desse ritmo.`;
}

export function HistoryPanoramaScreen() {
  const params = useLocalSearchParams<{ endDate?: string }>();
  const endDate = useMemo(() => resolveEndDate(params.endDate), [params.endDate]);

  const [period, setPeriod] = useState<PanoramaPeriod>(7);
  const [mode, setMode] = useState<PanoramaMode>('individual');
  const [metric, setMetric] = useState<PanoramaMetric>('water');
  const [dataset, setDataset] = useState<PanoramaDataset | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

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
  const daysWithRecords = getDaysWithRecords(days);
  const averageWater = getAverageWaterMl(days);
  const averageCalories = getAverageCalories(days);
  const hasRecords = daysWithRecords > 0;
  const summaryText =
    mode === 'compare'
      ? buildCompareSummaryText(days, period)
      : buildPanoramaInsight(days, period, metric);
  const periodLabel = `${period} dias`;

  return (
    <View style={s.root}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.hero}>
          <Text style={s.eyebrow}>Panorama</Text>
          <Text style={s.title}>Como seus registros caminharam nos ultimos dias</Text>
          <Text style={s.subtitle}>
            Um espaco leve para acompanhar agua, calorias e refeicoes ate {formatDateChip(endDate).toLowerCase()}.
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
            <Text style={s.summaryLabel}>Agua media por dia</Text>
            <Text style={s.summaryValue}>{formatWaterAverage(averageWater)}</Text>
          </AppCard>

          <AppCard style={s.summaryCard}>
            <Text style={s.summaryLabel}>Calorias medias por dia</Text>
            <Text style={s.summaryValue}>{formatCaloriesAverage(averageCalories)}</Text>
          </AppCard>

          <AppCard style={s.summaryCard}>
            <Text style={s.summaryLabel}>Dias com registro</Text>
            <Text style={s.summaryValue}>
              {daysWithRecords}/{period}
            </Text>
          </AppCard>
        </View>

        <AppCard style={s.sectionCard}>
          <Text style={s.sectionLabel}>Visualizacao</Text>
          <View style={s.segmentedRow}>
            {MODE_OPTIONS.map((option) => {
              const active = option.key === mode;

              return (
                <Pressable
                  key={option.key}
                  accessibilityRole="button"
                  onPress={() => setMode(option.key)}
                  style={({ pressed }) => [s.segmentedButton, active && s.segmentedButtonActive, pressed && s.pressed]}>
                  <Text style={[s.segmentedText, active && s.segmentedTextActive]}>{option.label}</Text>
                </Pressable>
              );
            })}
          </View>

          {mode === 'individual' ? (
            <View style={s.metricRow}>
              {METRIC_OPTIONS.map((option) => {
                const active = option.key === metric;

                return (
                  <Pressable
                    key={option.key}
                    accessibilityRole="button"
                    onPress={() => setMetric(option.key)}
                    style={({ pressed }) => [s.metricChip, active && s.metricChipActive, pressed && s.pressed]}>
                    <Ionicons name={option.icon} size={15} color={active ? Brand.greenDark : Brand.textSecondary} />
                    <Text style={[s.metricChipText, active && s.metricChipTextActive]}>{option.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <View style={s.compareHintRow}>
              <Ionicons name="git-compare-outline" size={16} color={Brand.greenDark} />
              <Text style={s.compareHintText}>Comparacao preparada para Agua + Refeicoes.</Text>
            </View>
          )}
        </AppCard>

        <AppCard style={s.chartCard}>
          <View style={s.chartHeader}>
            <Text style={s.chartEyebrow}>{mode === 'compare' ? 'Comparar' : getMetricLabel(metric)}</Text>
            <Text style={s.chartTitle}>{getChartTitle(mode, metric)}</Text>
            <Text style={s.chartHint}>{getChartHint(mode, metric, period)}</Text>
          </View>

          {loading ? (
            <View style={s.feedbackState}>
              <ActivityIndicator size="small" color={Brand.greenDark} />
              <Text style={s.feedbackText}>Carregando panorama de {periodLabel.toLowerCase()}...</Text>
            </View>
          ) : null}

          {!loading && error ? (
            <View style={s.feedbackState}>
              <Text style={s.feedbackTitle}>Nao consegui atualizar o panorama agora.</Text>
              <Text style={s.feedbackText}>Tente novamente em instantes para recarregar esse periodo.</Text>
              <AppButton title="Tentar novamente" onPress={() => setReloadKey((current) => current + 1)} variant="secondary" />
            </View>
          ) : null}

          {!loading && !error && !hasRecords ? (
            <View style={s.emptyState}>
              <View style={s.emptyIconWrap}>
                <Ionicons name="stats-chart-outline" size={18} color={Brand.greenDark} />
              </View>
              <Text style={s.emptyTitle}>Ainda nao ha registros neste periodo</Text>
              <Text style={s.emptyHint}>
                Quando voce lancar agua ou refeicoes, o panorama passa a mostrar esse intervalo aqui.
              </Text>
            </View>
          ) : null}

          {!loading && !error && hasRecords ? (
            <View style={s.previewCard}>
              <View style={s.previewHeader}>
                <View style={s.previewIconWrap}>
                  <Ionicons
                    name={mode === 'compare' ? 'git-compare-outline' : 'bar-chart-outline'}
                    size={18}
                    color={Brand.greenDark}
                  />
                </View>
                <View style={s.previewCopy}>
                  <Text style={s.previewTitle}>{getPreviewTitle(mode, metric)}</Text>
                  <Text style={s.previewHint}>{getChartHint(mode, metric, period)}</Text>
                </View>
              </View>

              <View style={s.previewMetaRow}>
                <View style={s.previewMetaChip}>
                  <Text style={s.previewMetaText}>{periodLabel}</Text>
                </View>
                <View style={s.previewMetaChip}>
                  <Text style={s.previewMetaText}>
                    {daysWithRecords} {daysWithRecords === 1 ? 'dia com dado' : 'dias com dados'}
                  </Text>
                </View>
              </View>
            </View>
          ) : null}
        </AppCard>

        {!loading && !error ? <Text style={s.summaryText}>{summaryText}</Text> : null}
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
  metricRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: Radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: Brand.card,
    borderWidth: 1,
    borderColor: Brand.border,
  },
  metricChipActive: {
    backgroundColor: Brand.sageMist,
    borderColor: '#C8DDD0',
  },
  metricChipText: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '800',
  },
  metricChipTextActive: {
    color: Brand.greenDark,
  },
  compareHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 2,
  },
  compareHintText: {
    ...Typography.body,
    color: Brand.textSecondary,
  },
  chartCard: {
    gap: 16,
    padding: 18,
  },
  chartHeader: {
    gap: 4,
  },
  chartEyebrow: {
    ...Typography.caption,
    color: Brand.greenDark,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
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
    borderRadius: 24,
    backgroundColor: Brand.surfaceAlt,
    paddingHorizontal: 18,
    paddingVertical: 24,
    alignItems: 'center',
    gap: 10,
  },
  emptyIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: Brand.surfaceSoft,
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
  previewCard: {
    borderRadius: 24,
    backgroundColor: Brand.surfaceAlt,
    paddingHorizontal: 16,
    paddingVertical: 18,
    gap: 14,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  previewIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 15,
    backgroundColor: Brand.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewCopy: {
    flex: 1,
    gap: 4,
  },
  previewTitle: {
    ...Typography.subtitle,
    color: Brand.text,
    fontWeight: '800',
  },
  previewHint: {
    ...Typography.body,
    color: Brand.textSecondary,
  },
  previewMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  previewMetaChip: {
    borderRadius: Radii.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Brand.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  previewMetaText: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '700',
  },
  summaryText: {
    ...Typography.body,
    color: Brand.textSecondary,
  },
  pressed: {
    opacity: 0.92,
  },
});
