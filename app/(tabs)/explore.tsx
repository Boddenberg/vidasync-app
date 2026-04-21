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
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

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
const SEARCH_MAX_LENGTH = 28;

function sanitizeSearchText(value: string) {
  return value
    .replace(/[^A-Za-zÀ-ÖØ-öø-ÿ\s]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/^\s+/, '')
    .slice(0, SEARCH_MAX_LENGTH);
}

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

  function handleSearchTextChange(value: string) {
    setSearchText(sanitizeSearchText(value));
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

  return (
    <KeyboardAvoidingView
      style={s.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}>
      <View style={[s.root, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor={Brand.bg} />

        {/* Ambient orbs */}
        <View pointerEvents="none" style={s.orbTopLeft} />
        <View pointerEvents="none" style={s.orbMidRight} />

        <ScrollView
          bounces={false}
          alwaysBounceVertical={false}
          contentInsetAdjustmentBehavior="never"
          overScrollMode="never"
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {isFromHome ? <ReturnHomeButton onPress={() => router.replace('/(tabs)' as any)} /> : null}

          {/* Hero */}
          <View style={s.hero}>
            <View style={s.heroRow}>
              <View style={s.heroTitleBlock}>
                <Text style={s.heroEyebrow}>MINHA COLEÇÃO</Text>
                <Text style={s.heroTitle}>Pratos</Text>
              </View>
              {favorites.length > 0 ? (
                <View style={s.heroStat}>
                  <Text style={s.heroStatValue}>{favorites.length}</Text>
                  <Text style={s.heroStatLabel}>{favorites.length === 1 ? 'salvo' : 'salvos'}</Text>
                </View>
              ) : null}
            </View>
            <Text style={s.heroSubtitle}>
              {isFromHome
                ? 'Escolha um prato salvo para adicionar à refeição.'
                : 'Cadastre, busque e reutilize suas receitas favoritas.'}
            </Text>
          </View>

          {/* Search bar */}
          <View style={s.searchWrap}>
            <View style={s.searchIconWrap}>
              <Ionicons name="search" size={16} color={Brand.greenDeeper} />
            </View>
            <TextInput
              value={searchText}
              onChangeText={handleSearchTextChange}
              placeholder="Buscar nos salvos"
              placeholderTextColor={Brand.textMuted}
              maxLength={SEARCH_MAX_LENGTH}
              style={s.searchInput}
              returnKeyType="search"
            />
            {searchText.length > 0 ? (
              <Pressable hitSlop={10} onPress={() => setSearchText('')} style={s.searchClear}>
                <Ionicons name="close-circle" size={18} color={Brand.textMuted} />
              </Pressable>
            ) : null}
          </View>

          {/* New dish CTA or form */}
          {!showForm ? (
            <Pressable
              style={({ pressed }) => [s.newDishCard, pressed && s.newDishCardPressed]}
              onPress={() => setShowForm(true)}>
              <View style={StyleSheet.absoluteFill}>
                <Svg width="100%" height="100%">
                  <Defs>
                    <LinearGradient id="newDishGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <Stop offset="0%" stopColor={Brand.fresh} stopOpacity="1" />
                      <Stop offset="100%" stopColor={Brand.forest} stopOpacity="1" />
                    </LinearGradient>
                  </Defs>
                  <Rect x="0" y="0" width="100%" height="100%" rx="24" ry="24" fill="url(#newDishGrad)" />
                </Svg>
              </View>
              <View style={s.newDishIcon}>
                <Ionicons name="add" size={22} color="#FFFFFF" />
              </View>
              <View style={s.newDishCopy}>
                <Text style={s.newDishTitle}>Novo prato</Text>
                <Text style={s.newDishSubtitle}>Monte ingredientes e calcule macros</Text>
              </View>
              <View style={s.newDishArrow}>
                <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
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
  orbTopLeft: {
    position: 'absolute',
    top: -140,
    left: -110,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(31,167,80,0.12)',
  },
  orbMidRight: {
    position: 'absolute',
    top: 200,
    right: -120,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(244,166,42,0.08)',
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 140,
    gap: 14,
  },
  hero: {
    gap: 6,
    paddingTop: 6,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  heroTitleBlock: {
    flex: 1,
    gap: 2,
  },
  heroEyebrow: {
    ...Typography.caption,
    fontSize: 10,
    color: Brand.greenDark,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  heroTitle: {
    ...Typography.title,
    fontSize: 30,
    lineHeight: 34,
    color: Brand.text,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  heroStat: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: Brand.surfaceSoft,
    borderWidth: 1,
    borderColor: 'rgba(20,108,56,0.12)',
  },
  heroStatValue: {
    ...Typography.subtitle,
    fontSize: 17,
    color: Brand.greenDeeper,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  heroStatLabel: {
    ...Typography.caption,
    fontSize: 10,
    color: Brand.greenDark,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  heroSubtitle: {
    ...Typography.helper,
    fontSize: 13,
    color: Brand.textSecondary,
    lineHeight: 18,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: Radii.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(20,108,56,0.10)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    ...Shadows.card,
  },
  searchIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Brand.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInput: {
    flex: 1,
    minHeight: 36,
    color: Brand.text,
    ...Typography.body,
    fontSize: 14,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  searchClear: {
    padding: 4,
  },
  newDishCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 16,
    overflow: 'hidden',
    ...Shadows.floating,
  },
  newDishCardPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.99 }],
  },
  newDishIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  newDishCopy: {
    flex: 1,
    gap: 2,
  },
  newDishTitle: {
    ...Typography.subtitle,
    fontSize: 17,
    color: '#FFFFFF',
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  newDishSubtitle: {
    ...Typography.caption,
    fontSize: 12,
    color: 'rgba(255,255,255,0.86)',
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  newDishArrow: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
