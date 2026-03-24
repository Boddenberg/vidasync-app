import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { MealCard } from '@/components/meal-card';
import { Brand, Radii, Shadows, Typography } from '@/constants/theme';
import { formatWaterEventTime } from '@/features/history/history-utils';
import type { WaterEvent } from '@/services/water';
import type { Meal } from '@/types/nutrition';

type MealsSectionProps = {
  meals: Meal[];
  selectedDate: string;
  onEdit: (meal: Meal) => void;
  onDelete: (meal: Meal) => void;
  onMoveDate: (meal: Meal) => void;
};

type WaterSectionProps = {
  waterEvents: WaterEvent[];
};

export function HistoryMealsSection({
  meals,
  selectedDate: _selectedDate,
  onEdit,
  onDelete,
  onMoveDate,
}: MealsSectionProps) {
  return (
    <View style={s.sectionCard}>
      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>Pratos do dia</Text>
        <Text style={s.sectionCount}>
          {meals.length} {meals.length === 1 ? 'item' : 'itens'}
        </Text>
      </View>

      {meals.length > 0 ? (
        <View style={s.mealsList}>
          {meals.map((meal) => (
            <MealCard
              key={meal.id}
              meal={meal}
              onEdit={onEdit}
              onDelete={async () => onDelete(meal)}
              onMoveDate={() => onMoveDate(meal)}
            />
          ))}
        </View>
      ) : (
        <View style={s.emptyState}>
          <Text style={s.emptyTitle}>{'Nenhum prato registrado neste dia'}</Text>
          <Text style={s.emptyHint}>{'Escolha outra data no calend\u00E1rio ou registre uma refei\u00E7\u00E3o na tela In\u00EDcio.'}</Text>
        </View>
      )}
    </View>
  );
}

export function HistoryWaterSection({ waterEvents }: WaterSectionProps) {
  return (
    <View style={s.sectionCard}>
      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>{'\u00C1gua do dia'}</Text>
        <Text style={s.sectionCount}>
          {waterEvents.length} {waterEvents.length === 1 ? 'ajuste' : 'ajustes'}
        </Text>
      </View>

      {waterEvents.length > 0 ? (
        <View style={s.waterList}>
          {waterEvents.map((event, index) => {
            const positive = event.deltaMl >= 0;
            const deltaLabel = `${positive ? '+' : ''}${Math.round(event.deltaMl)} ml`;

            return (
              <View key={`${event.id ?? 'water'}-${event.createdAt ?? index}-${index}`} style={s.waterItem}>
                <View style={[s.waterItemIcon, positive ? s.waterItemIconPositive : s.waterItemIconNegative]}>
                  <Ionicons
                    name={positive ? 'water-outline' : 'remove-outline'}
                    size={18}
                    color={positive ? Brand.hydration : Brand.danger}
                  />
                </View>

                <View style={s.waterItemCopy}>
                  <Text style={s.waterItemValue}>{deltaLabel}</Text>
                  <Text style={s.waterItemHint}>{formatWaterEventTime(event)}</Text>
                </View>

                <View style={[s.waterTag, positive ? s.waterTagPositive : s.waterTagNegative]}>
                  <Text style={[s.waterTagText, positive ? s.waterTagTextPositive : s.waterTagTextNegative]}>
                    {positive ? 'Entrada' : 'Corre\u00E7\u00E3o'}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={s.emptyState}>
          <Text style={s.emptyTitle}>{'Nenhum consumo de \u00E1gua neste dia'}</Text>
          <Text style={s.emptyHint}>{'Quando voc\u00EA registrar a hidrata\u00E7\u00E3o, os movimentos aparecem aqui em ordem.'}</Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  sectionCard: {
    backgroundColor: Brand.card,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: 20,
    gap: 14,
    ...Shadows.card,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  sectionTitle: {
    ...Typography.subtitle,
    color: Brand.text,
    fontWeight: '800',
  },
  sectionCount: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '700',
  },
  mealsList: {
    gap: 12,
  },
  waterList: {
    gap: 12,
  },
  emptyState: {
    borderRadius: 22,
    backgroundColor: Brand.surfaceAlt,
    padding: 18,
    gap: 6,
  },
  emptyTitle: {
    ...Typography.subtitle,
    color: Brand.text,
    fontWeight: '700',
  },
  emptyHint: {
    ...Typography.body,
    color: Brand.textSecondary,
  },
  waterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  waterItemIcon: {
    width: 44,
    height: 44,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waterItemIconPositive: {
    backgroundColor: Brand.hydrationBg,
  },
  waterItemIconNegative: {
    backgroundColor: Brand.fatBg,
  },
  waterItemCopy: {
    flex: 1,
    gap: 2,
  },
  waterItemValue: {
    ...Typography.subtitle,
    color: Brand.text,
    fontWeight: '700',
  },
  waterItemHint: {
    ...Typography.caption,
    color: Brand.textSecondary,
  },
  waterTag: {
    borderRadius: Radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  waterTagPositive: {
    backgroundColor: Brand.hydrationBg,
  },
  waterTagNegative: {
    backgroundColor: Brand.fatBg,
  },
  waterTagText: {
    ...Typography.caption,
    fontWeight: '700',
  },
  waterTagTextPositive: {
    color: Brand.hydration,
  },
  waterTagTextNegative: {
    color: Brand.danger,
  },
});
