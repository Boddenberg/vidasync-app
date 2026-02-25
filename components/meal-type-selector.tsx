/**
 * Seletor de tipo de refeição
 *
 * Chips minimalistas para o usuário escolher a refeição.
 */

import { Brand } from '@/constants/theme';
import type { MealType } from '@/types/nutrition';
import { MEAL_TYPE_LABELS } from '@/types/nutrition';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

const TYPES: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner'];

type Props = {
  selected: MealType | null;
  onSelect: (type: MealType) => void;
};

export function MealTypeSelector({ selected, onSelect }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={s.row}>
      {TYPES.map((type) => {
        const active = selected === type;
        return (
          <Pressable
            key={type}
            style={[s.chip, active && s.chipActive]}
            onPress={() => onSelect(type)}>
            <Text style={[s.chipText, active && s.chipTextActive]}>
              {MEAL_TYPE_LABELS[type]}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Brand.border,
  },
  chipActive: {
    backgroundColor: Brand.greenDark,
    borderColor: Brand.greenDark,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: Brand.textSecondary,
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
});
