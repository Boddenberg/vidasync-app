import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { Brand, Radii, Shadows } from '@/constants/theme';

type Props = PropsWithChildren<{
  style?: ViewStyle;
}>;

export function AppCard({ children, style }: Props) {
  return <View style={[s.card, style]}>{children}</View>;
}

const s = StyleSheet.create({
  card: {
    backgroundColor: Brand.card,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: 18,
    ...Shadows.card,
  },
});
