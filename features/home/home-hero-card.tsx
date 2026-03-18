import { Animated, Pressable, Text, View } from 'react-native';

import { s } from '@/features/home/home-hero-card.styles';

type Props = {
  mealsCount: number;
  heroTitle: string;
  goalsLoading: boolean;
  hasAnyGoals: boolean;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  calorieBadgeValue: string;
  calorieBadgeLabel: string;
  calorieSummaryText: string;
  calorieSecondaryText?: string;
  macroGoalItems?: unknown[];
  mealSummaries?: unknown[];
  dayWidth: Animated.AnimatedInterpolation<string | number>;
  goalsError: string | null;
  onOpenGoals: () => void;
};

export function HomeHeroCard({
  mealsCount,
  heroTitle,
  goalsLoading,
  hasAnyGoals,
  calories,
  calorieBadgeValue,
  calorieBadgeLabel,
  calorieSummaryText,
  dayWidth,
  goalsError,
  onOpenGoals,
}: Props) {
  const mealCountLabel = mealsCount === 1 ? 'refeição' : 'refeições';
  const secondaryLine = /restantes|conclu/i.test(calorieSummaryText)
    ? calorieSummaryText
        .replace(/Meta .*conclu.*$/i, 'Meta batida')
        .replace(/kcal restantes?\.?/i, 'kcal livres')
        .replace(/para esta data\.?/i, '')
        .trim()
    : hasAnyGoals
      ? `${calorieBadgeValue} ${calorieBadgeLabel}`
      : 'Defina sua meta diária';

  return (
    <View style={s.hero}>
      <View pointerEvents="none" style={s.heroGlowTop} />
      <View pointerEvents="none" style={s.heroGlowBottom} />

      <View style={s.heroHeader}>
        <Text style={s.heroSectionLabel}>{heroTitle}</Text>
        <Pressable style={({ pressed }) => [s.goalAction, pressed && s.pressed]} onPress={onOpenGoals}>
          <Text style={s.goalActionText}>{hasAnyGoals ? 'Metas' : 'Meta'}</Text>
        </Pressable>
      </View>

      {goalsLoading ? (
        <View style={s.loadingBox}>
          <Text style={s.loadingText}>Carregando metas...</Text>
        </View>
      ) : (
        <>
          <View style={s.heroMainRow}>
            <View style={s.calorieBlock}>
              <Text style={s.calorieLabel}>Calorias</Text>
              <View style={s.calorieValueRow}>
                <Text style={s.calorieValue}>{calories}</Text>
                <Text style={s.calorieUnit}>kcal</Text>
              </View>
            </View>

            <View style={s.mealBadge}>
              <Text style={s.mealBadgeValue}>{mealsCount}</Text>
              <Text style={s.mealBadgeLabel}>{mealCountLabel}</Text>
            </View>
          </View>

          <View style={s.track}>
            <Animated.View style={[s.fill, { width: dayWidth }]} />
          </View>

          <Text style={s.heroSecondaryText}>{secondaryLine}</Text>
        </>
      )}

      {goalsError ? <Text style={s.error}>{goalsError}</Text> : null}
    </View>
  );
}
