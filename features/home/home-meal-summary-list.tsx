import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, Text, View } from 'react-native';

import { s } from '@/features/home/home-meal-summary-list.styles';
import { HOME_MACRO_TONES, type MealSummary } from '@/features/home/home-utils';

type Props = {
  mealSummaries: MealSummary[];
  mealsCount: number;
};

export function HomeMealSummaryList({ mealSummaries, mealsCount }: Props) {
  const counterLabel = mealsCount > 0 ? `${mealsCount} no dia` : 'Sem registros';

  return (
    <View style={s.section}>
      <View style={s.header}>
        <Text style={s.title}>Refeições</Text>
        <View style={s.counterBadge}>
          <Text style={s.counter}>{counterLabel}</Text>
        </View>
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
                    <Ionicons name={item.icon} size={15} color={item.color} />
                  </View>
                )}

                <View style={s.copy}>
                  <Text style={s.label}>{item.label}</Text>
                  <Text style={s.count}>
                    {item.count} {item.count === 1 ? 'registro' : 'registros'}
                  </Text>
                </View>

                <View style={s.caloriesBadge}>
                  <Text style={s.calories}>{Math.round(item.calories)} kcal</Text>
                </View>
              </View>

              <View style={s.macros}>
                <MealMacroStat
                  label="P"
                  value={Math.round(item.protein)}
                  unit="g"
                  color={HOME_MACRO_TONES.protein.color}
                />
                <MealMacroStat
                  label="C"
                  value={Math.round(item.carbs)}
                  unit="g"
                  color={HOME_MACRO_TONES.carbs.color}
                />
                <MealMacroStat
                  label="G"
                  value={Math.round(item.fat)}
                  unit="g"
                  color={HOME_MACRO_TONES.fat.color}
                />
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={s.emptyCard}>
          <Text style={s.emptyTitle}>Nenhuma refeição registrada</Text>
          <Text style={s.emptyText}>Use o card acima para adicionar a primeira refeição.</Text>
        </View>
      )}
    </View>
  );
}

function MealMacroStat({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: number;
  unit: string;
  color: string;
}) {
  return (
    <View style={s.macroStat}>
      <View style={[s.macroDot, { backgroundColor: color }]} />
      <Text style={s.macroLabel}>{label}</Text>
      <Text style={[s.macroValue, { color }]}>
        {value}
        {unit}
      </Text>
    </View>
  );
}
