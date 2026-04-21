import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { Brand, Radii, Shadows, Typography } from '@/constants/theme';
import type { MacroAverages, WeeklyBucket } from '@/features/progress/progress-insights';
import type { PanoramaDay } from '@/services/progress-panorama';

type Props = {
  macroAverages: MacroAverages;
  bestDay: PanoramaDay | null;
  weekly: WeeklyBucket[];
  activeDays: number;
  totalDays: number;
};

export function ProgressMetricsGrid({ macroAverages, bestDay, weekly, activeDays, totalDays }: Props) {
  const adherence = totalDays > 0 ? Math.round((activeDays / totalDays) * 100) : 0;

  const lastWeek = weekly[weekly.length - 1];
  const prevWeek = weekly[weekly.length - 2];
  const lastWeekAvg = lastWeek?.avgCalories ?? 0;
  const prevWeekAvg = prevWeek?.avgCalories ?? 0;
  const weekDelta = prevWeekAvg > 0 ? (lastWeekAvg - prevWeekAvg) / prevWeekAvg : 0;
  const weekDeltaPct = Math.round(weekDelta * 100);

  function formatBestDay(): string {
    if (!bestDay) return '—';
    const [year, month, day] = bestDay.date.split('-').map((v) => parseInt(v, 10));
    return new Date(year, month - 1, day)
      .toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
      .replace('.', '');
  }

  return (
    <View style={s.grid}>
      <KpiCard
        icon="flame"
        iconColor={Brand.coral}
        iconBg={Brand.coralSoft}
        title="Cal. médias"
        value={Math.round(macroAverages.calories).toLocaleString('pt-BR')}
        unit="kcal"
        helper="por dia ativo"
      />
      <KpiCard
        icon="water"
        iconColor={Brand.hydration}
        iconBg={Brand.hydrationBg}
        title="Hidratação"
        value={(macroAverages.waterMl / 1000).toFixed(1)}
        unit="L"
        helper="média diária"
      />
      <KpiCard
        icon="trophy"
        iconColor={Brand.mango}
        iconBg="#FFF4DD"
        title="Melhor dia"
        value={formatBestDay()}
        helper={bestDay ? `${Math.round(bestDay.calories)} kcal • ${bestDay.mealsCount} ref.` : 'Sem registros'}
        valueFontSize={18}
      />
      <KpiCard
        icon="checkmark-circle"
        iconColor={Brand.greenDeeper}
        iconBg={Brand.mintSoft}
        title="Adesão"
        value={`${adherence}`}
        unit="%"
        helper={`${activeDays}/${totalDays} dias`}
      />
      <KpiCard
        icon={weekDelta > 0 ? 'trending-up' : weekDelta < 0 ? 'trending-down' : 'remove'}
        iconColor={weekDelta > 0 ? Brand.fresh : weekDelta < 0 ? Brand.danger : Brand.sky}
        iconBg={weekDelta > 0 ? Brand.mintSoft : weekDelta < 0 ? '#FDE7E7' : Brand.hydrationBg}
        title="Semana atual"
        value={
          lastWeekAvg > 0 ? `${weekDeltaPct > 0 ? '+' : ''}${weekDeltaPct}` : '—'
        }
        unit={lastWeekAvg > 0 ? '%' : ''}
        helper={lastWeekAvg > 0 ? `vs. semana anterior` : 'Dados insuficientes'}
      />
      <KpiCard
        icon="restaurant"
        iconColor={Brand.greenDark}
        iconBg={Brand.mintSoft}
        title="Proteína"
        value={`${Math.round(macroAverages.protein)}`}
        unit="g"
        helper="média por dia"
      />
    </View>
  );
}

function KpiCard({
  icon,
  iconColor,
  iconBg,
  title,
  value,
  unit,
  helper,
  valueFontSize,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  title: string;
  value: string;
  unit?: string;
  helper?: string;
  valueFontSize?: number;
}) {
  return (
    <View style={s.card}>
      <View style={[s.cardIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={14} color={iconColor} />
      </View>
      <Text style={s.cardTitle}>{title}</Text>
      <View style={s.cardValueRow}>
        <Text
          style={[s.cardValue, valueFontSize ? { fontSize: valueFontSize } : null]}
          numberOfLines={1}>
          {value}
        </Text>
        {unit ? <Text style={s.cardUnit}>{unit}</Text> : null}
      </View>
      {helper ? <Text style={s.cardHelper}>{helper}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  card: {
    flexBasis: '31.5%',
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(20,108,56,0.06)',
    padding: 12,
    gap: 6,
    minWidth: 100,
    ...Shadows.soft,
  },
  cardIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  cardValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  cardValue: {
    fontSize: 22,
    fontWeight: '800',
    color: Brand.text,
    letterSpacing: -0.5,
    lineHeight: 26,
  },
  cardUnit: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  cardHelper: {
    ...Typography.caption,
    color: Brand.textMuted,
    fontSize: 10,
    fontWeight: '600',
    marginTop: -2,
  },
});
