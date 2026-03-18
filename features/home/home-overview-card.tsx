import { Animated, Pressable, Text, View } from 'react-native';

import { s } from '@/features/home/home-overview-card.styles';
import { formatLiters, formatMetricValue, HOME_MACRO_TONES, type GoalProgress } from '@/features/home/home-utils';

type Props = {
  mealsCount: number;
  heroTitle: string;
  goalsLoading: boolean;
  hasAnyGoals: boolean;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  calorieBadgeValue: string;
  calorieBadgeLabel: string;
  calorieSummaryText: string;
  calorieSecondaryText?: string;
  macroGoalItems: GoalProgress[];
  dayWidth: Animated.AnimatedInterpolation<string | number>;
  hydrationLoading: boolean;
  hydrationMl: number;
  hydrationGoal: number | null;
  hydrationProgress: number;
  hydrationStatusText: string;
  hydrationWidth: Animated.AnimatedInterpolation<string | number>;
  hydrationScale: Animated.AnimatedInterpolation<string | number>;
  goalsError: string | null;
  onOpenGoals: () => void;
};

type MacroKey = 'protein' | 'carbs' | 'fat';

export function HomeOverviewCard({
  mealsCount,
  heroTitle,
  goalsLoading,
  hasAnyGoals,
  calories,
  protein,
  carbs,
  fat,
  calorieBadgeValue,
  calorieBadgeLabel,
  calorieSummaryText,
  calorieSecondaryText,
  macroGoalItems,
  dayWidth,
  hydrationLoading,
  hydrationMl,
  hydrationGoal,
  hydrationProgress,
  hydrationStatusText,
  hydrationWidth,
  hydrationScale,
  goalsError,
  onOpenGoals,
}: Props) {
  const mealCountLabel = mealsCount === 1 ? 'refeição' : 'refeições';
  const calorieSummary = goalsLoading
    ? 'Atualizando suas metas e referências do dia...'
    : calorieSummaryText;
  const nutritionSupport = goalsLoading
    ? 'Os alvos aparecem assim que o painel sincronizar.'
    : calorieSecondaryText ?? (hasAnyGoals ? `${calorieBadgeValue} ${calorieBadgeLabel}` : 'Defina metas para acompanhar melhor.');
  const progressBadgeValue = goalsLoading ? '...' : hasAnyGoals ? calorieBadgeValue : '--';
  const progressBadgeLabel = goalsLoading ? 'carregando' : hasAnyGoals ? calorieBadgeLabel : 'sem meta';
  const hydrationGoalLabel = hydrationGoal ? formatLiters(hydrationGoal) : '--';
  const hydrationBadgeText = hydrationGoal
    ? `${Math.round(hydrationProgress * 100)}%`
    : 'Sem meta';
  const hydrationSupport = hydrationLoading ? 'Carregando panorama de água...' : hydrationStatusText;

  const macroGoals = new Map<MacroKey, GoalProgress>();
  macroGoalItems.forEach((item) => {
    if (item.key !== 'calories') {
      macroGoals.set(item.key, item);
    }
  });

  const macroCards = [
    {
      key: 'protein' as const,
      label: 'Proteína',
      consumed: protein,
      tone: HOME_MACRO_TONES.protein,
    },
    {
      key: 'carbs' as const,
      label: 'Carboidrato',
      consumed: carbs,
      tone: HOME_MACRO_TONES.carbs,
    },
    {
      key: 'fat' as const,
      label: 'Gordura',
      consumed: fat,
      tone: HOME_MACRO_TONES.fat,
    },
  ];

  return (
    <View style={s.card}>
      <View pointerEvents="none" style={s.glowTop} />
      <View pointerEvents="none" style={s.glowBottom} />

      <View style={s.header}>
        <View style={s.headerCopy}>
          <Text style={s.eyebrow}>{heroTitle}</Text>
          <Text style={s.title}>Panorama do dia</Text>
          <Text style={s.headerSupport}>Calorias, macros e água em um só lugar.</Text>
        </View>

        <Pressable style={({ pressed }) => [s.action, pressed && s.pressed]} onPress={onOpenGoals}>
          <Text style={s.actionText}>{hasAnyGoals ? 'Ajustar metas' : 'Criar metas'}</Text>
        </Pressable>
      </View>

      <View style={s.nutritionPanel}>
        <View style={s.nutritionTop}>
          <View style={s.calorieBlock}>
            <Text style={s.panelLabel}>Calorias</Text>
            <View style={s.calorieValueRow}>
              <Text style={s.calorieValue}>{calories}</Text>
              <Text style={s.calorieUnit}>kcal</Text>
            </View>
          </View>

          <View style={s.nutritionBadges}>
            <View style={s.progressBadge}>
              <Text style={s.progressBadgeValue}>{progressBadgeValue}</Text>
              <Text style={s.progressBadgeLabel}>{progressBadgeLabel}</Text>
            </View>

            <View style={s.mealBadge}>
              <Text style={s.mealBadgeValue}>{mealsCount}</Text>
              <Text style={s.mealBadgeLabel}>{mealCountLabel}</Text>
            </View>
          </View>
        </View>

        <View style={s.nutritionTrack}>
          <Animated.View style={[s.nutritionFill, { width: dayWidth }]} />
        </View>

        <Text style={s.nutritionSummary}>{calorieSummary}</Text>
        <Text style={s.nutritionSecondary}>{nutritionSupport}</Text>
      </View>

      <View style={s.macroSection}>
        <View style={s.macroHeader}>
          <Text style={s.macroTitle}>Macros</Text>
          <Text style={s.macroSupport}>Agora os 3 ficam juntos no mesmo bloco</Text>
        </View>

        <View style={s.macroGrid}>
          {macroCards.map((card) => {
            const goal = macroGoals.get(card.key);
            const goalText = goal ? `Meta ${formatMetricValue(Math.round(goal.goal), 'g')}` : 'Sem meta';
            const progressText = goal ? (`${Math.round(goal.progress * 100)}%` as const) : ('0%' as const);

            return (
              <View
                key={card.key}
                style={[
                  s.macroCard,
                  {
                    backgroundColor: card.tone.bg,
                    borderColor: `${card.tone.color}22`,
                  },
                ]}>
                <View style={s.macroTop}>
                  <View style={s.macroLabelRow}>
                    <View style={[s.macroDot, { backgroundColor: card.tone.color }]} />
                    <Text style={s.macroLabel}>{card.label}</Text>
                  </View>

                  <Text style={s.macroValue}>{formatMetricValue(card.consumed, 'g')}</Text>
                  <Text style={s.macroGoal}>{goalText}</Text>
                </View>

                <View style={s.macroTrack}>
                  <View style={[s.macroTrackBase, { backgroundColor: '#FFFFFF80' }]} />
                  <View style={[s.macroFill, { width: progressText, backgroundColor: card.tone.color }]} />
                </View>
              </View>
            );
          })}
        </View>
      </View>

      <View style={s.hydrationPanel}>
        <View style={s.hydrationHeader}>
          <Text style={s.hydrationLabel}>Água</Text>
          <View style={s.hydrationBadge}>
            <Text style={s.hydrationBadgeText}>{hydrationBadgeText}</Text>
          </View>
        </View>

        <View style={s.hydrationValueRow}>
          <Animated.Text style={[s.hydrationValue, { transform: [{ scale: hydrationScale }] }]}>
            {formatLiters(hydrationMl)}
          </Animated.Text>
          <Text style={s.hydrationGoal}>/ {hydrationGoalLabel}</Text>
        </View>

        <View style={s.hydrationTrack}>
          <Animated.View style={[s.hydrationFill, { width: hydrationWidth }]} />
        </View>

        <Text style={s.hydrationSupport}>{hydrationSupport}</Text>
      </View>

      {goalsError ? <Text style={s.error}>{goalsError}</Text> : null}
    </View>
  );
}
