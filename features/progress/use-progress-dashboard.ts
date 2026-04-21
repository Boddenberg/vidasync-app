import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  buildHeatmap,
  calcBestDay,
  calcHydrationHitRate,
  calcMacroAverages,
  calcMacroDistribution,
  calcOverallScore,
  calcStreak,
  calcTrend,
  groupByWeek,
} from '@/features/progress/progress-insights';
import { getProgressPanorama, type PanoramaDataset, type PanoramaDay } from '@/services/progress-panorama';
import { todayStr } from '@/utils/helpers';

export type ProgressRange = 7 | 30 | 90;

type State = {
  dataset: PanoramaDataset | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
};

export function useProgressDashboard() {
  const today = todayStr();
  const [range, setRange] = useState<ProgressRange>(30);
  const [state, setState] = useState<State>({
    dataset: null,
    loading: true,
    refreshing: false,
    error: null,
  });

  const load = useCallback(
    async (selectedRange: ProgressRange, options: { showRefresh?: boolean } = {}) => {
      setState((current) => ({
        ...current,
        loading: current.dataset === null,
        refreshing: options.showRefresh === true,
        error: null,
      }));

      try {
        const dataset = await getProgressPanorama(today, selectedRange);
        setState({ dataset, loading: false, refreshing: false, error: null });
      } catch (error) {
        setState((current) => ({
          ...current,
          loading: false,
          refreshing: false,
          error: error instanceof Error ? error.message : 'Falha ao carregar progresso.',
        }));
      }
    },
    [today],
  );

  useEffect(() => {
    void load(range);
  }, [load, range]);

  useFocusEffect(
    useCallback(() => {
      void load(range);
    }, [load, range]),
  );

  const days: PanoramaDay[] = useMemo(
    () => state.dataset?.days ?? [],
    [state.dataset],
  );

  const insights = useMemo(() => {
    const streak = calcStreak(days);
    const macroAverages = calcMacroAverages(days);
    const macroDistribution = calcMacroDistribution(macroAverages);
    const hydrationHitRate = calcHydrationHitRate(days);
    const score = calcOverallScore(days, streak, hydrationHitRate.rate);
    const trend = calcTrend(days);
    const bestDay = calcBestDay(days);
    const heatmap = buildHeatmap(days);
    const weekly = groupByWeek(days);
    const activeDays = days.filter((day) => day.hasAnyRecord).length;

    return {
      streak,
      macroAverages,
      macroDistribution,
      hydrationHitRate,
      score,
      trend,
      bestDay,
      heatmap,
      weekly,
      activeDays,
      totalDays: days.length,
    };
  }, [days]);

  const refresh = useCallback(() => load(range, { showRefresh: true }), [load, range]);

  return {
    today,
    range,
    setRange,
    days,
    loading: state.loading,
    refreshing: state.refreshing,
    error: state.error,
    insights,
    refresh,
  };
}
