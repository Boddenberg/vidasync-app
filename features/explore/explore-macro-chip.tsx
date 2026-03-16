import { StyleSheet, Text, View } from 'react-native';

import { Typography } from '@/constants/theme';

type Props = {
  label: string;
  value: string;
  color: string;
  bg: string;
};

export function ExploreMacroChip({ label, value, color, bg }: Props) {
  return (
    <View style={[s.pill, { backgroundColor: bg }]}>
      <Text style={[s.pillLabel, { color }]}>{label}</Text>
      <Text style={[s.pillValue, { color }]}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  pill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 2,
  },
  pillLabel: {
    ...Typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  pillValue: {
    ...Typography.caption,
    fontWeight: '800',
  },
});
