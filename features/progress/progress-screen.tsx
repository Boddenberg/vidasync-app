import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StatusBar, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Brand } from '@/constants/theme';
import { ProgressCalorieChart } from '@/features/progress/progress-calorie-chart';
import { ProgressDayDetailModal } from '@/features/progress/progress-day-detail-modal';
import { ProgressHeatmap } from '@/features/progress/progress-heatmap';
import { ProgressHeroCard } from '@/features/progress/progress-hero-card';
import { ProgressHydrationBars } from '@/features/progress/progress-hydration-bars';
import { ProgressInsightCards } from '@/features/progress/progress-insight-cards';
import type { HeatmapCell } from '@/features/progress/progress-insights';
import { ProgressMacroDonut } from '@/features/progress/progress-macro-donut';
import { ProgressMetricsGrid } from '@/features/progress/progress-metrics-grid';
import { ProgressRangeSwitcher } from '@/features/progress/progress-range-switcher';
import { useProgressDashboard } from '@/features/progress/use-progress-dashboard';
import type { PanoramaDay } from '@/services/progress-panorama';

import { s } from './progress-screen.styles';

type Props = {
  onOpenCalendar: () => void;
};

export function ProgressScreen({ onOpenCalendar }: Props) {
  const insets = useSafeAreaInsets();
  const { range, setRange, days, loading, refreshing, error, insights, refresh } = useProgressDashboard();

  const [selectedDay, setSelectedDay] = useState<PanoramaDay | null>(null);

  function handleHeatmapPress(cell: HeatmapCell) {
    const match = days.find((day) => day.date === cell.date) ?? null;
    setSelectedDay(match);
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={Brand.bg} />

      <View pointerEvents="none" style={s.orbTopRight} />
      <View pointerEvents="none" style={s.orbMidLeft} />
      <View pointerEvents="none" style={s.orbBottom} />

      <ScrollView
        bounces
        alwaysBounceVertical
        contentInsetAdjustmentBehavior="never"
        overScrollMode="never"
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={Brand.greenDeeper}
            colors={[Brand.greenDeeper]}
          />
        }>
        <View style={s.headerRow}>
          <View style={s.titleBlock}>
            <Text style={s.title}>Progresso</Text>
            <Text style={s.subtitle}>Seu painel de consistência, hidratação e nutrição.</Text>
          </View>
          <Pressable style={s.refreshBtn} onPress={onOpenCalendar}>
            <Ionicons name="calendar-outline" size={20} color={Brand.greenDeeper} />
          </Pressable>
        </View>

        <ProgressRangeSwitcher value={range} onChange={setRange} />

        {error ? (
          <View style={s.errorBox}>
            <Ionicons name="alert-circle" size={18} color={Brand.danger} />
            <Text style={s.errorText}>{error}</Text>
          </View>
        ) : null}

        {loading && !refreshing ? (
          <View style={s.loadingBox}>
            <ActivityIndicator color={Brand.greenDeeper} size="small" />
            <Text style={s.loadingText}>Analisando seus dados…</Text>
          </View>
        ) : (
          <>
            <ProgressHeroCard
              score={insights.score}
              streak={insights.streak}
              trend={insights.trend}
              activeDays={insights.activeDays}
              totalDays={insights.totalDays}
            />

            {insights.activeDays === 0 ? (
              <View style={s.emptyCard}>
                <View style={s.emptyIcon}>
                  <Ionicons name="sparkles" size={22} color={Brand.greenDeeper} />
                </View>
                <Text style={s.emptyTitle}>Pronto para começar?</Text>
                <Text style={s.emptyText}>
                  Registre refeições e água nos próximos dias. Assim que tivermos dados, seu painel se
                  preenche com insights personalizados.
                </Text>
              </View>
            ) : (
              <>
                <Text style={s.chapterTitle}>Métricas principais</Text>
                <ProgressMetricsGrid
                  macroAverages={insights.macroAverages}
                  bestDay={insights.bestDay}
                  weekly={insights.weekly}
                  activeDays={insights.activeDays}
                  totalDays={insights.totalDays}
                />

                <Text style={s.chapterTitle}>Atividade no período</Text>
                <ProgressHeatmap
                  cells={insights.heatmap}
                  onCellPress={handleHeatmapPress}
                  totalDays={insights.totalDays}
                />

                <ProgressCalorieChart days={days} goal={2000} />

                <ProgressHydrationBars
                  days={days}
                  hitRate={insights.hydrationHitRate.rate}
                  hits={insights.hydrationHitRate.hits}
                  totalWithGoal={insights.hydrationHitRate.totalWithGoal}
                />

                <Text style={s.chapterTitle}>Composição e descobertas</Text>
                <ProgressMacroDonut
                  averages={insights.macroAverages}
                  distribution={insights.macroDistribution}
                />

                <ProgressInsightCards
                  score={insights.score}
                  streak={insights.streak}
                  trend={insights.trend}
                  macroDistribution={insights.macroDistribution}
                  macroAverages={insights.macroAverages}
                  hydrationHitRate={insights.hydrationHitRate.rate}
                  activeDays={insights.activeDays}
                  totalDays={insights.totalDays}
                />
              </>
            )}
          </>
        )}
      </ScrollView>

      <ProgressDayDetailModal
        visible={selectedDay !== null}
        day={selectedDay}
        onClose={() => setSelectedDay(null)}
        onViewFullDay={() => {
          setSelectedDay(null);
          onOpenCalendar();
        }}
      />
    </View>
  );
}
