import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { AppCard } from '@/components/app-card';
import { Brand, Radii, Typography } from '@/constants/theme';
import { HistoryWaterAnalysisChart } from '@/features/history/history-water-analysis-chart';
import {
  buildWaterAnalysisModel,
  buildWaterInsightRows,
  formatWaterAmount,
  type WaterAnalysisPeriod,
  type WaterAnalysisPoint,
} from '@/features/history/history-water-analysis-utils';
import { formatDateChip, shiftDate } from '@/features/home/home-utils';
import { getWaterHistory, type WaterStatus } from '@/services/water';
import { todayStr } from '@/utils/helpers';

const PERIOD_OPTIONS: WaterAnalysisPeriod[] = [7, 15, 30, 90];

function resolveEndDate(param: string | string[] | undefined): string {
  if (typeof param === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(param)) {
    return param;
  }

  if (Array.isArray(param) && typeof param[0] === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(param[0])) {
    return param[0];
  }

  return todayStr();
}

function getChartTitle(period: WaterAnalysisPeriod): string {
  if (period === 90) {
    return 'Tendencia semanal';
  }

  return 'Consumo diario';
}

function getChartHint(period: WaterAnalysisPeriod): string {
  if (period === 7) {
    return 'Todos os dias aparecem com leitura direta e foco no ritmo recente.';
  }

  if (period === 15) {
    return 'O recorte mantem o detalhe diario com rolagem horizontal leve.';
  }

  if (period === 30) {
    return 'As barras seguem por dia, com espaco para comparar o mes sem apertar o eixo.';
  }

  return 'Nos ultimos 90 dias, as barras mostram a media por semana para revelar tendencia.';
}

function getSelectionValue(point: WaterAnalysisPoint): string {
  if (point.dayCount === 1) {
    return formatWaterAmount(point.totalMl);
  }

  return `${formatWaterAmount(point.averageMl)} / dia`;
}

function getSelectionPillText(point: WaterAnalysisPoint): string {
  if (point.percentageOfGoal === null) {
    return 'Sem meta';
  }

  return `${Math.round(point.percentageOfGoal)}% da meta`;
}

function getSelectionHint(point: WaterAnalysisPoint): string {
  if (point.dayCount === 1) {
    if (point.goalMl > 0) {
      return `Meta de ${formatWaterAmount(point.goalMl)} neste dia.`;
    }

    return 'Sem meta diaria definida para esta data.';
  }

  const totalLabel = formatWaterAmount(point.totalMl);
  const recordLabel = point.recordDays === 1 ? '1 dia com registro' : `${point.recordDays} dias com registro`;

  if (point.goalMl > 0) {
    return `Total da semana: ${totalLabel}. Media de meta: ${formatWaterAmount(point.goalMl)}. ${recordLabel}.`;
  }

  return `Total da semana: ${totalLabel}. ${recordLabel}.`;
}

