import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text } from 'react-native';

import { Brand, Radii, Shadows, Typography } from '@/constants/theme';

type Props = {
  onPress: () => void;
};

export function ReturnHomeButton({ onPress }: Props) {
  return (
    <Pressable style={({ pressed }) => [s.button, pressed && s.pressed]} onPress={onPress}>
      <Ionicons name="arrow-back" size={16} color={Brand.greenDark} />
      <Text style={s.label}>Voltar para o início</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  button: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: Radii.pill,
    backgroundColor: Brand.surfaceSoft,
    paddingHorizontal: 14,
    paddingVertical: 10,
    ...Shadows.card,
  },
  label: {
    ...Typography.body,
    color: Brand.greenDark,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
});
