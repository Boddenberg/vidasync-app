import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { AppInput } from '@/components/app-input';
import { DatePicker } from '@/components/date-picker';
import { MealTypeSelector } from '@/components/meal-type-selector';
import { TimePicker } from '@/components/time-picker';
import { Brand, Radii, Shadows, Typography } from '@/constants/theme';
import { useAsync } from '@/hooks/use-async';
import { createFavorite } from '@/services/favorites';
import { createMeal } from '@/services/meals';
import type { MealType, NutritionData } from '@/types/nutrition';
import { buildFoodsString, nowTimeStr, todayStr } from '@/utils/helpers';

type Props = {
  nutritionData: NutritionData;
  baseFoods: string;
  initialDishName?: string;
  initialDate?: string;
  imagePayload?: string | null;
  title?: string;
  subtitle?: string;
  onMealSaved?: () => void;
  onFavoriteSaved?: () => void;
};

export function CalculatedDishActionsCard({
  nutritionData,
  baseFoods,
  initialDishName,
  initialDate,
  imagePayload,
  title = 'O que voce quer fazer com esse resultado?',
  subtitle = 'Voce pode registrar a refeicao agora ou salvar esse prato para reutilizar depois.',
  onMealSaved,
  onFavoriteSaved,
}: Props) {
  const favoriteSave = useAsync(createFavorite);
  const mealSave = useAsync(createMeal);

  const [dishName, setDishName] = useState(initialDishName ?? '');
  const [mealDate, setMealDate] = useState(initialDate || todayStr());
  const [useToday, setUseToday] = useState((initialDate || todayStr()) === todayStr());
  const [time, setTime] = useState('');
  const [useNow, setUseNow] = useState(true);
  const [mealType, setMealType] = useState<MealType | null>(null);

  useEffect(() => {
    setDishName(initialDishName ?? '');
  }, [initialDishName]);

  useEffect(() => {
    const nextDate = initialDate || todayStr();
    setMealDate(nextDate);
    setUseToday(nextDate === todayStr());
  }, [initialDate]);

  useEffect(() => {
    if (favoriteSave.data && onFavoriteSaved) {
      onFavoriteSaved();
    }
  }, [favoriteSave.data, onFavoriteSaved]);

  useEffect(() => {
    if (mealSave.data && onMealSaved) {
      onMealSaved();
    }
  }, [mealSave.data, onMealSaved]);

  const resolvedFoods = useMemo(() => {
    const trimmedDishName = dishName.trim();
    const trimmedBaseFoods = baseFoods.trim();

    if (!trimmedBaseFoods) {
      return trimmedDishName;
    }

    return buildFoodsString(trimmedDishName || undefined, trimmedBaseFoods);
  }, [baseFoods, dishName]);

  const canPersist = resolvedFoods.trim().length > 0;
  const canRegisterMeal = canPersist && !!mealType && !mealSave.loading;

  async function handleSaveFavorite() {
    if (!canPersist || favoriteSave.loading) return;

    await favoriteSave.execute({
      foods: resolvedFoods,
      nutrition: nutritionData,
      imageBase64: imagePayload ?? undefined,
    });
  }

  async function handleRegisterMeal() {
    if (!canPersist || !mealType || mealSave.loading) return;

    await mealSave.execute({
      foods: resolvedFoods,
      mealType,
      nutrition: nutritionData,
      date: useToday ? todayStr() : mealDate,
      time: useNow ? nowTimeStr() : time || undefined,
      image: imagePayload || undefined,
    });
  }

  return (
    <View style={s.card}>
      <Text style={s.title}>{title}</Text>
      <Text style={s.subtitle}>{subtitle}</Text>

      <View style={s.section}>
        <Text style={s.label}>Nome do prato</Text>
        <AppInput
          placeholder="Ex.: Marmita fit, Cafe da manha..."
          value={dishName}
          onChangeText={setDishName}
        />
      </View>

      <View style={s.section}>
        <Text style={s.label}>Data</Text>
        <DatePicker
          value={mealDate}
          useToday={useToday}
          onChangeDate={setMealDate}
          onToggleToday={setUseToday}
        />
      </View>

      <View style={s.section}>
        <Text style={s.label}>Horario</Text>
        <TimePicker value={time} useNow={useNow} onChangeTime={setTime} onToggleNow={setUseNow} />
      </View>

      <View style={s.section}>
        <Text style={s.label}>Tipo de refeicao</Text>
        <MealTypeSelector selected={mealType} onSelect={setMealType} />
      </View>

      <View style={s.actions}>
        <AppButton
          title="Registrar refeicao"
          onPress={handleRegisterMeal}
          loading={mealSave.loading}
          disabled={!canRegisterMeal}
        />
        <AppButton
          title="Salvar em Meus pratos"
          onPress={handleSaveFavorite}
          loading={favoriteSave.loading}
          disabled={!canPersist}
          variant="secondary"
        />
      </View>

      {mealSave.error ? (
        <View style={s.errorBox}>
          <Text style={s.errorText}>{mealSave.error}</Text>
        </View>
      ) : null}

      {favoriteSave.error ? (
        <View style={s.errorBox}>
          <Text style={s.errorText}>{favoriteSave.error}</Text>
        </View>
      ) : null}

      {mealSave.data ? (
        <View style={s.successBox}>
          <Text style={s.successText}>Refeicao registrada com sucesso.</Text>
        </View>
      ) : null}

      {favoriteSave.data ? (
        <View style={s.successBox}>
          <Text style={s.successText}>Prato salvo em Meus pratos.</Text>
        </View>
      ) : null}
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
  title: {
    ...Typography.subtitle,
    color: Brand.text,
    fontWeight: '800',
  },
  subtitle: {
    ...Typography.body,
    color: Brand.textSecondary,
    marginTop: -6,
  },
  section: {
    gap: 8,
  },
  label: {
    ...Typography.caption,
    color: Brand.greenDark,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actions: {
    gap: 10,
  },
  errorBox: {
    borderRadius: Radii.lg,
    backgroundColor: '#FFEDEE',
    padding: 12,
  },
  errorText: {
    ...Typography.body,
    color: Brand.danger,
  },
  successBox: {
    borderRadius: Radii.lg,
    backgroundColor: '#F0FFF4',
    padding: 12,
  },
  successText: {
    ...Typography.body,
    color: Brand.greenDark,
    fontWeight: '700',
  },
});
