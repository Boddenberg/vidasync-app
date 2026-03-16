import type { Dispatch, RefObject, SetStateAction } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { MealAttachmentField } from '@/components/attachments/domain-attachment-fields';
import { AppInput } from '@/components/app-input';
import { NutritionErrorModal } from '@/components/nutrition-error-modal';
import { Brand, Radii, Shadows, Typography } from '@/constants/theme';
import { ExploreMacroChip } from '@/features/explore/explore-macro-chip';
import type { AttachmentItem } from '@/types/attachments';
import type { NutritionData } from '@/types/nutrition';
import type { Ingredient, WeightUnit } from '@/utils/helpers';
import { formatIngredient } from '@/utils/helpers';

type Props = {
  ingredients: Ingredient[];
  ingName: string;
  ingWeight: string;
  ingUnit: WeightUnit;
  units: WeightUnit[];
  foodHint: string;
  dishName: string;
  attachments: AttachmentItem[];
  nutritionData: NutritionData | null;
  nutritionLoading: boolean;
  nutritionError: string | null;
  editing: boolean;
  hasIngredients: boolean;
  calculated: boolean;
  canAddIngredient: boolean;
  canSaveDish: boolean;
  canIncrementallyCalculate: boolean;
  pendingIngredientCount: number;
  ingNameRef: RefObject<TextInput | null>;
  onChangeIngredientName: (value: string) => void;
  onChangeIngredientWeight: (value: string) => void;
  onChangeIngredientUnit: (unit: WeightUnit) => void;
  onAddIngredient: () => void;
  onRemoveIngredient: (index: number) => void;
  onCalculate: () => void;
  onCloseNutritionError: () => void;
  onChangeAttachments: Dispatch<SetStateAction<AttachmentItem[]>>;
  onChangeDishName: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
};

