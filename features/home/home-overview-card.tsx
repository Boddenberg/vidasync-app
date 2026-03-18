import Ionicons from '@expo/vector-icons/Ionicons';
import { Animated, Modal, Pressable, Text, View } from 'react-native';

import { HomeHydrationGoalSlider } from '@/features/home/home-hydration-goal-slider';
import { s } from '@/features/home/home-overview-card.styles';
import { formatLiters, formatMetricValue, HOME_MACRO_TONES, type GoalProgress } from '@/features/home/home-utils';
import { HYDRATION_GOAL_MAX_ML, HYDRATION_GOAL_MIN_ML } from '@/utils/hydration';

type Props = {
  mealsCount: number;
  goalsLoading: boolean;
  hasAnyGoals: boolean;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  calorieBadgeValue: string;
  calorieSummaryText: string;
  macroGoalItems: GoalProgress[];
  dayWidth: Animated.AnimatedInterpolation<string | number>;
  hydrationLoading: boolean;
  hydrationSaving: boolean;
  hydrationMl: number;
  hydrationGoal: number | null;
  goalReached: boolean;
  hydrationWidth: Animated.AnimatedInterpolation<string | number>;
  hydrationScale: Animated.AnimatedInterpolation<string | number>;
  goalsError: string | null;
  hydrationGoalMenuOpen: boolean;
  hydrationGoalDraftMl: number;
  hydrationError: string | null;
  onOpenGoals: () => void;
  onToggleGoalMenu: () => void;
  onCloseGoalMenu: () => void;
  onDraftChange: (goalMl: number) => void;
  onCommitGoal: (goalMl: number) => void;
};

type MacroKey = 'protein' | 'carbs' | 'fat';

