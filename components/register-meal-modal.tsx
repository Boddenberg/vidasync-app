/**
 * Modal para registrar ou editar refeicao.
 */

import { useEffect, useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';

import {
  RegisterMealActionButtons,
  RegisterMealIngredientsStep,
  RegisterMealResultStep,
} from '@/features/meals/register-meal-sections';
import { s } from '@/features/meals/register-meal-modal.styles';
import { NutritionErrorModal } from '@/components/nutrition-error-modal';
import { useAsync } from '@/hooks/use-async';
import { createRemotePhotoAttachment } from '@/services/attachments';
import { getNutrition } from '@/services/nutrition';
import type { AttachmentItem } from '@/types/attachments';
import type { Meal, MealType, NutritionData } from '@/types/nutrition';
import { resolvePrimaryImagePayload } from '@/utils/attachment-rules';
import {
  buildFoodsString,
  formatIngredient,
  nowTimeStr,
  parseFoodsToIngredients,
  randomFoodExample,
  splitFoodsAndDishName,
  todayStr,
  type Ingredient,
  type WeightUnit,
} from '@/utils/helpers';

type Props = {
  visible: boolean;
  editMeal?: Meal | null;
  onSave: (params: {
    foods: string;
    mealType: MealType;
    date?: string;
    time?: string;
    nutrition: NutritionData;
    dishName?: string;
    imageBase64?: string | null;
  }) => void;
  onEditSave?: (id: string, params: {
    foods: string;
    mealType: MealType;
    time?: string;
    nutrition: NutritionData;
    imageBase64?: string | null;
  }) => void;
  defaultDate?: string;
  onClose: () => void;
};

export function RegisterMealModal({
  visible,
  editMeal,
  onSave,
  onEditSave,
  defaultDate,
  onClose,
}: Props) {
  const isEditing = !!editMeal;
  const [foodHint] = useState(() => `ex: ${randomFoodExample()}`);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [ingName, setIngName] = useState('');
  const [ingWeight, setIngWeight] = useState('');
  const [ingUnit, setIngUnit] = useState<WeightUnit>('g');
  const [dishName, setDishName] = useState('');
  const [mealDate, setMealDate] = useState('');
  const [useToday, setUseToday] = useState(true);
  const [time, setTime] = useState('');
  const [useNow, setUseNow] = useState(true);
  const [mealType, setMealType] = useState<MealType | null>(null);
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [editInitialized, setEditInitialized] = useState(false);

  const {
    data: nutritionData,
    loading: nutritionLoading,
    error: nutritionError,
    execute: calculateNutrition,
    reset: resetNutrition,
    setData: setNutritionData,
  } = useAsync(getNutrition);

  const ingNameRef = useRef<import('react-native').TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible && editMeal && !editInitialized) {
      const { dishName: recoveredName, ingredientsRaw } = splitFoodsAndDishName(editMeal.foods);
      setIngredients(parseFoodsToIngredients(ingredientsRaw));
      setDishName(recoveredName);
      setMealType(editMeal.mealType);
      setTime(editMeal.time || '');
      setUseNow(false);
      setAttachments(
        editMeal.imageUrl ? [createRemotePhotoAttachment('meal', editMeal.imageUrl, 'imagem-atual.jpg')] : [],
      );
      setNutritionData(editMeal.nutrition);
      setEditInitialized(true);
    }

    if (!visible) {
      setEditInitialized(false);
    }
  }, [editInitialized, editMeal, setNutritionData, visible]);

  useEffect(() => {
    if (!visible || isEditing || editInitialized) return;

    const initialDate = defaultDate || todayStr();
    setMealDate(initialDate);
    setUseToday(initialDate === todayStr());
  }, [defaultDate, editInitialized, isEditing, visible]);

  function reset() {
    setIngredients([]);
    setIngName('');
    setIngWeight('');
    setIngUnit('g');
    setDishName('');
    setMealDate('');
    setUseToday(true);
    setTime('');
    setUseNow(true);
    setMealType(null);
    setAttachments([]);
    resetNutrition();
  }

  function handleClose() {
    reset();
    onClose();
  }

  function scrollToEnd() {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);
  }

  function handleAddIngredient() {
    const name = ingName.trim();
    const weight = ingWeight.trim();
    if (!name) return;

    setIngredients((prev) => [...prev, { name, weight, unit: ingUnit }]);
    setIngName('');
    setIngWeight('');
    setIngUnit('g');
    setTimeout(() => ingNameRef.current?.focus(), 100);

    if (nutritionData) {
      resetNutrition();
    }
  }

  function handleRemoveIngredient(index: number) {
    setIngredients((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
    if (nutritionData) {
      resetNutrition();
    }
  }

  function handleCalculate() {
    if (ingredients.length === 0) return;
    Keyboard.dismiss();
    calculateNutrition(ingredients.map(formatIngredient).join(', '));
  }

  function resolveDate(): string | undefined {
    if (useToday) return undefined;
    return mealDate || undefined;
  }

  function resolveTime(): string | undefined {
    if (useNow) return nowTimeStr();
    return time || undefined;
  }

  function handleSaveNew() {
    if (!nutritionData || !mealType) return;
    onSave({
      foods: ingredients.map(formatIngredient).join(', '),
      mealType,
      date: resolveDate(),
      time: resolveTime(),
      nutrition: nutritionData,
      dishName: dishName.trim() || undefined,
      imageBase64: resolvePrimaryImagePayload(attachments),
    });
    reset();
  }

  function handleSaveEdit() {
    if (!nutritionData || !mealType || !editMeal || !onEditSave) return;
    const ingredientsStr = ingredients.map(formatIngredient).join(', ');
    onEditSave(editMeal.id, {
      foods: buildFoodsString(dishName, ingredientsStr),
      mealType,
      time: resolveTime(),
      nutrition: nutritionData,
      imageBase64: resolvePrimaryImagePayload(attachments),
    });
    reset();
  }

  const calculated = !!nutritionData;
  const canAddIngredient = ingName.trim().length > 0;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={s.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}>
        <Pressable style={s.backdrop} onPress={handleClose} />

        <View style={s.sheet}>
          <View style={s.handleWrap}>
            <View style={s.handle} />
          </View>

          <Text style={s.title}>{isEditing ? 'Editar refeicao' : 'Registrar refeicao'}</Text>

          <ScrollView
            ref={scrollRef}
            contentContainerStyle={s.bodyContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            <View style={s.form}>
              <RegisterMealIngredientsStep
                ingredients={ingredients}
                foodHint={foodHint}
                ingName={ingName}
                ingWeight={ingWeight}
                ingUnit={ingUnit}
                canAddIngredient={canAddIngredient}
                calculated={calculated}
                nutritionLoading={nutritionLoading}
                ingNameRef={ingNameRef}
                onChangeIngName={(value) => setIngName(value.replace(/[^a-zA-ZÀ-ÿ\s]/g, ''))}
                onChangeIngWeight={(value) => setIngWeight(value.replace(/[^0-9.,]/g, ''))}
                onSetIngUnit={setIngUnit}
                onAddIngredient={handleAddIngredient}
                onRemoveIngredient={handleRemoveIngredient}
                onCalculate={handleCalculate}
                onFieldFocus={scrollToEnd}
              />

              {nutritionError ? (
                <NutritionErrorModal
                  visible={Boolean(nutritionError)}
                  message={nutritionError}
                  onClose={resetNutrition}
                />
              ) : null}

              {nutritionData ? (
                <RegisterMealResultStep
                  nutritionData={nutritionData}
                  attachments={attachments}
                  dishName={dishName}
                  isEditing={isEditing}
                  mealDate={mealDate}
                  useToday={useToday}
                  time={time}
                  useNow={useNow}
                  mealType={mealType}
                  onChangeAttachments={setAttachments}
                  onChangeDishName={setDishName}
                  onFieldFocus={scrollToEnd}
                  onChangeDate={setMealDate}
                  onToggleToday={setUseToday}
                  onChangeTime={setTime}
                  onToggleNow={setUseNow}
                  onSelectMealType={setMealType}
                />
              ) : null}

              <RegisterMealActionButtons
                calculated={calculated}
                isEditing={isEditing}
                canSave={Boolean(mealType)}
                onSave={isEditing ? handleSaveEdit : handleSaveNew}
                onCancel={handleClose}
              />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