export function HistoryWaterAnalysisScreen() {
  const params = useLocalSearchParams<{ endDate?: string }>();
  const endDate = useMemo(() => resolveEndDate(params.endDate), [params.endDate]);

  const [period, setPeriod] = useState<WaterAnalysisPeriod>(15);
  const [historyDays, setHistoryDays] = useState<WaterStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAnalysis() {
      setLoading(true);
      setError(null);

      try {
        const startDate = shiftDate(endDate, -(period - 1));
        const history = await getWaterHistory(startDate, endDate);
        if (cancelled) return;

        setHistoryDays(history.days);
      } catch (loadError) {
        if (cancelled) return;

        setHistoryDays([]);
        setError(loadError instanceof Error ? loadError.message : 'Falha ao carregar a analise de agua.');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadAnalysis();

    return () => {
      cancelled = true;
    };
  }, [endDate, period, reloadKey]);

  const analysis = useMemo(() => buildWaterAnalysisModel(historyDays, endDate, period), [endDate, historyDays, period]);
  const insightRows = useMemo(() => buildWaterInsightRows(analysis), [analysis]);
  const selectedPoint =
    analysis.points.find((point) => point.key === selectedKey) ?? analysis.points[analysis.points.length - 1] ?? null;

  useEffect(() => {
    if (!analysis.points.some((point) => point.key === selectedKey)) {
      setSelectedKey(analysis.points[analysis.points.length - 1]?.key ?? null);
    }
  }, [analysis.points, selectedKey]);

  return (
    <View style={s.root}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.hero}>
          <View style={s.heroBadge}>
            <Ionicons name="water-outline" size={16} color={Brand.hydration} />
            <Text style={s.heroBadgeText}>Agua</Text>
          </View>
          <Text style={s.title}>Analise detalhada de hidratacao</Text>
          <Text style={s.subtitle}>
            Veja volume, meta e constancia ate {formatDateChip(endDate).toLowerCase()} em uma leitura clara.
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

        <View style={s.metricsGrid}>
          <AppCard style={s.metricCard}>
            <Text style={s.metricLabel}>Media diaria</Text>
            <Text style={s.metricValue}>{formatWaterAmount(analysis.averageDailyMl)}</Text>
          </AppCard>

          <AppCard style={s.metricCard}>
            <Text style={s.metricLabel}>Total do periodo</Text>
            <Text style={s.metricValue}>{formatWaterAmount(analysis.totalMl)}</Text>
          </AppCard>

          <AppCard style={s.metricCard}>
            <Text style={s.metricLabel}>Meta batida</Text>
            <Text style={s.metricValue}>
              {analysis.referenceGoalMl > 0 ? `${analysis.daysHitGoal}/${period}` : '--'}
            </Text>
          </AppCard>
        </View>

        <AppCard style={s.chartCard}>
          <View style={s.chartHeader}>
            <View style={s.chartHeaderCopy}>
              <Text style={s.chartTitle}>{getChartTitle(period)}</Text>
              <Text style={s.chartHint}>{getChartHint(period)}</Text>
            </View>

            <View style={[s.goalBadge, analysis.referenceGoalMl <= 0 && s.goalBadgeMuted]}>
              <Text style={[s.goalBadgeLabel, analysis.referenceGoalMl <= 0 && s.goalBadgeLabelMuted]}>
                {analysis.referenceGoalMl > 0 ? `Meta diaria ${formatWaterAmount(analysis.referenceGoalMl)}` : 'Sem meta diaria'}
              </Text>
            </View>
          </View>

          {loading ? (
            <View style={s.feedbackState}>
              <ActivityIndicator size="small" color={Brand.hydration} />
              <Text style={s.feedbackText}>Carregando analise de agua...</Text>
            </View>
          ) : null}

          {!loading && error ? (
            <View style={s.feedbackState}>
              <Text style={s.feedbackTitle}>Nao consegui atualizar a analise agora.</Text>
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

          {!loading && !error ? (
            <>
              <HistoryWaterAnalysisChart
                points={analysis.points}
                referenceGoalMl={analysis.referenceGoalMl}
                selectedKey={selectedPoint?.key ?? null}
                onSelect={setSelectedKey}
              />

              {selectedPoint ? (
                <View style={s.selectionCard}>
                  <Text style={s.selectionLabel}>{selectedPoint.label}</Text>

                  <View style={s.selectionRow}>
                    <Text style={s.selectionValue}>{getSelectionValue(selectedPoint)}</Text>
                    <View
                      style={[
                        s.selectionPill,
                        selectedPoint.percentageOfGoal !== null && selectedPoint.percentageOfGoal >= 100
                          ? s.selectionPillStrong
                          : null,
                      ]}>
                      <Text
                        style={[
                          s.selectionPillText,
                          selectedPoint.percentageOfGoal !== null && selectedPoint.percentageOfGoal >= 100
                            ? s.selectionPillTextStrong
                            : null,
                        ]}>
                        {getSelectionPillText(selectedPoint)}
                      </Text>
                    </View>
                  </View>

                  <Text style={s.selectionHint}>{getSelectionHint(selectedPoint)}</Text>
                </View>
              ) : null}

              {analysis.daysWithRecord === 0 ? (
                <Text style={s.emptyNote}>
                  Ainda nao ha consumo registrado neste recorte. A linha de meta continua como referencia visual.
                </Text>
              ) : null}
            </>
          ) : null}
        </AppCard>

        <AppCard style={s.insightCard}>
          <View style={s.insightHeader}>
            <Text style={s.insightTitle}>Insights do periodo</Text>
            <Text style={s.insightSubtitle}>Leitura direta para entender volume, ritmo e meta.</Text>
          </View>

          <View style={s.insightList}>
            {insightRows.map((item, index) => (
              <View key={item.label} style={[s.insightRow, index < insightRows.length - 1 && s.insightRowBorder]}>
                <View style={s.insightCopy}>
                  <Text style={s.insightRowLabel}>{item.label}</Text>
                  <Text style={s.insightRowHint}>{item.hint}</Text>
                </View>
                <Text style={s.insightRowValue}>{item.value}</Text>
              </View>
            ))}
          </View>
        </AppCard>
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
    gap: 8,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: Radii.pill,
    backgroundColor: Brand.hydrationBg,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  heroBadgeText: {
    ...Typography.caption,
    color: Brand.hydration,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
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
    backgroundColor: Brand.hydrationBg,
    borderColor: '#CFE6F5',
  },
  segmentedText: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '800',
  },
  segmentedTextActive: {
    color: Brand.hydration,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    flexGrow: 1,
    minWidth: 104,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 6,
  },
  metricLabel: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '700',
  },
  metricValue: {
    ...Typography.subtitle,
    color: Brand.text,
    fontWeight: '800',
  },
  chartCard: {
    gap: 16,
    padding: 18,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  chartHeaderCopy: {
    flex: 1,
    gap: 4,
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
  goalBadge: {
    borderRadius: Radii.pill,
    backgroundColor: Brand.hydrationBg,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  goalBadgeMuted: {
    backgroundColor: Brand.surfaceAlt,
  },
  goalBadgeLabel: {
    ...Typography.caption,
    color: Brand.hydration,
    fontWeight: '800',
  },
  goalBadgeLabelMuted: {
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
  selectionCard: {
    borderRadius: 22,
    backgroundColor: '#F8FBFE',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
  },
  selectionLabel: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  },
  selectionValue: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '800',
    color: Brand.text,
  },
  selectionPill: {
    borderRadius: Radii.pill,
    backgroundColor: '#EAF4FB',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  selectionPillStrong: {
    backgroundColor: '#DDF0FB',
  },
  selectionPillText: {
    ...Typography.caption,
    color: Brand.hydration,
    fontWeight: '800',
  },
  selectionPillTextStrong: {
    color: '#136EA8',
  },
  selectionHint: {
    ...Typography.body,
    color: Brand.textSecondary,
  },
  emptyNote: {
    ...Typography.body,
    color: Brand.textSecondary,
  },
  insightCard: {
    gap: 14,
  },
  insightHeader: {
    gap: 4,
  },
  insightTitle: {
    ...Typography.subtitle,
    color: Brand.text,
    fontWeight: '800',
  },
  insightSubtitle: {
    ...Typography.body,
    color: Brand.textSecondary,
  },
  insightList: {
    borderRadius: 22,
    backgroundColor: '#FBFCFB',
    overflow: 'hidden',
  },
  insightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 15,
    alignItems: 'center',
  },
  insightRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2EF',
  },
  insightCopy: {
    flex: 1,
    gap: 4,
  },
  insightRowLabel: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  insightRowHint: {
    ...Typography.body,
    color: Brand.textSecondary,
  },
  insightRowValue: {
    ...Typography.body,
    color: Brand.text,
    fontWeight: '800',
    textAlign: 'right',
    maxWidth: '48%',
  },
  pressed: {
    opacity: 0.92,
  },
});
