import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ReturnHomeButton } from '@/components/return-home-button';
import { Brand, Radii, Shadows, Typography } from '@/constants/theme';
import { ExploreDishFormCard } from '@/features/explore/explore-dish-form-card';
import { ExploreFavoriteActionsModal, ExploreMealTypeModal } from '@/features/explore/explore-favorite-sheets';
import { ExploreFavoritesList } from '@/features/explore/explore-favorites-list';
import { useFavorites } from '@/hooks/use-favorites';
import { useMeals } from '@/hooks/use-meals';
import { createRemotePhotoAttachment } from '@/services/attachments';
import { getNutrition } from '@/services/nutrition';
import type { AttachmentItem } from '@/types/attachments';
import type { Favorite, MealType, NutritionData } from '@/types/nutrition';
import { resolvePrimaryImagePayload } from '@/utils/attachment-rules';
import {
  buildFoodsString,
  formatIngredient,
  parseFoodsToIngredients,
  randomFoodExample,
  splitFoodsAndDishName,
  type Ingredient,
  type WeightUnit,
} from '@/utils/helpers';
import { sumNutritionData } from '@/utils/nutrition-math';

const UNITS: WeightUnit[] = ['g', 'ml', 'un'];

export default function MyDishesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ from?: string | string[] }>();

  const [showForm, setShowForm] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [foodHint] = useState(() => `ex: ${randomFoodExample()}`);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [ingName, setIngName] = useState('');
  const [ingWeight, setIngWeight] = useState('');
  const [ingUnit, setIngUnit] = useState<WeightUnit>('g');
  const [dishName, setDishName] = useState('');
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [nutritionData, setNutritionData] = useState<NutritionData | null>(null);
  const [nutritionLoading, setNutritionLoading] = useState(false);
  const [nutritionError, setNutritionError] = useState<string | null>(null);
  const [calculatedIngredientCount, setCalculatedIngredientCount] = useState(0);
  const [editingFav, setEditingFav] = useState<Favorite | null>(null);
  const [actionSheetFav, setActionSheetFav] = useState<Favorite | null>(null);
  const [mealTypeFav, setMealTypeFav] = useState<Favorite | null>(null);

  const { favorites, loading, error, add, update, remove, refresh } = useFavorites();
  const { add: addMeal } = useMeals();
  const ingNameRef = useRef<TextInput>(null);
  const fromParam = Array.isArray(params.from) ? params.from[0] : params.from;
  const isFromHome = fromParam === 'home';

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  function handleAddIngredient() {
    const name = ingName.trim();
    if (!name) return;

    setIngredients((current) => [...current, { name, weight: ingWeight.trim(), unit: ingUnit }]);
    setIngName('');
    setIngWeight('');
    setIngUnit('g');
    setNutritionError(null);
    setTimeout(() => ingNameRef.current?.focus(), 100);
  }

  function handleRemoveIngredient(index: number) {
    setIngredients((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setNutritionError(null);

    if (index < calculatedIngredientCount) {
      setNutritionData(null);
      setCalculatedIngredientCount(0);
    }
  }

  async function handleCalculate() {
    if (ingredients.length === 0 || nutritionLoading) return;

    Keyboard.dismiss();
    setNutritionLoading(true);
    setNutritionError(null);

    const hasPendingIngredients =
      calculatedIngredientCount > 0 &&
      calculatedIngredientCount < ingredients.length &&
      nutritionData !== null;
    const ingredientsToCalculate = hasPendingIngredients
      ? ingredients.slice(calculatedIngredientCount)
      : ingredients;
    const foodsStr = ingredientsToCalculate.map(formatIngredient).join(', ');

    try {
      const nextNutrition = await getNutrition(foodsStr);
      setNutritionData(
        hasPendingIngredients && nutritionData
          ? sumNutritionData(nutritionData, nextNutrition)
          : nextNutrition,
      );
      setCalculatedIngredientCount(ingredients.length);
    } catch (err: any) {
      setNutritionError(err?.message ?? 'Erro ao calcular macros');
    } finally {
      setNutritionLoading(false);
    }
  }

  function resetComposer() {
    setIngredients([]);
    setIngName('');
    setIngWeight('');
    setIngUnit('g');
    setDishName('');
    setAttachments([]);
    setEditingFav(null);
    setNutritionData(null);
    setNutritionLoading(false);
    setNutritionError(null);
    setCalculatedIngredientCount(0);
    setShowForm(false);
  }

  async function handleSave() {
    if (!nutritionData || calculatedIngredientCount !== ingredients.length) return;

    const ingredientsStr = ingredients.map(formatIngredient).join(', ');
    const foodsStr = buildFoodsString(dishName, ingredientsStr);
    const saved = await add(foodsStr, nutritionData, resolvePrimaryImagePayload(attachments));

    if (saved) {
      resetComposer();
    }
  }

  async function handleSaveEdit() {
    if (!editingFav || !nutritionData || calculatedIngredientCount !== ingredients.length) return;

    const ingredientsStr = ingredients.map(formatIngredient).join(', ');
    const foodsStr = buildFoodsString(dishName, ingredientsStr);
    const imageToSend =
      attachments.length === 0
        ? null
        : resolvePrimaryImagePayload(attachments) ?? editingFav.imageUrl ?? undefined;
    const saved = await update(editingFav.id, foodsStr, nutritionData, imageToSend);

    if (saved) {
      resetComposer();
    }
  }

  function startEditing(favorite: Favorite) {
    setEditingFav(favorite);
    const { dishName: recoveredName, ingredientsRaw } = splitFoodsAndDishName(favorite.foods);
    const parsedIngredients = parseFoodsToIngredients(ingredientsRaw);

    setIngredients(parsedIngredients);
    setDishName(recoveredName);
    setAttachments(
      favorite.imageUrl
        ? [createRemotePhotoAttachment('meal', favorite.imageUrl, 'imagem-atual.jpg')]
        : [],
    );
    setNutritionData(favorite.nutrition);
    setNutritionLoading(false);
    setNutritionError(null);
    setCalculatedIngredientCount(parsedIngredients.length);
    setShowForm(true);
  }

  async function handleUseAsMealConfirm(type: MealType) {
    if (!mealTypeFav) return;

    const favorite = mealTypeFav;
    setMealTypeFav(null);
    let imageBase64: string | undefined;

    if (favorite.imageUrl) {
      try {
        const response = await fetch(favorite.imageUrl);
        const blob = await response.blob();
        imageBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
          reader.readAsDataURL(blob);
        });
      } catch {
        imageBase64 = undefined;
      }
    }

    await addMeal(favorite.foods, type, favorite.nutrition, undefined, undefined, imageBase64);
    router.navigate('/(tabs)');
  }

  const hasIngredients = ingredients.length > 0;
  const calculated = !!nutritionData;
  const canAddIngredient = ingName.trim().length > 0;
  const pendingIngredientCount = Math.max(0, ingredients.length - calculatedIngredientCount);
  const canIncrementallyCalculate =
    !!nutritionData && calculatedIngredientCount > 0 && pendingIngredientCount > 0;
  const canSaveDish = calculated && pendingIngredientCount === 0 && !nutritionLoading;

  const filteredFavorites = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return favorites.filter((favorite) => query.length === 0 || favorite.foods.toLowerCase().includes(query));
  }, [favorites, searchText]);
  const subtitle = isFromHome
    ? 'Escolha um prato salvo para usar na refeição ou monte um novo quando precisar.'
    : 'Busque, cadastre e reutilize suas refeições favoritas.';

  return (
    <KeyboardAvoidingView
      style={s.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}>
      <View style={[s.root, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor={Brand.bg} />

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {isFromHome ? <ReturnHomeButton onPress={() => router.replace('/(tabs)' as any)} /> : null}
          <Text style={s.title}>Pratos</Text>
          <Text style={s.subtitle}>{subtitle}</Text>

          <View style={s.searchWrap}>
            <Ionicons name="search-outline" size={18} color={Brand.textSecondary} />
            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Buscar alimento ou prato salvo"
              placeholderTextColor={Brand.textSecondary}
              style={s.searchInput}
            />
          </View>

          {!showForm ? (
            <Pressable style={({ pressed }) => [s.newDishCard, pressed && s.newDishCardPressed]} onPress={() => setShowForm(true)}>
              <View style={s.newDishIcon}>
                <Text style={s.newDishIconText}>+</Text>
              </View>
              <View style={s.newDishCopy}>
                <Text style={s.newDishTitle}>Novo prato</Text>
                <Text style={s.newDishSubtitle}>Monte ingredientes, calcule macros e salve.</Text>
              </View>
            </Pressable>
          ) : (
            <ExploreDishFormCard
              ingredients={ingredients}
              ingName={ingName}
              ingWeight={ingWeight}
              ingUnit={ingUnit}
              units={UNITS}
              foodHint={foodHint}
              dishName={dishName}
              attachments={attachments}
              nutritionData={nutritionData}
              nutritionLoading={nutritionLoading}
              nutritionError={nutritionError}
              editing={!!editingFav}
              hasIngredients={hasIngredients}
              calculated={calculated}
              canAddIngredient={canAddIngredient}
              canSaveDish={canSaveDish}
              canIncrementallyCalculate={canIncrementallyCalculate}
              pendingIngredientCount={pendingIngredientCount}
              ingNameRef={ingNameRef}
              onChangeIngredientName={(text) => setIngName(text.replace(/[^a-zA-ZÀ-ÿ\s]/g, ''))}
              onChangeIngredientWeight={(text) => setIngWeight(text.replace(/[^0-9.,]/g, ''))}
              onChangeIngredientUnit={setIngUnit}
              onAddIngredient={handleAddIngredient}
              onRemoveIngredient={handleRemoveIngredient}
              onCalculate={handleCalculate}
              onCloseNutritionError={() => setNutritionError(null)}
              onChangeAttachments={setAttachments}
              onChangeDishName={setDishName}
              onSave={editingFav ? handleSaveEdit : handleSave}
              onCancel={resetComposer}
            />
          )}

          <ExploreFavoritesList
            favorites={filteredFavorites}
            totalFavorites={favorites.length}
            loading={loading}
            showForm={showForm}
            error={error}
            onPressFavorite={setActionSheetFav}
          />
        </ScrollView>
      </View>

      <ExploreMealTypeModal
        favorite={mealTypeFav}
        onClose={() => setMealTypeFav(null)}
        onConfirm={handleUseAsMealConfirm}
      />

      <ExploreFavoriteActionsModal
        favorite={actionSheetFav}
        onClose={() => setActionSheetFav(null)}
        onUseAsMeal={(favorite) => {
          setActionSheetFav(null);
          setTimeout(() => setMealTypeFav(favorite), 150);
        }}
        onEdit={(favorite) => {
          setActionSheetFav(null);
          setTimeout(() => startEditing(favorite), 150);
        }}
        onDelete={(favorite) => {
          setActionSheetFav(null);
          remove(favorite.id);
        }}
      />
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex: {
    flex: 1,
  },
  root: {
    flex: 1,
    backgroundColor: Brand.bg,
  },
  scroll: {
    paddingHorizontal: 18,
    paddingBottom: 140,
    gap: 14,
  },
  title: {
    ...Typography.title,
    color: Brand.text,
    fontWeight: '800',
  },
  subtitle: {
    ...Typography.body,
    color: Brand.textSecondary,
    marginTop: -8,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: Radii.xl,
    backgroundColor: Brand.card,
    borderWidth: 1,
    borderColor: Brand.border,
    paddingHorizontal: 14,
    paddingVertical: 6,
    ...Shadows.card,
  },
  searchInput: {
    flex: 1,
    minHeight: 42,
    color: Brand.text,
    ...Typography.body,
  },
  newDishCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: Radii.xl,
    backgroundColor: Brand.card,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: 18,
    ...Shadows.card,
  },
  newDishCardPressed: {
    opacity: 0.92,
  },
  newDishIcon: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: '#E7F6EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newDishIconText: {
    fontSize: 28,
    lineHeight: 30,
    fontWeight: '700',
    color: Brand.greenDark,
  },
  newDishCopy: {
    flex: 1,
    gap: 4,
  },
  newDishTitle: {
    ...Typography.subtitle,
    color: Brand.text,
    fontWeight: '800',
  },
  newDishSubtitle: {
    ...Typography.body,
    color: Brand.textSecondary,
  },
});