export function HomeOverviewCard({
  mealsCount,
  goalsLoading,
  hasAnyGoals,
  calories,
  protein,
  carbs,
  fat,
  calorieBadgeValue,
  calorieSummaryText,
  macroGoalItems,
  dayWidth,
  hydrationLoading,
  hydrationSaving,
  hydrationMl,
  hydrationGoal,
  goalReached,
  hydrationWidth,
  hydrationScale,
  goalsError,
  hydrationGoalMenuOpen,
  hydrationGoalDraftMl,
  hydrationError,
  onOpenGoals,
  onToggleGoalMenu,
  onCloseGoalMenu,
  onDraftChange,
  onCommitGoal,
}: Props) {
  const mealCountLabel = mealsCount === 1 ? 'refeicao' : 'refeicoes';
  const remainingText = goalsLoading ? 'Atualizando metas...' : calorieSummaryText;
  const progressBadgeValue = goalsLoading ? '...' : hasAnyGoals ? calorieBadgeValue : '--';
  const waterGoalLabel = hydrationGoal ? formatLiters(hydrationGoal) : '--';

  const macroGoals = new Map<MacroKey, GoalProgress>();
  macroGoalItems.forEach((item) => {
    if (item.key !== 'calories') {
      macroGoals.set(item.key, item);
    }
  });

  const macroItems = [
    {
      key: 'protein' as const,
      label: 'Proteina',
      value: protein,
      tone: HOME_MACRO_TONES.protein,
    },
    {
      key: 'carbs' as const,
      label: 'Carbos',
      value: carbs,
      tone: HOME_MACRO_TONES.carbs,
    },
    {
      key: 'fat' as const,
      label: 'Gordura',
      value: fat,
      tone: HOME_MACRO_TONES.fat,
    },
  ];

  return (
    <View style={s.card}>
      <View pointerEvents="none" style={s.glowTop} />
      <View pointerEvents="none" style={s.glowBottom} />

      <View style={s.header}>
        <Text style={s.title}>Panorama do dia</Text>

        <Pressable style={({ pressed }) => [s.action, pressed && s.pressed]} onPress={onOpenGoals}>
          <Text style={s.actionText}>{hasAnyGoals ? 'Metas' : 'Criar metas'}</Text>
        </Pressable>
      </View>

      <View style={s.summaryRow}>
        <View style={s.calorieBlock}>
          <Text style={s.overline}>Calorias</Text>
          <View style={s.calorieValueRow}>
            <Text style={s.calorieValue}>{calories}</Text>
            <Text style={s.calorieUnit}>kcal</Text>
          </View>
        </View>

        <View style={s.badgesColumn}>
          <View style={[s.badge, s.badgeGoal]}>
            <Text style={s.badgeValue}>{progressBadgeValue}</Text>
            <Text style={s.badgeLabel}>meta</Text>
          </View>

          <View style={[s.badge, s.badgeMeals]}>
            <Text style={s.badgeValue}>{mealsCount}</Text>
            <Text style={s.badgeLabel}>{mealCountLabel}</Text>
          </View>
        </View>
      </View>

      <View style={s.progressSection}>
        <View style={s.progressTrack}>
          <Animated.View style={[s.progressFill, { width: dayWidth }]} />
        </View>
        <Text numberOfLines={1} style={s.remainingText}>
          {remainingText}
        </Text>
      </View>

      <View style={s.divider} />

      <View style={s.macroStrip}>
        {macroItems.map((item) => {
          const goal = macroGoals.get(item.key);
          const progressText = goal ? `${Math.round(goal.progress * 100)}%` : '0%';

          return (
            <View key={item.key} style={s.macroItem}>
              <View style={s.macroHeader}>
                <View style={[s.macroDot, { backgroundColor: item.tone.color }]} />
                <Text numberOfLines={1} style={s.macroLabel}>
                  {item.label}
                </Text>
              </View>

              <Text adjustsFontSizeToFit numberOfLines={1} style={s.macroValue}>
                {formatMetricValue(item.value, 'g')}
              </Text>

              <View style={[s.macroTrack, { backgroundColor: `${item.tone.color}20` }]}>
                <View style={[s.macroFill, { width: progressText, backgroundColor: item.tone.color }]} />
              </View>
            </View>
          );
        })}
      </View>

      <View style={s.divider} />

      <View style={s.waterSection}>
        <View style={s.waterHeader}>
          <View style={s.waterLabelRow}>
            <Ionicons name="water-outline" size={15} color={goalReached ? '#146C38' : '#2D9CDB'} />
            <Text style={s.overline}>Agua</Text>
          </View>

          <Pressable
            disabled={hydrationSaving || hydrationLoading}
            style={({ pressed }) => [s.waterAction, (hydrationSaving || hydrationLoading) && s.disabled, pressed && s.pressed]}
            onPress={onToggleGoalMenu}>
            <Ionicons name="options-outline" size={14} color="#2D9CDB" />
          </Pressable>
        </View>

        <View style={s.waterValueRow}>
          <Animated.Text
            style={[
              s.waterValue,
              goalReached ? s.waterValueDone : null,
              { transform: [{ scale: hydrationScale }] },
            ]}>
            {formatLiters(hydrationMl)}
          </Animated.Text>
          <Text style={s.waterGoal}>/ {waterGoalLabel}</Text>
        </View>

        <View style={s.waterTrack}>
          <Animated.View style={[s.waterFill, goalReached ? s.waterFillDone : null, { width: hydrationWidth }]} />
        </View>
      </View>

      <Modal visible={hydrationGoalMenuOpen} transparent animationType="fade" onRequestClose={onCloseGoalMenu}>
        <View style={s.hydrationGoalModalOverlay}>
          <Pressable style={s.hydrationGoalModalBackdrop} onPress={onCloseGoalMenu} />

          <View style={s.hydrationGoalMenu}>
            <View style={s.hydrationGoalMenuHeader}>
              <View style={s.hydrationGoalMenuCopy}>
                <Text style={s.hydrationGoalMenuTitle}>Meta diaria de agua</Text>
                <Text style={s.hydrationGoalMenuHint}>Deslize para ajustar de 1L a 10L.</Text>
              </View>

              <View style={s.hydrationGoalValueBadge}>
                <Text style={s.hydrationGoalValue}>{formatLiters(hydrationGoalDraftMl)}</Text>
                <Text style={s.hydrationGoalValueLabel}>{hydrationSaving ? 'salvando' : 'meta atual'}</Text>
              </View>
            </View>

            <HomeHydrationGoalSlider
              value={hydrationGoalDraftMl}
              disabled={hydrationSaving}
              onChange={onDraftChange}
              onChangeEnd={onCommitGoal}
            />

            <View style={s.hydrationGoalScale}>
              <Text style={s.hydrationGoalScaleLabel}>{formatLiters(HYDRATION_GOAL_MIN_ML)}</Text>
              <Text style={s.hydrationGoalScaleHint}>passos de 100ml</Text>
              <Text style={s.hydrationGoalScaleLabel}>{formatLiters(HYDRATION_GOAL_MAX_ML)}</Text>
            </View>
          </View>
        </View>
      </Modal>

      {goalsError ? <Text style={s.error}>{goalsError}</Text> : null}
      {hydrationError ? <Text style={s.error}>{hydrationError}</Text> : null}
    </View>
  );
}
