import type { Dispatch, RefObject, SetStateAction } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { TextInput } from 'react-native';

import { AppButton } from '@/components/app-button';
import { MealAttachmentField } from '@/components/attachments/domain-attachment-fields';
import { AppInput } from '@/components/app-input';
import { DatePicker } from '@/components/date-picker';
import { MealTypeSelector } from '@/components/meal-type-selector';
import { TimePicker } from '@/components/time-picker';
import { Brand } from '@/constants/theme';
import { s } from '@/features/meals/register-meal-modal.styles';
import type { AttachmentItem } from '@/types/attachments';
import type { MealType, NutritionData } from '@/types/nutrition';
import { formatIngredient, type Ingredient, type WeightUnit } from '@/utils/helpers';

const UNITS: WeightUnit[] = ['g', 'ml', 'un'];

type IngredientsStepProps = {
  ingredients: Ingredient[];
  foodHint: string;
  ingName: string;
  ingWeight: string;
  ingUnit: WeightUnit;
  canAddIngredient: boolean;
  calculated: boolean;
  nutritionLoading: boolean;
  ingNameRef: RefObject<TextInput | null>;
  onChangeIngName: (value: string) => void;
  onChangeIngWeight: (value: string) => void;
  onSetIngUnit: (value: WeightUnit) => void;
  onAddIngredient: () => void;
  onRemoveIngredient: (index: number) => void;
  onCalculate: () => void;
  onFieldFocus: () => void;
};

type ResultStepProps = {
  nutritionData: NutritionData;
  attachments: AttachmentItem[];
  dishName: string;
  isEditing: boolean;
  mealDate: string;
  useToday: boolean;
  time: string;
  useNow: boolean;
  mealType: MealType | null;
  onChangeAttachments: Dispatch<SetStateAction<AttachmentItem[]>>;
  onChangeDishName: (value: string) => void;
  onFieldFocus: () => void;
  onChangeDate: (value: string) => void;
  onToggleToday: (value: boolean) => void;
  onChangeTime: (value: string) => void;
  onToggleNow: (value: boolean) => void;
  onSelectMealType: (value: MealType | null) => void;
};

type ActionProps = {
  calculated: boolean;
  isEditing: boolean;
  canSave: boolean;
  onSave: () => void;
  onCancel: () => void;
};

export function RegisterMealIngredientsStep({
  ingredients,
  foodHint,
  ingName,
  ingWeight,
  ingUnit,
  canAddIngredient,
  calculated,
  nutritionLoading,
  ingNameRef,
  onChangeIngName,
  onChangeIngWeight,
  onSetIngUnit,
  onAddIngredient,
  onRemoveIngredient,
  onCalculate,
  onFieldFocus,
}: IngredientsStepProps) {
  return (
    <>
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
        onChangeText={onChangeIngName}
        maxLength={50}
        onFocus={onFieldFocus}
      />

      <View style={s.weightRow}>
        <View style={s.flexOne}>
          <AppInput
            placeholder="Peso"
            value={ingWeight}
            onChangeText={onChangeIngWeight}
            keyboardType="numeric"
            maxLength={7}
            onFocus={onFieldFocus}
          />
        </View>

        <View style={s.unitRow}>
          {UNITS.map((unit) => (
            <Pressable
              key={unit}
              style={[s.unitBtn, ingUnit === unit && s.unitBtnActive]}
              onPress={() => onSetIngUnit(unit)}>
              <Text style={[s.unitText, ingUnit === unit && s.unitTextActive]}>{unit}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          style={[s.addBtn, !canAddIngredient && s.addBtnDisabled]}
          onPress={onAddIngredient}
          disabled={!canAddIngredient}>
          <Text style={s.addBtnText}>+</Text>
        </Pressable>
      </View>

      {ingredients.length > 0 ? (
        <AppButton
          title={
            calculated
              ? `Recalcular macros (${ingredients.length} ${ingredients.length === 1 ? 'item' : 'itens'})`
              : `Calcular macros (${ingredients.length} ${ingredients.length === 1 ? 'item' : 'itens'})`
          }
          onPress={onCalculate}
          loading={nutritionLoading}
        />
      ) : null}
    </>
  );
}

export function RegisterMealResultStep({
  nutritionData,
  attachments,
  dishName,
  isEditing,
  mealDate,
  useToday,
  time,
  useNow,
  mealType,
  onChangeAttachments,
  onChangeDishName,
  onFieldFocus,
  onChangeDate,
  onToggleToday,
  onChangeTime,
  onToggleNow,
  onSelectMealType,
}: ResultStepProps) {
  return (
    <>
      <View style={s.divider} />
      <Text style={s.stepLabel}>2. Resultado</Text>

      <View style={s.preview}>
        <Text style={s.previewCal}>{nutritionData.calories}</Text>
        <View style={s.previewMacros}>
          <MacroPill label="prot" value={nutritionData.protein} color="#5DADE2" bg="#EBF5FB" />
          <MacroPill label="carb" value={nutritionData.carbs} color={Brand.orange} bg="#FEF5E7" />
          <MacroPill label="gord" value={nutritionData.fat} color="#E74C3C" bg="#FDEDEC" />
        </View>
      </View>

      <View style={s.divider} />
      <Text style={s.stepLabel}>3. Detalhes</Text>

      <MealAttachmentField value={attachments} onChange={onChangeAttachments} maxItems={1} />
      <AppInput
        placeholder="Nome do prato (opcional)"
        value={dishName}
        onChangeText={onChangeDishName}
        onFocus={onFieldFocus}
      />

      {!isEditing ? (
        <>
          <Text style={s.label}>Data</Text>
          <DatePicker
            value={mealDate}
            useToday={useToday}
            onChangeDate={onChangeDate}
            onToggleToday={onToggleToday}
          />
        </>
      ) : null}

      <Text style={s.label}>Horário</Text>
      <TimePicker value={time} useNow={useNow} onChangeTime={onChangeTime} onToggleNow={onToggleNow} />

      <Text style={s.label}>Tipo de refeição</Text>
      <MealTypeSelector selected={mealType} onSelect={onSelectMealType} />
    </>
  );
}

export function RegisterMealActionButtons({ calculated, isEditing, canSave, onSave, onCancel }: ActionProps) {
  if (!calculated) {
    return (
      <View style={s.cancelOnlyWrap}>
        <AppButton title="Cancelar" onPress={onCancel} variant="secondary" />
      </View>
    );
  }

  return (
    <View style={s.actionRow}>
      <View style={s.primaryActionWrap}>
        <AppButton
          title={isEditing ? 'Salvar alterações' : 'Salvar refeição'}
          onPress={onSave}
          disabled={!canSave}
        />
      </View>
      <View style={s.secondaryActionWrap}>
        <AppButton title="Cancelar" onPress={onCancel} variant="secondary" />
      </View>
    </View>
  );
}

function MacroPill({ label, value, color, bg }: { label: string; value: string; color: string; bg: string }) {
  return (
    <View style={[s.pill, { backgroundColor: bg }]}>
      <Text style={[s.pillLabel, { color }]}>{label}</Text>
      <Text style={[s.pillValue, { color }]}>{value}</Text>
    </View>
  );
}
