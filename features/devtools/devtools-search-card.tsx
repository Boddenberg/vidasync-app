import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { AppInput } from '@/components/app-input';
import { NutritionErrorModal } from '@/components/nutrition-error-modal';
import { Brand, Radii, Shadows, Typography } from '@/constants/theme';
import { FOOD_CATEGORIES, type Unit } from '@/features/devtools/devtools-utils';
import type { NutritionData } from '@/types/nutrition';

type Props = {
  query: string;
  queryWeight: string;
  queryUnit: Unit;
  units: Unit[];
  loading: boolean;
  error: string | null;
  result: NutritionData | null;
  onChangeQuery: (value: string) => void;
  onChangeWeight: (value: string) => void;
  onChangeUnit: (unit: Unit) => void;
  onSubmit: () => void;
  onClear: () => void;
  onResetError: () => void;
};

export function DevtoolsSearchCard({
  query,
  queryWeight,
  queryUnit,
  units,
  loading,
  error,
  result,
  onChangeQuery,
  onChangeWeight,
  onChangeUnit,
  onSubmit,
  onClear,
  onResetError,
}: Props) {
  return (
    <View style={s.card}>
      <Text style={s.sectionTitle}>Consulta de alimentos</Text>
      <Text style={s.sectionSubtitle}>Busque rapidamente e consulte calorias e macros.</Text>

      <View style={s.searchInputWrap}>
        <Ionicons style={s.searchIcon} name="search-outline" size={18} color={Brand.textSecondary} />
        <AppInput
          placeholder="Buscar banana, arroz, frango..."
          value={query}
          onChangeText={onChangeQuery}
          maxLength={50}
          style={s.searchInput}
        />
      </View>

      <View style={s.categoryRow}>
        {FOOD_CATEGORIES.map((item) => (
          <Pressable
            key={item.id}
            style={({ pressed }) => [s.categoryChip, { backgroundColor: item.tint }, pressed && s.categoryChipPressed]}
            onPress={() => {
              onChangeQuery(item.query);
              onChangeWeight('');
              onChangeUnit('g');
              onClear();
            }}>
            <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={14} color={Brand.text} />
            <Text style={s.categoryChipLabel}>{item.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={s.queryWeightRow}>
        <View style={s.weightInputWrap}>
          <AppInput
            placeholder="Quantidade"
            value={queryWeight}
            onChangeText={onChangeWeight}
            keyboardType="numeric"
            maxLength={7}
          />
        </View>
        <View style={s.queryUnitRow}>
          {units.map((unit) => (
            <Pressable key={unit} style={[s.queryUnitBtn, queryUnit === unit && s.queryUnitBtnActive]} onPress={() => onChangeUnit(unit)}>
              <Text style={[s.queryUnitText, queryUnit === unit && s.queryUnitTextActive]}>{unit}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <AppButton title="Consultar calorias" onPress={onSubmit} loading={loading} disabled={!query.trim()} />

      {result ? (
        <View style={s.resultBox}>
          <Text style={s.resultCal}>{result.calories}</Text>
          <View style={s.resultMacros}>
            <MacroPill label="proteína" value={result.protein} color={Brand.macroProtein} bg={Brand.macroProteinBg} />
            <MacroPill label="carboidrato" value={result.carbs} color={Brand.macroCarb} bg={Brand.macroCarbBg} />
            <MacroPill label="gordura" value={result.fat} color={Brand.macroFat} bg={Brand.macroFatBg} />
          </View>
          <Pressable onPress={onClear}>
            <Text style={s.resultClear}>Limpar consulta</Text>
          </Pressable>
        </View>
      ) : null}

      {error ? (
        <NutritionErrorModal visible={!!error} message={error} onClose={onResetError} />
      ) : null}
    </View>
  );
}

function MacroPill({
  label,
  value,
  color,
  bg,
}: {
  label: string;
  value: string;
  color: string;
  bg: string;
}) {
  return (
    <View style={[s.macroPill, { backgroundColor: bg }]}>
      <Text style={[s.macroPillLabel, { color }]}>{label}</Text>
      <Text style={[s.macroPillValue, { color }]}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: Brand.card,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: 18,
    gap: 14,
    ...Shadows.card,
  },
  sectionTitle: {
    ...Typography.subtitle,
    color: Brand.text,
    fontWeight: '800',
  },
  sectionSubtitle: {
    ...Typography.body,
    color: Brand.textSecondary,
  },
  searchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radii.xl,
    backgroundColor: Brand.bg,
    borderWidth: 1,
    borderColor: Brand.border,
    paddingLeft: 14,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
  },
  categoryChipPressed: {
    opacity: 0.9,
  },
  categoryChipLabel: {
    ...Typography.caption,
    color: Brand.text,
    fontWeight: '700',
  },
  queryWeightRow: {
    flexDirection: 'row',
    gap: 10,
  },
  weightInputWrap: {
    flex: 1,
  },
  queryUnitRow: {
    flexDirection: 'row',
    gap: 8,
  },
  queryUnitBtn: {
    minWidth: 46,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: Brand.bg,
    borderWidth: 1,
    borderColor: Brand.border,
  },
  queryUnitBtnActive: {
    backgroundColor: '#E7F6EC',
    borderColor: '#B7DCC2',
  },
  queryUnitText: {
    ...Typography.body,
    color: Brand.textSecondary,
    fontWeight: '700',
  },
  queryUnitTextActive: {
    color: Brand.greenDark,
  },
  resultBox: {
    borderRadius: Radii.xl,
    backgroundColor: Brand.bg,
    padding: 16,
    gap: 12,
  },
  resultCal: {
    ...Typography.title,
    color: Brand.text,
    fontWeight: '800',
  },
  resultMacros: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  resultClear: {
    ...Typography.body,
    color: Brand.greenDark,
    fontWeight: '700',
  },
  macroPill: {
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 3,
  },
  macroPillLabel: {
    ...Typography.caption,
    fontWeight: '700',
  },
  macroPillValue: {
    ...Typography.caption,
    fontWeight: '800',
  },
});
