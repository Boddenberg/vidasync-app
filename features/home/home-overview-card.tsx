import Ionicons from '@expo/vector-icons/Ionicons';
import { Animated, Modal, Pressable, Text, View, useWindowDimensions } from 'react-native';

import { HomeHydrationGoalSlider } from '@/features/home/home-hydration-goal-slider';
import { s } from '@/features/home/home-overview-card.styles';
import {
  formatLiters,
  formatMetricValue,
  HOME_MACRO_TONES,
  HYDRATION_QUICK_ACTIONS,
  type GoalProgress,
} from '@/features/home/home-utils';
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
  calorieBadgeLabel: string;
  calorieSummaryText: string;
  calorieSecondaryText?: string;
  macroGoalItems: GoalProgress[];
  dayWidth: Animated.AnimatedInterpolation<string | number>;
  hydrationLoading: boolean;
  hydrationSaving: boolean;
  hydrationMl: number;
  hydrationGoal: number | null;
  hydrationProgress: number;
  goalReached: boolean;
  hydrationStatusText: string;
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
  onQuickAction: (deltaMl: number) => void;
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
  calorieBadgeLabel,
  calorieSummaryText,
  calorieSecondaryText,
  macroGoalItems,
  dayWidth,
  hydrationLoading,
  hydrationSaving,
  hydrationMl,
  hydrationGoal,
  hydrationProgress,
  goalReached,
  hydrationStatusText,
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
  onQuickAction,
}: Props) {
  const { width } = useWindowDimensions();
  const mealCountLabel = mealsCount === 1 ? 'refeicao' : 'refeicoes';
  const calorieSummary = goalsLoading ? 'Atualizando suas metas e referencias do dia...' : calorieSummaryText;
  const nutritionSupport = goalsLoading
    ? 'Os alvos aparecem assim que o painel sincronizar.'
    : calorieSecondaryText ?? (hasAnyGoals ? `${calorieBadgeValue} ${calorieBadgeLabel}` : 'Defina metas para acompanhar melhor.');
  const progressBadgeValue = goalsLoading ? '...' : hasAnyGoals ? calorieBadgeValue : '--';
  const progressBadgeLabel = goalsLoading ? 'carregando' : hasAnyGoals ? calorieBadgeLabel : 'sem meta';
  const hydrationGoalLabel = hydrationGoal ? formatLiters(hydrationGoal) : '--';
  const hydrationMeta = hydrationGoal
    ? goalReached
      ? 'Meta batida'
      : `${Math.round(hydrationProgress * 100)}% da meta`
    : 'Sem meta';
  const hydrationSupport = hydrationLoading ? 'Carregando agua...' : hydrationStatusText;
  const supportColumns = width >= 420 ? 3 : 2;

  const macroGoals = new Map<MacroKey, GoalProgress>();
  macroGoalItems.forEach((item) => {
    if (item.key !== 'calories') {
      macroGoals.set(item.key, item);
    }
  });

  const macroCards = [
    {
      key: 'protein' as const,
      label: 'Proteina',
      consumed: protein,
      tone: HOME_MACRO_TONES.protein,
    },
    {
      key: 'carbs' as const,
      label: 'Carbos',
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
        <Text style={s.title}>Panorama do dia</Text>

        <Pressable style={({ pressed }) => [s.action, pressed && s.pressed]} onPress={onOpenGoals}>
          <Text style={s.actionText}>{hasAnyGoals ? 'Metas' : 'Criar metas'}</Text>
        </Pressable>
      </View>

      <View style={s.dashboardShell}>
        <View style={s.heroRow}>
          <View style={s.calorieSection}>
            <Text style={s.sectionLabel}>Calorias</Text>
            <View style={s.calorieValueRow}>
              <Text style={s.calorieValue}>{calories}</Text>
              <Text style={s.calorieUnit}>kcal</Text>
            </View>
            <Text numberOfLines={2} style={s.calorieSummary}>
              {calorieSummary}
            </Text>
          </View>

          <View style={s.secondaryColumn}>
            <View style={[s.secondaryMetric, s.secondaryMetricGoal]}>
              <Text style={s.secondaryLabel}>Meta</Text>
              <Text style={s.secondaryValue}>{progressBadgeValue}</Text>
              <Text numberOfLines={1} style={s.secondaryMeta}>
                {progressBadgeLabel}
              </Text>
            </View>

            <View style={[s.secondaryMetric, s.secondaryMetricMeals]}>
              <Text style={s.secondaryLabel}>Refeicoes</Text>
              <Text style={s.secondaryValue}>{mealsCount}</Text>
              <Text numberOfLines={1} style={s.secondaryMeta}>
                {mealCountLabel}
              </Text>
            </View>
          </View>
        </View>

        <View style={s.progressSection}>
          <View style={s.progressHeader}>
            <Text style={s.progressLabel}>Progresso diario</Text>
            <Text numberOfLines={1} style={s.progressCaption}>
              {nutritionSupport}
            </Text>
          </View>

          <View style={s.progressTrack}>
            <Animated.View style={[s.progressFill, { width: dayWidth }]} />
          </View>
        </View>

        <View style={s.supportSection}>
          <View style={s.supportSectionHeader}>
            <Text style={s.supportSectionLabel}>Macros e agua</Text>
            <Text numberOfLines={1} style={s.supportSectionCaption}>
              {hydrationSupport}
            </Text>
          </View>

          <View style={s.supportGrid}>
            {macroCards.map((card) => {
              const goal = macroGoals.get(card.key);
              const progressText = goal ? `${Math.round(goal.progress * 100)}%` : '0%';
              const goalText = goal ? `Meta ${formatMetricValue(Math.round(goal.goal), 'g')}` : 'Sem meta';

              return (
                <View
                  key={card.key}
                  style={[
                    s.supportCell,
                    supportColumns === 3 ? s.supportCellThree : s.supportCellTwo,
                    {
                      backgroundColor: card.tone.bg,
                      borderColor: `${card.tone.color}20`,
                    },
                  ]}>
                  <View style={s.supportHeader}>
                    <View style={s.supportLabelRow}>
                      <View style={[s.supportDot, { backgroundColor: card.tone.color }]} />
                      <Text numberOfLines={1} style={s.supportLabel}>
                        {card.label}
                      </Text>
                    </View>
                  </View>

                  <Text adjustsFontSizeToFit numberOfLines={1} style={s.supportValue}>
                    {formatMetricValue(card.consumed, 'g')}
                  </Text>

                  <Text numberOfLines={1} style={s.supportMeta}>
                    {goalText}
                  </Text>

                  <View style={[s.supportTrack, { backgroundColor: `${card.tone.color}20` }]}>
                    <View style={[s.supportFill, { width: progressText, backgroundColor: card.tone.color }]} />
                  </View>
                </View>
              );
            })}

            <View
              style={[
                s.supportCell,
                supportColumns === 3 ? s.supportCellThree : s.supportCellTwo,
                s.supportWaterCell,
              ]}>
              <View style={s.supportHeader}>
                <View style={s.supportLabelRow}>
                  <Ionicons name="water-outline" size={15} color="#2D9CDB" />
                  <Text numberOfLines={1} style={s.supportLabel}>
                    Agua
                  </Text>
                </View>

                <Pressable style={({ pressed }) => [s.inlineAction, pressed && s.pressed]} onPress={onToggleGoalMenu}>
                  <Ionicons name="options-outline" size={14} color="#2D9CDB" />
                </Pressable>
              </View>

              <View style={s.waterValueRow}>
                <Animated.Text style={[s.supportValue, s.supportWaterValue, { transform: [{ scale: hydrationScale }] }]}>
                  {formatLiters(hydrationMl)}
                </Animated.Text>
                <Text numberOfLines={1} style={s.supportMetaInline}>
                  / {hydrationGoalLabel}
                </Text>
              </View>

              <Text numberOfLines={1} style={s.supportMeta}>
                {hydrationMeta}
              </Text>

              <View style={s.supportTrackWater}>
                <Animated.View style={[s.supportFillWater, { width: hydrationWidth }]} />
              </View>
            </View>
          </View>

          <View style={s.controlsRow}>
            {HYDRATION_QUICK_ACTIONS.map((action) => (
              <Pressable
                key={action.label}
                disabled={hydrationSaving || hydrationLoading}
                style={({ pressed }) => [
                  s.controlChip,
                  action.tone === 'positive' ? s.controlChipPositive : s.controlChipNegative,
                  (hydrationSaving || hydrationLoading) && s.disabled,
                  pressed && s.pressed,
                ]}
                onPress={() => onQuickAction(action.deltaMl)}>
                <Ionicons
                  name={action.tone === 'positive' ? 'add' : 'remove'}
                  size={12}
                  color={action.tone === 'positive' ? '#2D9CDB' : '#BE123C'}
                />
                <Text
                  style={[
                    s.controlChipText,
                    action.tone === 'positive' ? s.controlChipTextPositive : s.controlChipTextNegative,
                  ]}>
                  {action.label}
                </Text>
              </Pressable>
            ))}

            <Pressable style={({ pressed }) => [s.controlChip, s.controlChipGoal, pressed && s.pressed]} onPress={onToggleGoalMenu}>
              <Ionicons name="tune-outline" size={12} color="#146C38" />
              <Text style={[s.controlChipText, s.controlChipTextGoal]}>Meta agua</Text>
            </Pressable>
          </View>
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
