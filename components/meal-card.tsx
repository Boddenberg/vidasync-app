/**
 * Card de refeição — minimalista
 *
 * Uma linha elegante por refeição: tipo, alimento, calorias.
 * Long-press ou tap abre um bottom sheet estilizado com as ações disponíveis.
 */

import { Brand } from '@/constants/theme';
import type { Meal } from '@/types/nutrition';
import { MEAL_TYPE_LABELS } from '@/types/nutrition';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { MealActionSheet, type MealAction } from './meal-action-sheet';

type Props = {
  meal: Meal;
  onEdit: (meal: Meal) => void;
  onDuplicate?: (id: string) => void;
  onDelete: (id: string) => void;
  onMoveDate?: (meal: Meal) => void;
};

export function MealCard({ meal, onEdit, onDuplicate, onDelete, onMoveDate }: Props) {
  const [sheetVisible, setSheetVisible] = useState(false);

  function buildActions(): MealAction[] {
    const actions: MealAction[] = [
      { label: 'Editar', icon: 'E', onPress: () => onEdit(meal) },
    ];
    if (onDuplicate) {
      actions.push({ label: 'Duplicar', icon: 'D', onPress: () => onDuplicate(meal.id) });
    }
    if (onMoveDate) {
      actions.push({ label: 'Mover de dia', icon: 'M', onPress: () => onMoveDate(meal) });
    }
    actions.push({
      label: 'Apagar',
      icon: 'X',
      destructive: true,
      onPress: () => onDelete(meal.id),
    });
    return actions;
  }

  return (
    <>
      <Pressable style={s.row} onLongPress={() => setSheetVisible(true)} onPress={() => setSheetVisible(true)}>
        {/* Accent bar */}
        <View style={s.accent} />

        {/* Photo thumbnail */}
        {meal.imageUrl ? (
          <Image source={{ uri: meal.imageUrl }} style={s.thumb} />
        ) : (
          <View style={s.thumbPlaceholder}>
            <Text style={s.thumbIcon}>🍽️</Text>
          </View>
        )}

        {/* Content */}
        <View style={s.content}>
          <View style={s.topRow}>
            <Text style={s.type}>
              {MEAL_TYPE_LABELS[meal.mealType]}
              {meal.time ? ` · ${meal.time}` : ''}
            </Text>
            <Text style={s.cal}>{meal.nutrition.calories}</Text>
          </View>
          <Text style={s.foods} numberOfLines={1}>{meal.foods}</Text>
          <View style={s.macroRow}>
            <View style={[s.macroPill, { backgroundColor: '#EBF5FB' }]}>
              <Text style={[s.macroPillLabel, { color: '#5DADE2' }]}>prot</Text>
              <Text style={[s.macroPillValue, { color: '#5DADE2' }]}>{meal.nutrition.protein}</Text>
            </View>
            <View style={[s.macroPill, { backgroundColor: '#FEF5E7' }]}>
              <Text style={[s.macroPillLabel, { color: Brand.orange }]}>carb</Text>
              <Text style={[s.macroPillValue, { color: Brand.orange }]}>{meal.nutrition.carbs}</Text>
            </View>
            <View style={[s.macroPill, { backgroundColor: '#FDEDEC' }]}>
              <Text style={[s.macroPillLabel, { color: '#E74C3C' }]}>gord</Text>
              <Text style={[s.macroPillValue, { color: '#E74C3C' }]}>{meal.nutrition.fat}</Text>
            </View>
          </View>
        </View>
      </Pressable>

      <MealActionSheet
        visible={sheetVisible}
        meal={meal}
        actions={buildActions()}
        onClose={() => setSheetVisible(false)}
      />
    </>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: Brand.card,
    borderRadius: 14,
    overflow: 'hidden',
  },
  accent: {
    width: 3,
    backgroundColor: Brand.green,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
    marginLeft: 12,
    alignSelf: 'center',
  },
  thumbPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 10,
    marginLeft: 12,
    alignSelf: 'center',
    backgroundColor: Brand.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbIcon: {
    fontSize: 22,
  },
  content: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  type: {
    fontSize: 10,
    fontWeight: '700',
    color: Brand.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  cal: {
    fontSize: 13,
    fontWeight: '700',
    color: Brand.greenDark,
  },
  foods: {
    fontSize: 15,
    fontWeight: '500',
    color: Brand.text,
    lineHeight: 20,
  },
  macroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  macroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  macroPillLabel: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  macroPillValue: {
    fontSize: 11,
    fontWeight: '600',
  },
});
