import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { Brand, Radii, Shadows, Typography } from '@/constants/theme';
import { dayHeading, formatWaterLiters } from '@/features/history/history-utils';
import type { WaterEvent, WaterStatus } from '@/services/water';

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
    ? 'Sem água registrada'
    : waterStatus.goalMl > 0
      ? `${formatWaterLiters(waterStatus.consumedMl)} / ${formatWaterLiters(waterStatus.goalMl)}`
      : `${formatWaterLiters(waterStatus.consumedMl)} registrados`;
  const hydrationHint = !waterStatus || waterEvents.length === 0
    ? 'Nenhum ajuste de água nesta data.'
    : waterStatus.goalMl > 0
      ? waterStatus.goalReached
        ? 'Meta de água concluída.'
        : `${Math.round(waterStatus.remainingMl)} ml para fechar a meta.`
      : `${waterEvents.length} ${waterEvents.length === 1 ? 'ajuste' : 'ajustes'} de água registrados.`;
  const dayHeroHint = totalEntries > 0
    ? 'Um panorama rápido do que entrou no seu dia.'
    : 'Quando você registrar pratos e água, o resumo aparece aqui.';

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
              <Text style={s.calorieLabel}>Você consumiu</Text>
              <View style={s.kcalRow}>
                <Text style={s.kcalValue}>{calories}</Text>
                <Text style={s.kcalUnit}>kcal</Text>
              </View>
            </View>

            <View style={s.hydrationCard}>
              <View style={s.hydrationCardIcon}>
                <Ionicons name="water-outline" size={18} color={Brand.hydration} />
              </View>
              <Text style={s.hydrationCardLabel}>Água</Text>
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
              hint="no dia"
              tone="meals"
            />
            <StatCard
              label="Água"
              value={waterStatus ? formatWaterLiters(waterStatus.consumedMl) : '0.0L'}
              hint="hoje"
              tone="water"
            />
            <StatCard
              label="Ajustes"
              value={`${waterEvents.length}`}
              hint={waterEvents.length === 1 ? 'ação' : 'ações'}
              tone="events"
            />
          </View>

          <View style={s.macroRow}>
            <MacroChip label="Proteína" value={`${protein}g`} color={Brand.macroProtein} bg={Brand.macroProteinBg} />
            <MacroChip label="Carbos" value={`${carbs}g`} color={Brand.macroCarb} bg={Brand.macroCarbBg} />
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
      <Text adjustsFontSizeToFit minimumFontScale={0.85} numberOfLines={1} style={s.statLabel}>
        {label}
      </Text>
      <Text adjustsFontSizeToFit minimumFontScale={0.85} numberOfLines={1} style={s.statValue}>
        {value}
      </Text>
      <Text adjustsFontSizeToFit minimumFontScale={0.8} numberOfLines={1} style={s.statHint}>
        {hint}
      </Text>
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
      <Text adjustsFontSizeToFit minimumFontScale={0.85} numberOfLines={1} style={[s.macroLabel, { color }]}>
        {label}
      </Text>
      <Text style={[s.macroValue, { color }]}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  dayHero: {
    backgroundColor: Brand.sageMist,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: 20,
    gap: 16,
    overflow: 'hidden',
    ...Shadows.card,
  },
  dayHeroGlowTop: {
    position: 'absolute',
    top: -70,
    right: -48,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(33, 166, 99, 0.10)',
  },
  dayHeroGlowBottom: {
    position: 'absolute',
    left: -28,
    bottom: -52,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(89, 184, 255, 0.10)',
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
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
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
    minWidth: 96,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 24,
    backgroundColor: Brand.card,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    ...Shadows.card,
  },
  dayHeroBadgeValue: {
    fontSize: 28,
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
    flex: 1.15,
    backgroundColor: Brand.card,
    borderRadius: 24,
    padding: 18,
    gap: 8,
    ...Shadows.card,
  },
  calorieLabel: {
    ...Typography.body,
    color: Brand.textSecondary,
  },
  kcalRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    minWidth: 0,
  },
  kcalValue: {
    fontSize: 44,
    fontWeight: '800',
    color: Brand.text,
    lineHeight: 46,
    flexShrink: 1,
  },
  kcalUnit: {
    ...Typography.subtitle,
    color: Brand.textSecondary,
    fontWeight: '700',
    marginBottom: 4,
    flexShrink: 0,
  },
  hydrationCard: {
    flex: 0.9,
    backgroundColor: Brand.hydrationBg,
    borderRadius: 24,
    padding: 18,
    gap: 8,
  },
  hydrationCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: '#D2EBFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hydrationCardLabel: {
    ...Typography.caption,
    color: Brand.hydration,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  hydrationCardValue: {
    ...Typography.subtitle,
    color: Brand.text,
    fontWeight: '800',
  },
  hydrationTrack: {
    height: 12,
    borderRadius: Radii.pill,
    backgroundColor: '#CCE8F7',
    overflow: 'hidden',
  },
  hydrationFill: {
    height: '100%',
    borderRadius: Radii.pill,
    backgroundColor: Brand.hydration,
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
    borderRadius: 22,
    padding: 14,
    gap: 4,
  },
  statCardMeals: {
    backgroundColor: Brand.card,
  },
  statCardWater: {
    backgroundColor: Brand.hydrationBg,
  },
  statCardEvents: {
    backgroundColor: Brand.warningBg,
  },
  statLabel: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '800',
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
    borderRadius: 18,
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
