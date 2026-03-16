import { Text, View } from 'react-native';

import { formatMetricValue } from '@/features/home/home-utils';
import { s } from '@/features/home/home-hero-card.styles';

type Props = {
  label: string;
  consumed: number;
  goal: number;
  color: string;
  bg: string;
  unit: string;
  remaining: number;
};

export function HomeMacroBar({ label, consumed, goal, color, bg, unit, remaining }: Props) {
  const progress = goal > 0 ? Math.min(consumed / goal, 1) : 0;

  return (
    <View style={s.macroCard}>
      <View style={s.rowBetween}>
        <View style={s.macroLabelWrap}>
          <View style={[s.macroDot, { backgroundColor: color }]} />
          <Text style={s.macroLabel}>{label}</Text>
        </View>
        <Text style={s.macroTarget}>
          {formatMetricValue(consumed, unit)} / {formatMetricValue(goal, unit)}
        </Text>
      </View>
      <View style={[s.trackShell, { backgroundColor: bg }]}>
        <View style={[s.trackFill, { width: `${Math.round(progress * 100)}%`, backgroundColor: color }]} />
      </View>
      <Text style={s.macroRemaining}>
        {remaining > 0 ? `${formatMetricValue(remaining, unit)} restantes` : 'Meta concluida'}
      </Text>
    </View>
  );
}
