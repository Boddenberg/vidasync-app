import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { Brand, Radii, Shadows, Typography } from '@/constants/theme';
import type { WaterEvent, WaterStatus } from '@/services/water';
import { dayHeading, formatWaterLiters } from '@/features/history/history-utils';

type Props = {
  selectedDate: string;
  loading: boolean;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mealCount: number;
  waterEvents: WaterEvent[];
  waterStatus: WaterStatus | null;
};

export function HistoryDayHero({
  selectedDate,
  loading,
  calories,
  protein,
  carbs,
  fat,
  mealCount,
  waterEvents,
  waterStatus,
}: Props) {
  const totalEntries = mealCount + waterEvents.length;
  const hydrationProgress =
    waterStatus && waterStatus.goalMl > 0
      ? Math.max(0, Math.min(waterStatus.consumedMl / waterStatus.goalMl, 1))
      : 0;
  const hydrationHeadline = !waterStatus
    ? 'Sem agua registrada'
    : waterStatus.goalMl > 0
      ? `${formatWaterLiters(waterStatus.consumedMl)} / ${formatWaterLiters(waterStatus.goalMl)}`
      : `${formatWaterLiters(waterStatus.consumedMl)} registrados`;
  const hydrationHint = !waterStatus || waterEvents.length === 0
    ? 'Nenhum ajuste de agua nesta data.'
    : waterStatus.goalMl > 0
      ? waterStatus.goalReached
        ? 'Meta de agua concluida.'
        : `${Math.round(waterStatus.remainingMl)} ml para fechar a meta.`
      : `${waterEvents.length} ${waterEvents.length === 1 ? 'ajuste' : 'ajustes'} de agua registrados.`;
  const dayHeroHint = totalEntries > 0
    ? 'Um panorama rapido do que entrou no seu dia.'
    : 'Quando voce registrar pratos e agua, o resumo aparece aqui.';

  return (
    <View style={s.dayHero}>
      <View pointerEvents="none" style={s.dayHeroGlowTop} />
      <View pointerEvents="none" style={s.dayHeroGlowBottom} />

      <View style={s.dayHeroHeader}>
        <View style={s.dayHeroCopy}>
          <Text style={s.dayHeroEyebrow}>Panorama do dia</Text>
          <Text style={s.dayHeroTitle}>{dayHeading(selectedDate)}</Text>
          <Text style={s.dayHeroHint}>{dayHeroHint}</Text>
        </View>
        <View style={s.dayHeroBadge}>
          <Text style={s.dayHeroBadgeValue}>{totalEntries}</Text>
          <Text style={s.dayHeroBadgeLabel}>{totalEntries === 1 ? 'registro' : 'registros'}</Text>
        </View>
      </View>

      {loading ? (
        <Text style={s.loadingText}>Carregando dados do dia...</Text>
      ) : (
        <>
          <View style={s.dayHeroTopRow}>
            <View style={s.calorieCard}>
              <Text style={s.calorieLabel}>Calorias totais</Text>
              <View style={s.kcalRow}>
                <Text style={s.kcalValue}>{calories}</Text>
                <Text style={s.kcalUnit}>kcal</Text>
              </View>
            </View>

            <View style={s.hydrationCard}>
              <View style={s.hydrationCardIcon}>
                <Ionicons name="water-outline" size={18} color="#0B6B94" />
              </View>
              <Text style={s.hydrationCardLabel}>Agua</Text>
              <Text style={s.hydrationCardValue}>{hydrationHeadline}</Text>
            </View>
          </View>

          {waterStatus?.goalMl ? (
            <View style={s.hydrationTrack}>
              <View style={[s.hydrationFill, { width: `${Math.round(hydrationProgress * 100)}%` }]} />
            </View>
          ) : null}

          <Text style={s.hydrationHint}>{hydrationHint}</Text>

          <View style={s.statsRow}>
            <StatCard
              label="Pratos"
              value={`${mealCount}`}
              hint={mealCount === 1 ? 'registro no dia' : 'registros no dia'}
              tone="meals"
            />
            <StatCard
              label="Agua"
              value={waterStatus ? formatWaterLiters(waterStatus.consumedMl) : '0.0L'}
              hint="consumidos no dia"
              tone="water"
            />
            <StatCard
              label="Ajustes"
              value={`${waterEvents.length}`}
              hint={waterEvents.length === 1 ? 'movimento' : 'movimentos'}
              tone="events"
            />
          </View>

          <View style={s.macroRow}>
            <MacroChip label="Proteina" value={`${protein}g`} color={Brand.macroProtein} bg={Brand.macroProteinBg} />
            <MacroChip label="Carboidrato" value={`${carbs}g`} color={Brand.macroCarb} bg={Brand.macroCarbBg} />
            <MacroChip label="Gordura" value={`${fat}g`} color={Brand.macroFat} bg={Brand.macroFatBg} />
          </View>
        </>
      )}
    </View>
  );
}

function StatCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  tone: 'meals' | 'water' | 'events';
}) {
  return (
    <View
      style={[
        s.statCard,
        tone === 'meals' && s.statCardMeals,
        tone === 'water' && s.statCardWater,
        tone === 'events' && s.statCardEvents,
      ]}>
      <Text style={s.statLabel}>{label}</Text>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statHint}>{hint}</Text>
    </View>
  );
}

function MacroChip({
  label,
  value,
  color,
  bg,
}: {
  label: string;
  value: string;
  color: string;
  bg: string;
}) {
  return (
    <View style={[s.macroChip, { backgroundColor: bg }]}>
      <Text style={[s.macroLabel, { color }]}>{label}</Text>
      <Text style={[s.macroValue, { color }]}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  dayHero: {
    backgroundColor: '#F4FBF6',
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: '#DDEFE3',
    padding: 18,
    gap: 14,
    overflow: 'hidden',
    ...Shadows.card,
  },
  dayHeroGlowTop: {
    position: 'absolute',
    top: -70,
    right: -48,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(123,196,127,0.18)',
  },
  dayHeroGlowBottom: {
    position: 'absolute',
    left: -24,
    bottom: -52,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(11,107,148,0.08)',
  },
  dayHeroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 14,
  },
  dayHeroCopy: {
    flex: 1,
    gap: 4,
  },
  dayHeroEyebrow: {
    ...Typography.caption,
    color: Brand.greenDark,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  dayHeroTitle: {
    ...Typography.title,
    color: Brand.text,
    fontWeight: '800',
  },
  dayHeroHint: {
    ...Typography.body,
    color: Brand.textSecondary,
  },
  dayHeroBadge: {
    minWidth: 80,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  dayHeroBadgeValue: {
    fontSize: 22,
    fontWeight: '800',
    color: Brand.greenDark,
  },
  dayHeroBadgeLabel: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '700',
  },
  loadingText: {
    ...Typography.body,
    color: Brand.textSecondary,
  },
  dayHeroTopRow: {
    flexDirection: 'row',
    gap: 12,
  },
  calorieCard: {
    flex: 1.1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    gap: 8,
  },
  calorieLabel: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  kcalRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },
  kcalValue: {
    fontSize: 34,
    fontWeight: '800',
    color: Brand.text,
    lineHeight: 36,
  },
  kcalUnit: {
    ...Typography.body,
    color: Brand.textSecondary,
    fontWeight: '700',
  },
  hydrationCard: {
    flex: 0.9,
    backgroundColor: '#E9F7FB',
    borderRadius: 20,
    padding: 16,
    gap: 6,
  },
  hydrationCardIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#D7F0F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hydrationCardLabel: {
    ...Typography.caption,
    color: '#0B6B94',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  hydrationCardValue: {
    ...Typography.subtitle,
    color: Brand.text,
    fontWeight: '800',
  },
  hydrationTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: '#D7EFF7',
    overflow: 'hidden',
  },
  hydrationFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#0B6B94',
  },
  hydrationHint: {
    ...Typography.body,
    color: Brand.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 18,
    padding: 14,
    gap: 4,
  },
  statCardMeals: {
    backgroundColor: '#FFFFFF',
  },
  statCardWater: {
    backgroundColor: '#E9F7FB',
  },
  statCardEvents: {
    backgroundColor: '#F5F1FF',
  },
  statLabel: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  statValue: {
    ...Typography.subtitle,
    color: Brand.text,
    fontWeight: '800',
  },
  statHint: {
    ...Typography.caption,
    color: Brand.textSecondary,
  },
  macroRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  macroChip: {
    flex: 1,
    minWidth: 96,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 4,
  },
  macroLabel: {
    ...Typography.caption,
    fontWeight: '700',
  },
  macroValue: {
    ...Typography.subtitle,
    fontWeight: '800',
  },
});
