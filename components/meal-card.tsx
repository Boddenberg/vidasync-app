import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Brand, Radii, Shadows, Typography } from '@/constants/theme';
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
            <View style={s.calBadge}>
              <Text style={s.cal}>{meal.nutrition.calories} kcal</Text>
            </View>
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
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Brand.border,
    overflow: 'hidden',
    ...Shadows.card,
  },
  rowPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.995 }],
  },
  accent: {
    width: 6,
    backgroundColor: Brand.greenDark,
  },
  thumb: {
    width: 68,
    height: 68,
    borderRadius: 22,
    marginLeft: 14,
    alignSelf: 'center',
  },
  thumbPlaceholder: {
    width: 68,
    height: 68,
    borderRadius: 22,
    marginLeft: 14,
    alignSelf: 'center',
    backgroundColor: Brand.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 8,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  type: {
    ...Typography.caption,
    color: Brand.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    flex: 1,
  },
  calBadge: {
    borderRadius: Radii.pill,
    backgroundColor: Brand.surfaceSoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  cal: {
    ...Typography.caption,
    color: Brand.greenDark,
    fontWeight: '800',
  },
  foods: {
    ...Typography.body,
    color: Brand.text,
    fontWeight: '700',
    lineHeight: 22,
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
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  macroPillLabel: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  macroPillValue: {
    fontSize: 12,
    fontWeight: '800',
  },
});
