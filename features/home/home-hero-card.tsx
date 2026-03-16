import Ionicons from '@expo/vector-icons/Ionicons';
import { Animated, Pressable, Text, View } from 'react-native';

import { Brand } from '@/constants/theme';
import { HomeMacroBar } from '@/features/home/home-macro-bar';
import { s } from '@/features/home/home-hero-card.styles';
import { formatMetricValue, type GoalProgress, type MealSummary } from '@/features/home/home-utils';

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
  calorieSecondaryText: string;
  macroGoalItems: GoalProgress[];
  mealSummaries: MealSummary[];
  dayWidth: Animated.AnimatedInterpolation<string | number>;
  goalsError: string | null;
  onOpenGoals: () => void;
  onOpenCalendar: () => void;
};

export function HomeHeroCard({
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
  mealSummaries,
  dayWidth,
  goalsError,
  onOpenGoals,
  onOpenCalendar,
}: Props) {
  const heroBadgeLabel = mealsCount === 1 ? 'refeição' : 'refeições';
  const hasConsumedMetrics = mealsCount > 0;
  const consumedMetrics = [
    { label: 'Calorias', value: calories, unit: ' kcal', color: Brand.greenDark, bg: Brand.surfaceSoft },
    { label: 'Proteína', value: protein, unit: 'g', color: Brand.macroProtein, bg: Brand.macroProteinBg },
    { label: 'Carboidrato', value: carbs, unit: 'g', color: Brand.macroCarb, bg: Brand.macroCarbBg },
    { label: 'Gordura', value: fat, unit: 'g', color: Brand.macroFat, bg: Brand.macroFatBg },
  ];

  return (
    <View style={s.hero}>
      <View pointerEvents="none" style={s.heroGlowTop} />
      <View pointerEvents="none" style={s.heroGlowBottom} />

      <View style={s.heroTop}>
        <View style={s.heroCopy}>
          <Text style={s.heroLabel}>Resumo nutricional</Text>
          <Text style={s.heroTitle}>{heroTitle}</Text>
          <Text style={s.heroSubtitle}>
            {mealsCount > 0
              ? 'Calorias, metas e períodos do dia prontos para bater o olho.'
              : 'Assim que você registrar refeições, este bloco vira o centro do seu dia.'}
          </Text>
        </View>

        <View style={s.heroBadge}>
          <Text style={s.heroBadgeValue}>{mealsCount}</Text>
          <Text style={s.heroBadgeLabel}>{heroBadgeLabel}</Text>
        </View>
      </View>

      {goalsLoading ? (
        <View style={s.loadingBox}>
          <Text style={s.loadingText}>Carregando metas desta data...</Text>
        </View>
      ) : hasAnyGoals ? (
        <>
          <View style={s.calorieSpotlight}>
            <View style={s.calorieSpotlightCopy}>
              <Text style={s.calorieSpotlightLabel}>Você consumiu</Text>
              <View style={s.calorieSpotlightRow}>
                <Text style={s.calorieSpotlightValue}>{calories}</Text>
                <Text style={s.calorieSpotlightUnit}>kcal</Text>
              </View>
              <Text style={s.calorieSpotlightHint}>{calorieSecondaryText}</Text>
            </View>

            <View style={s.calorieBadge}>
              <View style={s.calorieBadgeIcon}>
                <Ionicons name="sparkles-outline" size={16} color={Brand.greenDark} />
              </View>
              <Text style={s.calorieBadgeValue}>{calorieBadgeValue}</Text>
              <Text style={s.calorieBadgeLabel}>{calorieBadgeLabel}</Text>
            </View>
          </View>

          <View style={s.track}>
            <Animated.View style={[s.fill, { width: dayWidth }]} />
          </View>

          <View style={s.heroMetaRow}>
            <View style={[s.heroMetaChip, s.heroMetaChipPrimary]}>
              <Text style={[s.heroMetaChipText, s.heroMetaChipTextPrimary]}>{calorieSummaryText}</Text>
            </View>
            <View style={s.heroMetaChip}>
              <Text style={s.heroMetaChipText}>{calorieSecondaryText}</Text>
            </View>
          </View>

          <View style={s.macroSection}>
            <View style={s.rowBetween}>
              <Text style={s.sectionMiniTitle}>Macros do dia</Text>
              {macroGoalItems.length > 0 ? <Text style={s.counter}>{macroGoalItems.length} ativos</Text> : null}
            </View>

            {macroGoalItems.length > 0 ? (
              macroGoalItems.map((item) => (
                <HomeMacroBar
                  key={item.key}
                  label={item.label}
                  consumed={Math.round(item.consumed)}
                  goal={Math.round(item.goal)}
                  color={item.color}
                  bg={item.bg}
                  unit={item.unit}
                  remaining={Math.round(item.remaining)}
                />
              ))
            ) : (
              <Text style={s.sectionSub}>
                Cadastre proteína, carboidrato e gordura para acompanhar os macros com mais clareza.
              </Text>
            )}
          </View>
        </>
      ) : (
        <>
          <View style={s.emptyGoalState}>
            <Text style={s.emptyGoalTitle}>Consumo do dia</Text>
            <Text style={s.emptyGoalText}>
              {hasConsumedMetrics
                ? 'Sem meta cadastrada para esta data. Ainda assim, o resumo do que já entrou fica visível aqui.'
                : 'Sem meta e sem registros ainda. Assim que você lançar uma refeição, o panorama aparece aqui.'}
            </Text>
          </View>

          {hasConsumedMetrics ? (
            <View style={s.consumedMetricsGrid}>
              {consumedMetrics.map((item) => (
                <View key={item.label} style={[s.consumedMetricCard, { backgroundColor: item.bg }]}>
                  <Text style={s.consumedMetricLabel}>{item.label}</Text>
                  <Text style={[s.consumedMetricValue, { color: item.color }]}>
                    {formatMetricValue(item.value, item.unit)}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </>
      )}

      <View style={s.mealSummarySection}>
        <View style={s.rowBetween}>
          <Text style={s.sectionMiniTitle}>Períodos registrados</Text>
          <Text style={s.counter}>
            {mealsCount > 0 ? `${mealsCount} ${mealsCount === 1 ? 'item' : 'itens'}` : 'Sem registros'}
          </Text>
        </View>

        {mealSummaries.length > 0 ? (
          <View style={s.mealSummaryGrid}>
            {mealSummaries.map((item) => (
              <View key={item.type} style={s.mealSummaryCard}>
                <View style={s.mealSummaryHeader}>
                  <View style={[s.mealSummaryIcon, { backgroundColor: item.bg }]}>
                    <Ionicons name={item.icon} size={16} color={item.color} />
                  </View>
                  <View style={s.mealSummaryCopy}>
                    <Text style={s.mealSummaryLabel}>{item.label}</Text>
                    <Text style={s.mealSummaryCount}>
                      {item.count} {item.count === 1 ? 'registro' : 'registros'}
                    </Text>
                  </View>
                  <Text style={s.mealSummaryCalories}>{Math.round(item.calories)} kcal</Text>
                </View>

                <View style={s.mealSummaryMacroRow}>
                  <MealMacroChip label="Prot" value={Math.round(item.protein)} unit="g" color={Brand.macroProtein} bg={Brand.macroProteinBg} />
                  <MealMacroChip label="Carb" value={Math.round(item.carbs)} unit="g" color={Brand.macroCarb} bg={Brand.macroCarbBg} />
                  <MealMacroChip label="Gord" value={Math.round(item.fat)} unit="g" color={Brand.macroFat} bg={Brand.macroFatBg} />
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text style={s.sectionSub}>Os períodos aparecem aqui quando houver pratos registrados no dia.</Text>
        )}
      </View>

      <View style={s.heroActions}>
        <Pressable style={({ pressed }) => [s.secondaryChip, pressed && s.pressed]} onPress={onOpenGoals}>
          <Ionicons name="sparkles-outline" size={15} color={Brand.greenDark} />
          <Text style={s.secondaryChipText}>{hasAnyGoals ? 'Editar metas' : 'Criar metas'}</Text>
        </Pressable>
        <Pressable style={({ pressed }) => [s.secondaryChip, pressed && s.pressed]} onPress={onOpenCalendar}>
          <Ionicons name="calendar-outline" size={15} color={Brand.greenDark} />
          <Text style={s.secondaryChipText}>Trocar dia</Text>
        </Pressable>
      </View>

      {goalsError ? <Text style={s.error}>{goalsError}</Text> : null}
    </View>
  );
}

function MealMacroChip({
  label,
  value,
  unit,
  color,
  bg,
}: {
  label: string;
  value: number;
  unit: string;
  color: string;
  bg: string;
}) {
  return (
    <View style={[s.mealSummaryMacroChip, { backgroundColor: bg }]}>
      <Text style={[s.mealSummaryMacroLabel, { color }]}>{label}</Text>
      <Text style={[s.mealSummaryMacroValue, { color }]}>
        {value}
        {unit}
      </Text>
    </View>
  );
}
