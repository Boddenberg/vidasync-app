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

type MacroCard = {
  key: MacroKey;
  letter: string;
  label: string;
  consumed: number;
  tone: (typeof HOME_MACRO_TONES)[MacroKey];
};

export function HomeMacroSection({ protein, carbs, fat, macroGoalItems }: Props) {
  const goals = new Map<MacroKey, GoalProgress>();

  macroGoalItems.forEach((item) => {
    if (item.key !== 'calories') {
      goals.set(item.key, item);
    }
  });

  const cards: MacroCard[] = [
    {
      key: 'protein',
      letter: 'P',
      label: 'Proteína',
      consumed: protein,
      tone: HOME_MACRO_TONES.protein,
    },
    {
      key: 'carbs',
      letter: 'C',
      label: 'Carbo',
      consumed: carbs,
      tone: HOME_MACRO_TONES.carbs,
    },
    {
      key: 'fat',
      letter: 'G',
      label: 'Gord.',
      consumed: fat,
      tone: HOME_MACRO_TONES.fat,
    },
  ];

  return (
    <View style={s.section}>
      <View style={s.grid}>
        {cards.map((card) => {
          const goal = goals.get(card.key);
          const progressPct = goal ? Math.round(goal.progress * 100) : 0;
          const progressWidth = (`${Math.min(100, progressPct)}%` as const);
          const goalValue = goal ? formatMetricValue(Math.round(goal.goal), 'g') : null;

          return (
            <View key={card.key} style={s.card}>
              <View style={s.topRow}>
                <View style={[s.badge, { backgroundColor: card.tone.bg }]}>
                  <Text style={[s.badgeLetter, { color: card.tone.color }]}>{card.letter}</Text>
                </View>
                <Text style={s.label} numberOfLines={1}>
                  {card.label}
                </Text>
              </View>

              <Text style={s.value} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
                {formatMetricValue(card.consumed, 'g')}
              </Text>

              <View style={s.track}>
                <View style={[s.trackBase, { backgroundColor: card.tone.bg }]} />
                <View style={[s.fill, { width: progressWidth, backgroundColor: card.tone.color }]} />
              </View>

              <Text style={s.goalRow} numberOfLines={1}>
                <Text style={s.goalValue}>{goalValue ?? '—'}</Text>
                {goal ? <Text style={s.goalPct}>  ·  {progressPct}%</Text> : null}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
