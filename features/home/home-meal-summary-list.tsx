import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, Text, View } from 'react-native';

import { MealCard } from '@/components/meal-card';
import { Brand } from '@/constants/theme';
import { s } from '@/features/home/home-meal-summary-list.styles';
import { HOME_MACRO_TONES, type MealSummary } from '@/features/home/home-utils';
import type { Meal } from '@/types/nutrition';

type Props = {
  mealSummaries: MealSummary[];
  meals: Meal[];
  mealsCount: number;
  onEditMeal: (meal: Meal) => void;
  onDeleteMeal: (meal: Meal) => void;
};

export function HomeMealSummaryList({
  mealSummaries,
  meals,
  mealsCount,
  onEditMeal,
  onDeleteMeal,
}: Props) {
  const sortedMeals = [...meals].sort((a, b) => (b.time ?? '').localeCompare(a.time ?? ''));

  return (
    <View style={s.section}>
      <View style={s.sectionHead}>
        <View style={s.sectionTitleCol}>
          <Text style={s.sectionTitle}>Por refeição</Text>
          <Text style={s.sectionSubtitle}>
            {mealsCount === 0 ? 'Nenhum registro ainda' : `${mealsCount} ${mealsCount === 1 ? 'registro' : 'registros'} no dia`}
          </Text>
        </View>
        {mealsCount > 0 ? (
          <View style={s.counterBadge}>
            <Ionicons name="checkmark-circle" size={14} color={Brand.greenDeeper} />
            <Text style={s.counter}>Ativo</Text>
          </View>
        ) : null}
      </View>

      {mealSummaries.length > 0 ? (
        <View style={s.list}>
          {mealSummaries.map((item) => (
            <View key={item.type} style={s.card}>
              <View style={s.cardHeader}>
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={s.thumb} />
                ) : (
                  <View style={[s.iconWrap, { backgroundColor: item.bg }]}>
                    <Ionicons name={item.icon} size={20} color={item.color} />
                  </View>
                )}

                <View style={s.copy}>
                  <Text style={s.label}>{item.label}</Text>
                  <Text style={s.count}>
                    {item.count} {item.count === 1 ? 'registro' : 'registros'}
                  </Text>
                </View>

                <View style={s.caloriesBadge}>
                  <Ionicons name="flame" size={12} color={Brand.greenDeeper} />
                  <Text style={s.calories}>{Math.round(item.calories)}</Text>
                </View>
              </View>

              <View style={s.macros}>
                <MealMacroStat
                  label="P"
                  value={Math.round(item.protein)}
                  color={HOME_MACRO_TONES.protein.color}
                  bg={HOME_MACRO_TONES.protein.bg}
                />
                <MealMacroStat
                  label="C"
                  value={Math.round(item.carbs)}
                  color={HOME_MACRO_TONES.carbs.color}
                  bg={HOME_MACRO_TONES.carbs.bg}
                />
                <MealMacroStat
                  label="G"
                  value={Math.round(item.fat)}
                  color={HOME_MACRO_TONES.fat.color}
                  bg={HOME_MACRO_TONES.fat.bg}
                />
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={s.emptyCard}>
          <View style={s.emptyIconWrap}>
            <Ionicons name="leaf-outline" size={26} color={Brand.greenDeeper} />
          </View>
          <Text style={s.emptyTitle}>Nenhuma refeição ainda</Text>
          <Text style={s.emptyText}>
            Use o card acima para registrar sua primeira refeição e começar a acompanhar seu dia.
          </Text>
        </View>
      )}

      {sortedMeals.length > 0 ? (
        <View style={s.mealsSection}>
          <View style={s.mealsHeader}>
            <View style={s.mealsTitleIcon}>
              <Ionicons name="time-outline" size={14} color={Brand.greenDeeper} />
            </View>
            <Text style={s.mealsTitle}>Histórico do dia</Text>
          </View>
          <View style={s.mealsList}>
            {sortedMeals.map((meal) => (
              <MealCard
                key={meal.id}
                meal={meal}
                onEdit={onEditMeal}
                onDelete={async () => onDeleteMeal(meal)}
              />
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

function MealMacroStat({
  label,
  value,
  color,
  bg,
}: {
  label: string;
  value: number;
  color: string;
  bg: string;
}) {
  return (
    <View style={[s.macroStat, { backgroundColor: bg }]}>
      <View style={[s.macroDot, { backgroundColor: color }]} />
      <Text style={s.macroLabel}>{label}</Text>
      <Text style={[s.macroValue, { color }]}>{value}g</Text>
    </View>
  );
}