export function ExploreDishFormCard({
  ingredients,
  ingName,
  ingWeight,
  ingUnit,
  units,
  foodHint,
  dishName,
  attachments,
  nutritionData,
  nutritionLoading,
  nutritionError,
  editing,
  hasIngredients,
  calculated,
  canAddIngredient,
  canSaveDish,
  canIncrementallyCalculate,
  pendingIngredientCount,
  ingNameRef,
  onChangeIngredientName,
  onChangeIngredientWeight,
  onChangeIngredientUnit,
  onAddIngredient,
  onRemoveIngredient,
  onCalculate,
  onCloseNutritionError,
  onChangeAttachments,
  onChangeDishName,
  onSave,
  onCancel,
}: Props) {
  return (
    <View style={s.formSection}>
      <Text style={s.stepLabel}>1. Ingredientes</Text>

      {ingredients.length > 0 ? (
        <View style={s.chipList}>
          {ingredients.map((ingredient, index) => (
            <View key={`${ingredient.name}-${index}`} style={s.chip}>
              <Text style={s.chipText}>{formatIngredient(ingredient)}</Text>
              <Pressable onPress={() => onRemoveIngredient(index)} hitSlop={8}>
                <Text style={s.chipRemove}>x</Text>
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      <AppInput
        ref={ingNameRef}
        placeholder={ingredients.length === 0 ? foodHint : 'Adicionar ingrediente'}
        value={ingName}
        onChangeText={onChangeIngredientName}
        maxLength={50}
      />

      <View style={s.weightRow}>
        <View style={s.weightInputWrap}>
          <AppInput
            placeholder="Quantidade"
            value={ingWeight}
            onChangeText={onChangeIngredientWeight}
            keyboardType="numeric"
            maxLength={7}
          />
        </View>
        <View style={s.unitRow}>
          {units.map((unit) => (
            <Pressable key={unit} style={[s.unitBtn, ingUnit === unit && s.unitBtnActive]} onPress={() => onChangeIngredientUnit(unit)}>
              <Text style={[s.unitText, ingUnit === unit && s.unitTextActive]}>{unit}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable style={[s.addIngBtn, !canAddIngredient && s.addIngBtnDisabled]} onPress={onAddIngredient} disabled={!canAddIngredient}>
          <Text style={s.addIngBtnText}>+</Text>
        </Pressable>
      </View>

      {hasIngredients ? (
        <AppButton
          title={
            canIncrementallyCalculate
              ? `Calcular novos itens (${pendingIngredientCount} ${pendingIngredientCount === 1 ? 'item' : 'itens'})`
              : calculated
                ? `Recalcular macros (${ingredients.length} ${ingredients.length === 1 ? 'item' : 'itens'})`
                : `Calcular macros (${ingredients.length} ${ingredients.length === 1 ? 'item' : 'itens'})`
          }
          onPress={onCalculate}
          loading={nutritionLoading}
        />
      ) : null}

      {canIncrementallyCalculate ? (
        <Text style={s.pendingHint}>
          {pendingIngredientCount} {pendingIngredientCount === 1 ? 'ingrediente novo ainda não entrou' : 'ingredientes novos ainda não entraram'} no total. Calcule antes de salvar.
        </Text>
      ) : null}

      {nutritionError ? (
        <NutritionErrorModal visible={!!nutritionError} message={nutritionError} onClose={onCloseNutritionError} />
      ) : null}

      {calculated && nutritionData ? (
        <>
          <View style={s.stepDivider} />
          <Text style={s.stepLabel}>2. Resultado</Text>
          <View style={s.previewCard}>
            <Text style={s.previewCal}>{nutritionData.calories}</Text>
            <View style={s.previewMacros}>
              <ExploreMacroChip label="prot" value={nutritionData.protein} color={Brand.macroProtein} bg={Brand.macroProteinBg} />
              <ExploreMacroChip label="carb" value={nutritionData.carbs} color={Brand.macroCarb} bg={Brand.macroCarbBg} />
              <ExploreMacroChip label="gord" value={nutritionData.fat} color={Brand.macroFat} bg={Brand.macroFatBg} />
            </View>
          </View>

          <MealAttachmentField value={attachments} onChange={onChangeAttachments} maxItems={1} />

          <View style={s.stepDivider} />
          <Text style={s.stepLabel}>3. Nome do prato</Text>
          <AppInput placeholder="Ex.: Marmita fit, Café da manhã..." value={dishName} onChangeText={onChangeDishName} />

          <View style={s.formActions}>
            <View style={s.formActionItem}>
              <AppButton
                title={editing ? 'Atualizar prato' : 'Salvar prato'}
                onPress={onSave}
                disabled={!canSaveDish}
              />
            </View>
            <View style={s.formActionItem}>
              <AppButton title="Cancelar" onPress={onCancel} variant="secondary" />
            </View>
          </View>
        </>
      ) : (
        <View style={s.formActions}>
          <View style={s.formActionItem}>
            <AppButton title="Cancelar" onPress={onCancel} variant="secondary" />
          </View>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  formSection: {
    backgroundColor: Brand.card,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: 18,
    gap: 12,
    ...Shadows.card,
  },
  stepLabel: {
    ...Typography.caption,
    color: Brand.greenDark,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  chipList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#EFF7F1',
  },
  chipText: {
    ...Typography.body,
    color: Brand.text,
    fontWeight: '600',
  },
  chipRemove: {
    ...Typography.body,
    color: Brand.danger,
    fontWeight: '700',
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  weightInputWrap: {
    flex: 1,
  },
  unitRow: {
    flexDirection: 'row',
    gap: 8,
  },
  unitBtn: {
    minWidth: 42,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: Brand.bg,
    borderWidth: 1,
    borderColor: Brand.border,
  },
  unitBtnActive: {
    backgroundColor: '#E7F6EC',
    borderColor: '#B7DCC2',
  },
  unitText: {
    ...Typography.body,
    color: Brand.textSecondary,
    fontWeight: '700',
  },
  unitTextActive: {
    color: Brand.greenDark,
  },
  addIngBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: Brand.greenDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIngBtnDisabled: {
    opacity: 0.45,
  },
  addIngBtnText: {
    fontSize: 24,
    lineHeight: 26,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pendingHint: {
    ...Typography.body,
    color: Brand.textSecondary,
  },
  stepDivider: {
    height: 1,
    backgroundColor: Brand.border,
    marginVertical: 4,
  },
  previewCard: {
    gap: 12,
    borderRadius: 18,
    backgroundColor: Brand.bg,
    padding: 16,
  },
  previewCal: {
    ...Typography.title,
    color: Brand.text,
    fontWeight: '800',
  },
  previewMacros: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  formActions: {
    flexDirection: 'row',
    gap: 10,
  },
  formActionItem: {
    flex: 1,
  },
});
