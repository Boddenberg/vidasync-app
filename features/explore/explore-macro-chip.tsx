import { StyleSheet, Text, View } from 'react-native';

import { Typography } from '@/constants/theme';

type Props = {
  label: string;
  value: string;
  color: string;
  bg: string;
  compact?: boolean;
};

const LETTER_BY_LABEL: Record<string, string> = {
  prot: 'P',
  carb: 'C',
  gord: 'G',
};

export function ExploreMacroChip({ label, value, color, bg, compact = false }: Props) {
  const letter = LETTER_BY_LABEL[label.toLowerCase()] ?? label.charAt(0).toUpperCase();

  if (compact) {
    return (
      <View style={[s.compact, { backgroundColor: bg }]}>
        <View style={[s.compactLetterWrap, { backgroundColor: color }]}>
          <Text style={s.compactLetterText}>{letter}</Text>
        </View>
        <Text style={[s.compactValue, { color }]} numberOfLines={1}>
          {value}
        </Text>
      </View>
    );
  }

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
  compact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 3,
    paddingRight: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  compactLetterWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactLetterText: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  compactValue: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '800',
  },
});
