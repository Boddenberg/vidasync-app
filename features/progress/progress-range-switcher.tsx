import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Brand, Radii, Shadows, Typography } from '@/constants/theme';
import type { ProgressRange } from '@/features/progress/use-progress-dashboard';

type Props = {
  value: ProgressRange;
  onChange: (range: ProgressRange) => void;
};

const OPTIONS: { value: ProgressRange; label: string; sub: string }[] = [
  { value: 7, label: '7d', sub: 'Semana' },
  { value: 30, label: '30d', sub: 'Mês' },
  { value: 90, label: '90d', sub: 'Trimestre' },
];

export function ProgressRangeSwitcher({ value, onChange }: Props) {
  return (
    <View style={s.shell}>
      {OPTIONS.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[s.option, active && s.optionActive]}>
            <Text style={[s.label, active && s.labelActive]}>{option.label}</Text>
            <Text style={[s.sub, active && s.subActive]}>{option.sub}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  shell: {
    flexDirection: 'row',
    padding: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(20,108,56,0.08)',
    gap: 4,
    ...Shadows.soft,
  },
  option: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: Radii.pill,
  },
  optionActive: {
    backgroundColor: Brand.greenDeeper,
  },
  label: {
    ...Typography.body,
    fontSize: 14,
    fontWeight: '800',
    color: Brand.text,
    letterSpacing: -0.2,
  },
  labelActive: {
    color: '#FFFFFF',
  },
  sub: {
    ...Typography.caption,
    fontSize: 9,
    fontWeight: '700',
    color: Brand.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 1,
  },
  subActive: {
    color: 'rgba(255,255,255,0.85)',
  },
});
