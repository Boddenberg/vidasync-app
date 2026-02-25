/**
 * Resumo de macros do dia — minimalista
 *
 * Uma linha com totais vindos do endpoint /meals/summary.
 */

import { Brand } from '@/constants/theme';
import type { NutritionData } from '@/types/nutrition';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  totals: NutritionData | null;
};

function extractNumber(str: string): number {
  const match = str.match(/[\d.,]+/);
  if (!match) return 0;
  return parseFloat(match[0].replace(',', '.')) || 0;
}

export function DaySummary({ totals }: Props) {
  if (!totals) return null;

  const cal = extractNumber(totals.calories);
  const prot = extractNumber(totals.protein);
  const carb = extractNumber(totals.carbs);
  const fat = extractNumber(totals.fat);

  if (cal === 0 && prot === 0 && carb === 0 && fat === 0) return null;

  return (
    <View style={s.row}>
      <Item value={`${Math.round(cal)}`} unit="kcal" color={Brand.greenDark} />
      <Dot />
      <Item value={`${Math.round(prot)}g`} unit="prot" color="#5DADE2" />
      <Dot />
      <Item value={`${Math.round(carb)}g`} unit="carb" color={Brand.orange} />
      <Dot />
      <Item value={`${Math.round(fat)}g`} unit="gord" color="#E74C3C" />
    </View>
  );
}

function Item({ value, unit, color }: { value: string; unit: string; color: string }) {
  return (
    <View style={s.item}>
      <Text style={[s.value, { color }]}>{value}</Text>
      <Text style={s.unit}>{unit}</Text>
    </View>
  );
}

function Dot() {
  return <Text style={s.dot}>·</Text>;
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  value: {
    fontSize: 18,
    fontWeight: '700',
  },
  unit: {
    fontSize: 10,
    fontWeight: '600',
    color: Brand.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  dot: {
    fontSize: 18,
    color: Brand.border,
    fontWeight: '300',
  },
});
