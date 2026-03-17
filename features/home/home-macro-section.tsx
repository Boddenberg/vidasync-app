import { Text, View } from 'react-native';

import { s } from '@/features/home/home-macro-section.styles';
import { HOME_MACRO_TONES, formatMetricValue, type GoalProgress } from '@/features/home/home-utils';

type Props = {
  protein: number;
  carbs: number;
  fat: number;
  macroGoalItems: GoalProgress[];
};

type MacroKey = 'protein' | 'carbs' | 'fat';

export function HomeMacroSection({ protein, carbs, fat, macroGoalItems }: Props) {
  const goals = new Map<MacroKey, GoalProgress>();

  macroGoalItems.forEach((item) => {
    if (item.key !== 'calories') {
      goals.set(item.key, item);
    }
  });

  const cards = [
    {
      key: 'protein' as const,
      label: 'Proteina',
      consumed: protein,
      tone: HOME_MACRO_TONES.protein,
    },
    {
      key: 'carbs' as const,
      label: 'Carboidrato',
      consumed: carbs,
      tone: HOME_MACRO_TONES.carbs,
    },
    {
      key: 'fat' as const,
      label: 'Gordura',
      consumed: fat,
      tone: HOME_MACRO_TONES.fat,
    },
  ];

  return (
    <View style={s.section}>
      <Text style={s.title}>Macros</Text>

      <View style={s.grid}>
        {cards.map((card) => {
          const goal = goals.get(card.key);
          const progress = goal ? (`${Math.round(goal.progress * 100)}%` as const) : ('0%' as const);
          const goalValue = goal ? formatMetricValue(Math.round(goal.goal), 'g') : '--';

          return (
            <View key={card.key} style={s.card}>
              <View style={s.labelRow}>
                <View style={[s.dot, { backgroundColor: card.tone.color }]} />
                <Text style={s.label}>{card.label}</Text>
              </View>

              <Text style={s.value}>
                <Text style={s.valuePrimary}>{formatMetricValue(card.consumed, 'g')}</Text>
                <Text style={s.valueDivider}> / </Text>
                <Text style={s.valueGoal}>{goalValue}</Text>
              </Text>

              <View style={s.track}>
                <View style={[s.trackBase, { backgroundColor: card.tone.bg }]} />
                <View style={[s.fill, { width: progress, backgroundColor: card.tone.color }]} />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
