import Ionicons from '@expo/vector-icons/Ionicons';
import { Animated, Modal, Pressable, Text, View } from 'react-native';

import { Brand } from '@/constants/theme';
import { HomeCalorieRing } from '@/features/home/home-calorie-ring';
import { HomeHydrationGoalSlider } from '@/features/home/home-hydration-goal-slider';
import { s } from '@/features/home/home-overview-card.styles';
import { formatLiters, formatMetricValue, HOME_MACRO_TONES, HYDRATION_QUICK_ACTIONS, type GoalProgress } from '@/features/home/home-utils';
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
  onQuickHydration: (params: { deltaMl?: number; goalMl?: number }) => void | Promise<void>;
};

type MacroKey = 'protein' | 'carbs' | 'fat';

type MacroItem = {
  key: MacroKey;
  label: string;
  value: number;
  icon: 'flash' | 'nutrition' | 'water';
  tone: { color: string; bg: string };
};

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
  onQuickHydration,
}: Props) {
  const mealCountLabel = mealsCount === 1 ? 'refeição' : 'refeições';
  const progressBadgeValue = goalsLoading ? '...' : hasAnyGoals ? calorieBadgeValue : '—';
  const waterGoalLabel = hydrationGoal ? formatLiters(hydrationGoal) : '—';

  const macroGoals = new Map<MacroKey, GoalProgress>();
  macroGoalItems.forEach((item) => {
    if (item.key !== 'calories') {
      macroGoals.set(item.key, item);
    }
  });

  const macroItems: MacroItem[] = [
    {
      key: 'protein',
      label: 'Proteína',
      value: protein,
      icon: 'flash',
      tone: HOME_MACRO_TONES.protein,
    },
    {
      key: 'carbs',
      label: 'Carboidrato',
      value: carbs,
      icon: 'nutrition',
      tone: HOME_MACRO_TONES.carbs,
    },
    {
      key: 'fat',
      label: 'Gordura',
      value: fat,
      icon: 'water',
      tone: HOME_MACRO_TONES.fat,
    },
  ];

  // Calorie goal derivation for the ring
  const calorieGoal = (() => {
    // macroGoalItems doesn't include calories; we infer from calorieBadgeValue + calories
    const pct = parseInt(calorieBadgeValue.replace('%', ''), 10);
    if (!Number.isFinite(pct) || pct <= 0) return null;
    return Math.round((calories * 100) / pct);
  })();
  const calorieProgress = calorieGoal && calorieGoal > 0 ? calories / calorieGoal : 0;
  const calorieReached = Boolean(hasAnyGoals && calorieGoal && calories >= calorieGoal);

  const hydrationActions = HYDRATION_QUICK_ACTIONS;

  return (
    <View style={{ gap: 18 }}>
      {/* === Hero: Calorias + Macros === */}
      <View style={s.card}>
        <View pointerEvents="none" style={s.glowTop} />
        <View pointerEvents="none" style={s.glowBottom} />

        <View style={s.header}>
          <View style={s.headerLeft}>
            <Text style={s.title}>Meu dia</Text>
            <Text style={s.subtitle}>{calorieSummaryText}</Text>
          </View>

          <Pressable style={({ pressed }) => [s.action, pressed && s.pressed]} onPress={onOpenGoals}>
            <Ionicons name={hasAnyGoals ? 'options-outline' : 'add-circle-outline'} size={14} color={Brand.greenDeeper} />
            <Text style={s.actionText}>{hasAnyGoals ? 'Metas' : 'Criar metas'}</Text>
          </Pressable>
        </View>

        <View style={s.ringRow}>
          <HomeCalorieRing
            progress={calorieProgress}
            calories={calories}
            goal={calorieGoal}
            reached={calorieReached}
          />
        </View>

        <View style={s.badgesRow}>
          <View style={[s.badge, s.badgeGoal]}>
            <View style={s.badgeIcon}>
              <Ionicons name="trophy-outline" size={18} color={Brand.greenDeeper} />
            </View>
            <View style={s.badgeContent}>
              <Text style={s.badgeValue}>{progressBadgeValue}</Text>
              <Text style={s.badgeLabel}>da meta</Text>
            </View>
          </View>

          <View style={[s.badge, s.badgeMeals]}>
            <View style={s.badgeIcon}>
              <Ionicons name="restaurant-outline" size={18} color={Brand.coral} />
            </View>
            <View style={s.badgeContent}>
              <Text style={s.badgeValue}>{mealsCount}</Text>
              <Text style={s.badgeLabel}>{mealCountLabel}</Text>
            </View>
          </View>
        </View>

        <View style={s.divider} />

        <View style={s.macroSectionHeader}>
          <Text style={s.macroTitle}>Macronutrientes</Text>
        </View>

        <View style={s.macroStrip}>
          {macroItems.map((item) => {
            const goal = macroGoals.get(item.key);
            const progressWidth = `${Math.round((goal?.progress ?? 0) * 100)}%` as `${number}%`;
            const hasGoal = goal && goal.goal > 0;

            return (
              <View
                key={item.key}
                style={[
                  s.macroItem,
                  {
                    backgroundColor: `${item.tone.color}14`,
                    borderColor: `${item.tone.color}22`,
                  },
                ]}>
                <View style={s.macroHeader}>
                  <View style={[s.macroIconWrap, { backgroundColor: `${item.tone.color}22` }]}>
                    <Ionicons name={item.icon} size={14} color={item.tone.color} />
                  </View>
                  <Text numberOfLines={1} style={s.macroLabel}>
                    {item.label}
                  </Text>
                </View>

                <View style={s.macroValueRow}>
                  <Text adjustsFontSizeToFit numberOfLines={1} style={s.macroValue}>
                    {formatMetricValue(item.value, '')}
                  </Text>
                  <Text style={s.macroUnit}>g</Text>
                </View>

                <View style={[s.macroTrack, { backgroundColor: `${item.tone.color}26` }]}>
                  <View
                    style={[s.macroFill, { width: progressWidth, backgroundColor: item.tone.color }]}
                  />
                </View>

                {hasGoal ? (
                  <Text style={s.macroGoalText}>{`/ ${Math.round(goal!.goal)}g`}</Text>
                ) : (
                  <Text style={s.macroGoalText}>sem meta</Text>
                )}
              </View>
            );
          })}
        </View>

        {goalsError ? <Text style={s.error}>{goalsError}</Text> : null}
      </View>

      {/* === Hidratação === */}
      <View style={s.hydrationCard}>
        <View pointerEvents="none" style={[s.hydrationGlow, goalReached && s.hydrationGlowDone]} />

        <View style={s.hydrationHeader}>
          <View style={s.hydrationHeaderLeft}>
            <View style={[s.hydrationIconWrap, goalReached && s.hydrationIconWrapDone]}>
              <Ionicons
                name={goalReached ? 'checkmark-circle' : 'water'}
                size={22}
                color={goalReached ? Brand.fresh : Brand.hydration}
              />
            </View>
            <View style={s.hydrationTitleCol}>
              <Text style={s.hydrationTitle}>Hidratação</Text>
              <Text style={s.hydrationSubtitle}>
                {goalReached ? 'Meta concluída hoje' : hydrationGoal ? 'Mantenha o ritmo' : 'Defina sua meta'}
              </Text>
            </View>
          </View>

          <Pressable
            disabled={hydrationSaving || hydrationLoading}
            style={({ pressed }) => [
              s.hydrationSettingsBtn,
              (hydrationSaving || hydrationLoading) && s.disabled,
              pressed && s.pressed,
            ]}
            onPress={onToggleGoalMenu}>
            <Ionicons name="options-outline" size={16} color={Brand.hydration} />
          </Pressable>
        </View>

        <View style={s.hydrationValueRow}>
          <Animated.Text
            style={[
              s.hydrationValue,
              goalReached ? s.hydrationValueDone : null,
              { transform: [{ scale: hydrationScale }] },
            ]}>
            {formatLiters(hydrationMl)}
          </Animated.Text>
          <Text style={s.hydrationGoalLabel}>/ {waterGoalLabel}</Text>
        </View>

        <View style={s.hydrationTrack}>
          <Animated.View
            style={[s.hydrationFill, goalReached ? s.hydrationFillDone : null, { width: hydrationWidth }]}
          />
        </View>

        <View style={s.hydrationActionsRow}>
          {hydrationActions.map((action) => {
            const isPositive = action.tone === 'positive';

            return (
              <Pressable
                key={action.label}
                disabled={hydrationSaving || hydrationLoading}
                style={({ pressed }) => [
                  s.hydrationQuickAction,
                  isPositive ? s.hydrationQuickActionPositive : s.hydrationQuickActionNegative,
                  (hydrationSaving || hydrationLoading) && s.disabled,
                  pressed && s.pressed,
                ]}
                onPress={() => onQuickHydration({ deltaMl: action.deltaMl })}>
                <Ionicons
                  name={isPositive ? 'add' : 'remove'}
                  size={14}
                  color={isPositive ? Brand.hydration : '#9F1D39'}
                />
                <Text
                  style={[
                    s.hydrationQuickActionText,
                    isPositive ? s.hydrationQuickActionTextPositive : s.hydrationQuickActionTextNegative,
                  ]}>
                  {action.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {hydrationError ? <Text style={s.error}>{hydrationError}</Text> : null}
      </View>

      <Modal visible={hydrationGoalMenuOpen} transparent animationType="fade" onRequestClose={onCloseGoalMenu}>
        <View style={s.hydrationGoalModalOverlay}>
          <Pressable style={s.hydrationGoalModalBackdrop} onPress={onCloseGoalMenu} />

          <View style={s.hydrationGoalMenu}>
            <View style={s.hydrationGoalMenuHeader}>
              <View style={s.hydrationGoalMenuCopy}>
                <Text style={s.hydrationGoalMenuTitle}>Meta diária de água</Text>
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
    </View>
  );
}
