import Ionicons from '@expo/vector-icons/Ionicons';
import { Animated, Pressable, Text, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { HomeMacroBar } from '@/features/home/home-macro-bar';
import { s } from '@/features/home/home-hero-card.styles';
import type { GoalProgress, MealSummary } from '@/features/home/home-utils';
import { Brand } from '@/constants/theme';

type Props = {
  mealsCount: number;
  heroTitle: string;
  goalsLoading: boolean;
  hasAnyGoals: boolean;
  calories: number;
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
  const heroBadgeLabel = mealsCount === 1 ? 'refeicao' : 'refeicoes';

  return (
    <View style={s.hero}>
      <View pointerEvents="none" style={s.heroGlowTop} />
      <View pointerEvents="none" style={s.heroGlowBottom} />

      <View style={s.heroTop}>
        <View style={s.heroCopy}>
          <Text style={s.heroLabel}>Nutricao</Text>
          <Text style={s.heroTitle}>{heroTitle}</Text>
          <Text style={s.heroSubtitle}>
            {mealsCount > 0
              ? 'Calorias e macros organizados para leitura mais rapida.'
              : 'Quando voce registrar as refeicoes, o resumo vai ficar bem mais claro aqui.'}
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
              <Text style={s.calorieSpotlightLabel}>Calorias</Text>
              <View style={s.calorieSpotlightRow}>
                <Text style={s.calorieSpotlightValue}>{calories}</Text>
                <Text style={s.calorieSpotlightUnit}>kcal</Text>
              </View>
            </View>

            <View style={s.calorieBadge}>
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
              <Text style={s.sectionMiniTitle}>Macros</Text>
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
                Cadastre proteina, carboidrato e gordura para acompanhar os macros com mais clareza.
              </Text>
            )}
          </View>
        </>
      ) : (
        <View style={s.emptyGoalState}>
          <Text style={s.emptyGoalTitle}>Nenhuma meta cadastrada para este dia</Text>
          <Text style={s.emptyGoalText}>
            Cadastre calorias e macros por data para acompanhar a evolucao com a meta correta.
          </Text>
          <AppButton title="Configurar metas do dia" onPress={onOpenGoals} />
        </View>
      )}

      <View style={s.mealSummarySection}>
        <View style={s.rowBetween}>
          <Text style={s.sectionMiniTitle}>Periodos registrados</Text>
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
                <Text style={s.mealSummaryMacros}>
                  P {Math.round(item.protein)}g - C {Math.round(item.carbs)}g - G {Math.round(item.fat)}g
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={s.sectionSub}>Os periodos so aparecem aqui quando houver pratos registrados no dia.</Text>
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
