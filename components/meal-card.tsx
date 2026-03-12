import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Brand, Radii, Typography } from '@/constants/theme';
import type { Meal } from '@/types/nutrition';
import { MEAL_TYPE_LABELS } from '@/types/nutrition';

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
    const actions: MealAction[] = [{ label: 'Editar', icon: 'create-outline', onPress: () => onEdit(meal) }];

    if (onDuplicate) {
      actions.push({ label: 'Duplicar', icon: 'copy-outline', onPress: () => onDuplicate(meal.id) });
    }
    if (onMoveDate) {
      actions.push({ label: 'Mover de dia', icon: 'calendar-outline', onPress: () => onMoveDate(meal) });
    }

    actions.push({
      label: 'Apagar',
      icon: 'trash-outline',
      destructive: true,
      onPress: () => onDelete(meal.id),
    });
    return actions;
  }

  return (
    <>
      <Pressable
        style={({ pressed }) => [s.row, pressed && s.rowPressed]}
        onLongPress={() => setSheetVisible(true)}
        onPress={() => setSheetVisible(true)}>
        <View style={s.accent} />

        {meal.imageUrl ? (
          <Image source={{ uri: meal.imageUrl }} style={s.thumb} />
        ) : (
          <View style={s.thumbPlaceholder}>
            <Ionicons name="restaurant-outline" size={20} color={Brand.textSecondary} />
          </View>
        )}

        <View style={s.content}>
          <View style={s.topRow}>
            <Text style={s.type}>
              {MEAL_TYPE_LABELS[meal.mealType]}
              {meal.time ? ` • ${meal.time}` : ''}
            </Text>
            <Text style={s.cal}>{meal.nutrition.calories}</Text>
          </View>

          <Text style={s.foods} numberOfLines={2}>
            {meal.foods}
          </Text>

          <View style={s.macroRow}>
            <MacroChip label="prot" value={meal.nutrition.protein} textColor={Brand.macroProtein} bg={Brand.macroProteinBg} />
            <MacroChip label="carb" value={meal.nutrition.carbs} textColor={Brand.macroCarb} bg={Brand.macroCarbBg} />
            <MacroChip label="gord" value={meal.nutrition.fat} textColor={Brand.macroFat} bg={Brand.macroFatBg} />
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

function MacroChip({
  label,
  value,
  textColor,
  bg,
}: {
  label: string;
  value: string;
  textColor: string;
  bg: string;
}) {
  return (
    <View style={[s.macroPill, { backgroundColor: bg }]}>
      <Text style={[s.macroPillLabel, { color: textColor }]}>{label}</Text>
      <Text style={[s.macroPillValue, { color: textColor }]}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: Brand.card,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Brand.border,
    overflow: 'hidden',
  },
  rowPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.995 }],
  },
  accent: {
    width: 4,
    backgroundColor: Brand.green,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 14,
    marginLeft: 12,
    alignSelf: 'center',
  },
  thumbPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 14,
    marginLeft: 12,
    alignSelf: 'center',
    backgroundColor: Brand.surfaceAlt,
    borderWidth: 1,
    borderColor: Brand.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 5,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  type: {
    ...Typography.caption,
    color: Brand.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  cal: {
    ...Typography.caption,
    color: Brand.greenDark,
    fontWeight: '800',
  },
  foods: {
    ...Typography.body,
    color: Brand.text,
    fontWeight: '600',
    lineHeight: 20,
  },
  macroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: 2,
  },
  macroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.pill,
  },
  macroPillLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  macroPillValue: {
    fontSize: 11,
    fontWeight: '700',
  },
});
