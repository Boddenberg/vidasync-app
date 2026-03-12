import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
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

import { AppButton } from '@/components/app-button';
import { MealAttachmentField } from '@/components/attachments/domain-attachment-fields';
import { AppInput } from '@/components/app-input';
import { NutritionErrorModal } from '@/components/nutrition-error-modal';
import { Brand, Radii, Shadows, Typography } from '@/constants/theme';
import { useAsync } from '@/hooks/use-async';
import { useFavorites } from '@/hooks/use-favorites';
import { useMeals } from '@/hooks/use-meals';
import { createRemotePhotoAttachment } from '@/services/attachments';
import { getNutrition } from '@/services/nutrition';
import type { AttachmentItem } from '@/types/attachments';
import type { Favorite, MealType } from '@/types/nutrition';
import { MEAL_TYPE_LABELS } from '@/types/nutrition';
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

const UNITS: WeightUnit[] = ['g', 'ml', 'un'];

const SEARCH_CATEGORIES = [
  { id: 'all', label: 'Todos' },
  { id: 'frutas', label: 'Frutas' },
  { id: 'carnes', label: 'Carnes' },
  { id: 'laticinios', label: 'Laticinios' },
  { id: 'graos', label: 'Graos' },
  { id: 'snacks', label: 'Snacks' },
  { id: 'bebidas', label: 'Bebidas' },
  { id: 'vegetais', label: 'Vegetais' },
] as const;

type SearchCategory = (typeof SEARCH_CATEGORIES)[number]['id'];

function inferCategory(foods: string): SearchCategory {
  const value = foods.toLowerCase();
  if (/(banana|maca|laranja|morango|fruta)/.test(value)) return 'frutas';
  if (/(frango|carne|peixe|bovina|porco)/.test(value)) return 'carnes';
  if (/(iogurte|leite|queijo)/.test(value)) return 'laticinios';
  if (/(arroz|aveia|quinoa|grao|feijao)/.test(value)) return 'graos';
  if (/(suco|agua|cha|cafe|refrigerante)/.test(value)) return 'bebidas';
  if (/(brocolis|alface|tomate|cenoura|vegetal|salada)/.test(value)) return 'vegetais';
  if (/(barra|biscoito|snack|castanha)/.test(value)) return 'snacks';
  return 'all';
}

export default function MyDishesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [showForm, setShowForm] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [activeCategory, setActiveCategory] = useState<SearchCategory>('all');

  const [foodHint] = useState(() => `ex: ${randomFoodExample()}`);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [ingName, setIngName] = useState('');
  const [ingWeight, setIngWeight] = useState('');
  const [ingUnit, setIngUnit] = useState<WeightUnit>('g');
  const [dishName, setDishName] = useState('');
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);

  const nutrition = useAsync(getNutrition);
  const { favorites, loading, error, add, remove, refresh } = useFavorites();
  const { add: addMeal } = useMeals();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const ingNameRef = useRef<TextInput>(null);

  function handleAddIngredient() {
    const name = ingName.trim();
    if (!name) return;
    setIngredients((prev) => [...prev, { name, weight: ingWeight.trim(), unit: ingUnit }]);
    setIngName('');
    setIngWeight('');
    setIngUnit('g');
    setTimeout(() => ingNameRef.current?.focus(), 100);
    if (nutrition.data) nutrition.reset();
  }

  function handleRemoveIngredient(index: number) {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
    if (nutrition.data) nutrition.reset();
  }

  function handleCalculate() {
    if (ingredients.length === 0) return;
    Keyboard.dismiss();
    const foodsStr = ingredients.map(formatIngredient).join(', ');
    nutrition.execute(foodsStr);
  }

  async function handleSave() {
    if (!nutrition.data) return;
    const ingredientsStr = ingredients.map(formatIngredient).join(', ');
    const foodsStr = buildFoodsString(dishName, ingredientsStr);
    await add(foodsStr, nutrition.data, resolvePrimaryImagePayload(attachments));
    handleCancel();
  }

  function handleCancel() {
    setIngredients([]);
    setIngName('');
    setIngWeight('');
    setIngUnit('g');
    setDishName('');
    setAttachments([]);
    setEditingFav(null);
    nutrition.reset();
    setShowForm(false);
  }

  const [editingFav, setEditingFav] = useState<Favorite | null>(null);
  const [actionSheetFav, setActionSheetFav] = useState<Favorite | null>(null);
  const [mealTypeFav, setMealTypeFav] = useState<Favorite | null>(null);

  function handleFavoriteActions(fav: Favorite) {
    setActionSheetFav(fav);
  }

  function closeActionSheet() {
    setActionSheetFav(null);
  }

  function handleUseAsMeal(fav: Favorite) {
    setMealTypeFav(fav);
  }

  async function confirmUseAsMeal(type: MealType) {
    if (!mealTypeFav) return;
    const fav = mealTypeFav;
    setMealTypeFav(null);
    let imageBase64: string | undefined;

    if (fav.imageUrl) {
      try {
        const resp = await fetch(fav.imageUrl);
        const blob = await resp.blob();
        imageBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
          reader.readAsDataURL(blob);
        });
      } catch {
        imageBase64 = undefined;
      }
    }

    await addMeal(fav.foods, type, fav.nutrition, undefined, undefined, imageBase64);
    router.navigate('/(tabs)');
  }

  function startEditing(fav: Favorite) {
    setEditingFav(fav);
    const { dishName: recoveredName, ingredientsRaw } = splitFoodsAndDishName(fav.foods);
    const parsed = parseFoodsToIngredients(ingredientsRaw);
    setIngredients(parsed);
    setDishName(recoveredName);
    setAttachments(fav.imageUrl ? [createRemotePhotoAttachment('meal', fav.imageUrl, 'imagem-atual.jpg')] : []);
    nutrition.setData(fav.nutrition);
    setShowForm(true);
  }

  async function handleSaveEdit() {
    if (!editingFav || !nutrition.data) return;
    const ingredientsStr = ingredients.map(formatIngredient).join(', ');
    const foodsStr = buildFoodsString(dishName, ingredientsStr);
    const imageToSend = resolvePrimaryImagePayload(attachments);
    await remove(editingFav.id);
    await add(foodsStr, nutrition.data, imageToSend);
    setEditingFav(null);
    handleCancel();
  }

  const hasIngredients = ingredients.length > 0;
  const calculated = !!nutrition.data;
  const canAddIngredient = ingName.trim().length > 0;

  const filteredFavorites = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return favorites.filter((fav) => {
      const matchesText = query.length === 0 || fav.foods.toLowerCase().includes(query);
      const category = inferCategory(fav.foods);
      const matchesCategory = activeCategory === 'all' || category === activeCategory;
      return matchesText && matchesCategory;
    });
  }, [activeCategory, favorites, searchText]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}>
      <View style={[s.root, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor={Brand.bg} />

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={s.title}>Pratos</Text>
          <Text style={s.subtitle}>Busque, cadastre e reutilize suas refeicoes favoritas.</Text>

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

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.categoryRow}>
            {SEARCH_CATEGORIES.map((category) => {
              const active = activeCategory === category.id;
              return (
                <Pressable
                  key={category.id}
                  style={[s.categoryChip, active && s.categoryChipActive]}
                  onPress={() => setActiveCategory(category.id)}>
                  <Text style={[s.categoryChipText, active && s.categoryChipTextActive]}>{category.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {!showForm ? (
            <Pressable style={({ pressed }) => [s.newDishCard, pressed && s.newDishCardPressed]} onPress={() => setShowForm(true)}>
              <View style={s.newDishIcon}>
                <Text style={s.newDishIconText}>+</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.newDishTitle}>Novo prato</Text>
                <Text style={s.newDishSubtitle}>Monte ingredientes, calcule macros e salve.</Text>
              </View>
            </Pressable>
          ) : (
            <View style={s.formSection}>
              <Text style={s.stepLabel}>1. Ingredientes</Text>

              {ingredients.length > 0 ? (
                <View style={s.chipList}>
                  {ingredients.map((ing, idx) => (
                    <View key={idx} style={s.chip}>
                      <Text style={s.chipText}>{formatIngredient(ing)}</Text>
                      <Pressable onPress={() => handleRemoveIngredient(idx)} hitSlop={8}>
                        <Text style={s.chipRemove}>×</Text>
                      </Pressable>
                    </View>
                  ))}
                </View>
              ) : null}

              <AppInput
                ref={ingNameRef}
                placeholder={ingredients.length === 0 ? foodHint : 'Adicionar ingrediente'}
                value={ingName}
                onChangeText={(text: string) => setIngName(text.replace(/[^a-zA-ZÀ-ÿ\s]/g, ''))}
                maxLength={50}
              />

              <View style={s.weightRow}>
                <View style={{ flex: 1 }}>
                  <AppInput
                    placeholder="Quantidade"
                    value={ingWeight}
                    onChangeText={(text: string) => setIngWeight(text.replace(/[^0-9.,]/g, ''))}
                    keyboardType="numeric"
                    maxLength={7}
                  />
                </View>
                <View style={s.unitRow}>
                  {UNITS.map((unit) => (
                    <Pressable key={unit} style={[s.unitBtn, ingUnit === unit && s.unitBtnActive]} onPress={() => setIngUnit(unit)}>
                      <Text style={[s.unitText, ingUnit === unit && s.unitTextActive]}>{unit}</Text>
                    </Pressable>
                  ))}
                </View>
                <Pressable style={[s.addIngBtn, !canAddIngredient && s.addIngBtnDisabled]} onPress={handleAddIngredient} disabled={!canAddIngredient}>
                  <Text style={s.addIngBtnText}>+</Text>
                </Pressable>
              </View>

              {hasIngredients ? (
                <AppButton
                  title={
                    calculated
                      ? `Recalcular macros (${ingredients.length} ${ingredients.length === 1 ? 'item' : 'itens'})`
                      : `Calcular macros (${ingredients.length} ${ingredients.length === 1 ? 'item' : 'itens'})`
                  }
                  onPress={handleCalculate}
                  loading={nutrition.loading}
                />
              ) : null}

              {nutrition.error ? (
                <NutritionErrorModal visible={!!nutrition.error} message={nutrition.error} onClose={() => nutrition.reset()} />
              ) : null}

              {calculated ? (
                <>
                  <View style={s.stepDivider} />
                  <Text style={s.stepLabel}>2. Resultado</Text>
                  <View style={s.previewCard}>
                    <Text style={s.previewCal}>{nutrition.data!.calories}</Text>
                    <View style={s.previewMacros}>
                      <MacroChip label="prot" value={nutrition.data!.protein} color={Brand.macroProtein} bg={Brand.macroProteinBg} />
                      <MacroChip label="carb" value={nutrition.data!.carbs} color={Brand.macroCarb} bg={Brand.macroCarbBg} />
                      <MacroChip label="gord" value={nutrition.data!.fat} color={Brand.macroFat} bg={Brand.macroFatBg} />
                    </View>
                  </View>

                  <MealAttachmentField value={attachments} onChange={setAttachments} maxItems={1} />

                  <View style={s.stepDivider} />
                  <Text style={s.stepLabel}>3. Nome do prato</Text>
                  <AppInput placeholder="Ex: Marmita fit, Cafe da manha..." value={dishName} onChangeText={setDishName} />

                  <View style={s.formActions}>
                    <View style={{ flex: 2 }}>
                      <AppButton title={editingFav ? 'Atualizar prato' : 'Salvar prato'} onPress={editingFav ? handleSaveEdit : handleSave} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <AppButton title="Cancelar" onPress={handleCancel} variant="secondary" />
                    </View>
                  </View>
                </>
              ) : (
                <View style={s.formActions}>
                  <View style={{ flex: 1 }}>
                    <AppButton title="Cancelar" onPress={handleCancel} variant="secondary" />
                  </View>
                </View>
              )}
            </View>
          )}

          {loading ? <Text style={s.hint}>Carregando pratos...</Text> : null}

          {!loading && favorites.length === 0 && !showForm ? (
            <View style={s.emptyState}>
              <Text style={s.emptyTitle}>Nenhum prato cadastrado</Text>
              <Text style={s.emptyHint}>Use o botao Novo prato para montar sua primeira receita favorita.</Text>
            </View>
          ) : null}

          {error ? (
            <View style={s.errorBox}>
              <Text style={s.errorText}>{error}</Text>
            </View>
          ) : null}

          {favorites.length > 0 ? (
            <>
              <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>Pratos salvos</Text>
                <Text style={s.sectionCount}>
                  {filteredFavorites.length}/{favorites.length}
                </Text>
              </View>

              <View style={s.list}>
                {filteredFavorites.map((fav) => (
                  <Pressable key={fav.id} style={({ pressed }) => [s.card, pressed && s.cardPressed]} onPress={() => handleFavoriteActions(fav)}>
                    {fav.imageUrl ? (
                      <Image source={{ uri: fav.imageUrl }} style={s.cardThumb} />
                    ) : (
                      <View style={s.cardThumbPlaceholder}>
                        <Ionicons name="restaurant-outline" size={18} color={Brand.textSecondary} />
                      </View>
                    )}
                    <View style={s.cardContent}>
                      <View style={s.cardTop}>
                        <Text style={s.cardFoods} numberOfLines={1}>
                          {fav.foods}
                        </Text>
                        <Text style={s.cardCal}>{fav.nutrition.calories}</Text>
                      </View>
                      <View style={s.cardMacros}>
                        <MacroChip label="prot" value={fav.nutrition.protein} color={Brand.macroProtein} bg={Brand.macroProteinBg} />
                        <MacroChip label="carb" value={fav.nutrition.carbs} color={Brand.macroCarb} bg={Brand.macroCarbBg} />
                        <MacroChip label="gord" value={fav.nutrition.fat} color={Brand.macroFat} bg={Brand.macroFatBg} />
                      </View>
                    </View>
                  </Pressable>
                ))}
              </View>
            </>
          ) : null}
        </ScrollView>
      </View>

      <Modal visible={!!mealTypeFav} transparent animationType="fade" onRequestClose={() => setMealTypeFav(null)}>
        <Pressable style={s.overlay} onPress={() => setMealTypeFav(null)}>
          <Pressable style={s.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={s.handleWrap}>
              <View style={s.handle} />
            </View>
            <Text style={s.sheetTitle}>Adicionar em qual refeicao?</Text>
            {mealTypeFav ? <Text style={s.sheetSubtitle}>{mealTypeFav.foods}</Text> : null}

            <View style={s.sheetActions}>
              {(['breakfast', 'lunch', 'snack', 'dinner', 'supper'] as MealType[]).map((type, idx) => {
                const iconConfig: Record<
                  MealType,
                  { name: 'sunny-outline' | 'restaurant-outline' | 'cafe-outline' | 'moon-outline' | 'bed-outline'; color: string; bg: string }
                > = {
                  breakfast: { name: 'sunny-outline', color: '#F57C00', bg: '#FFF3E0' },
                  lunch: { name: 'restaurant-outline', color: Brand.greenDark, bg: '#E8F5E9' },
                  snack: { name: 'cafe-outline', color: '#D6A624', bg: '#FFF8E1' },
                  dinner: { name: 'moon-outline', color: '#7E57C2', bg: '#EDE7F6' },
                  supper: { name: 'bed-outline', color: '#5C6BC0', bg: '#E8EAF6' },
                };
                const cfg = iconConfig[type];
                return (
                  <View key={type}>
                    {idx > 0 ? <View style={s.sheetBorder} /> : null}
                    <Pressable style={({ pressed }) => [s.sheetBtn, pressed && s.sheetBtnPressed]} onPress={() => confirmUseAsMeal(type)}>
                      <View style={[s.sheetIconWrap, { backgroundColor: cfg.bg }]}>
                        <Ionicons name={cfg.name} size={18} color={cfg.color} />
                      </View>
                      <Text style={s.sheetBtnLabel}>{MEAL_TYPE_LABELS[type]}</Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>

            <Pressable style={({ pressed }) => [s.sheetCancelBtn, pressed && s.sheetBtnPressed]} onPress={() => setMealTypeFav(null)}>
              <Text style={s.sheetCancelText}>Cancelar</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={!!actionSheetFav} transparent animationType="fade" onRequestClose={closeActionSheet}>
        <Pressable style={s.overlay} onPress={closeActionSheet}>
          <Pressable style={s.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={s.handleWrap}>
              <View style={s.handle} />
            </View>

            {actionSheetFav ? (
              <View style={s.sheetHeaderRow}>
                {actionSheetFav.imageUrl ? (
                  <Image source={{ uri: actionSheetFav.imageUrl }} style={s.sheetThumb} />
                ) : (
                  <View style={s.sheetThumbPlaceholder}>
                    <Ionicons name="restaurant-outline" size={18} color={Brand.textSecondary} />
                  </View>
                )}
                <Text style={s.sheetHeaderName} numberOfLines={2}>
                  {actionSheetFav.foods}
                </Text>
              </View>
            ) : null}

            <View style={s.sheetActions}>
              <Pressable
                style={({ pressed }) => [s.sheetBtn, pressed && s.sheetBtnPressed]}
                onPress={() => {
                  const fav = actionSheetFav!;
                  closeActionSheet();
                  setTimeout(() => handleUseAsMeal(fav), 150);
                }}>
                <View style={[s.sheetIconWrap, { backgroundColor: '#E8F5E9' }]}>
                  <Ionicons name="add-circle-outline" size={18} color={Brand.greenDark} />
                </View>
                <Text style={s.sheetBtnLabel}>Usar como refeicao</Text>
              </Pressable>

              <View style={s.sheetBorder} />

              <Pressable
                style={({ pressed }) => [s.sheetBtn, pressed && s.sheetBtnPressed]}
                onPress={() => {
                  const fav = actionSheetFav!;
                  closeActionSheet();
                  setTimeout(() => startEditing(fav), 150);
                }}>
                <View style={[s.sheetIconWrap, { backgroundColor: '#E6F2FF' }]}>
                  <Ionicons name="create-outline" size={18} color="#1E88E5" />
                </View>
                <Text style={s.sheetBtnLabel}>Editar</Text>
              </Pressable>

              <View style={s.sheetBorder} />

              <Pressable
                style={({ pressed }) => [s.sheetBtn, pressed && s.sheetBtnPressed]}
                onPress={() => {
                  const fav = actionSheetFav!;
                  closeActionSheet();
                  setTimeout(() => {
                    Alert.alert('Remover prato?', fav.foods, [
                      { text: 'Remover', style: 'destructive', onPress: () => remove(fav.id) },
                      { text: 'Cancelar', style: 'cancel' },
                    ]);
                  }, 150);
                }}>
                <View style={[s.sheetIconWrap, { backgroundColor: '#FFEDEE' }]}>
                  <Ionicons name="trash-outline" size={18} color={Brand.danger} />
                </View>
                <Text style={[s.sheetBtnLabel, { color: Brand.danger }]}>Apagar</Text>
              </Pressable>
            </View>

            <Pressable style={({ pressed }) => [s.sheetCancelBtn, pressed && s.sheetBtnPressed]} onPress={closeActionSheet}>
              <Text style={s.sheetCancelText}>Cancelar</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

function MacroChip({
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
    <View style={[s.pill, { backgroundColor: bg }]}>
      <Text style={[s.pillLabel, { color }]}>{label}</Text>
      <Text style={[s.pillValue, { color }]}>{value}</Text>
    </View>
  );
}

const THUMB_SIZE = 56;

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Brand.bg,
  },
  scroll: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 150,
    gap: 12,
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
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Brand.card,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Brand.border,
    paddingHorizontal: 12,
    ...Shadows.card,
  },
  searchInput: {
    flex: 1,
    minHeight: 50,
    color: Brand.text,
    ...Typography.body,
  },
  categoryRow: {
    gap: 8,
    paddingRight: 8,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: Brand.border,
    backgroundColor: Brand.surfaceAlt,
  },
  categoryChipActive: {
    backgroundColor: Brand.green,
    borderColor: Brand.green,
  },
  categoryChipText: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '700',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  newDishCard: {
    marginTop: 2,
    backgroundColor: Brand.card,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...Shadows.card,
  },
  newDishCardPressed: {
    opacity: 0.88,
  },
  newDishIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: Brand.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newDishIconText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    marginTop: -2,
  },
  newDishTitle: {
    ...Typography.body,
    color: Brand.text,
    fontWeight: '700',
  },
  newDishSubtitle: {
    ...Typography.caption,
    color: Brand.textSecondary,
    marginTop: 2,
  },
  formSection: {
    backgroundColor: Brand.card,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: 16,
    gap: 12,
    ...Shadows.card,
  },
  stepLabel: {
    ...Typography.caption,
    color: Brand.greenDark,
    textTransform: 'uppercase',
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  stepDivider: {
    width: 28,
    height: 2,
    borderRadius: Radii.pill,
    backgroundColor: Brand.border,
    alignSelf: 'center',
  },
  chipList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: Brand.border,
    backgroundColor: Brand.surfaceAlt,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipText: {
    ...Typography.caption,
    color: Brand.text,
    fontWeight: '700',
  },
  chipRemove: {
    color: Brand.textSecondary,
    fontSize: 12,
    fontWeight: '800',
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  unitRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: Radii.md,
    overflow: 'hidden',
    backgroundColor: Brand.surfaceAlt,
  },
  unitBtn: {
    minWidth: 40,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitBtnActive: {
    backgroundColor: Brand.green,
  },
  unitText: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '700',
  },
  unitTextActive: {
    color: '#FFFFFF',
  },
  addIngBtn: {
    width: 48,
    height: 48,
    borderRadius: Radii.md,
    backgroundColor: Brand.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIngBtnDisabled: {
    backgroundColor: Brand.border,
  },
  addIngBtnText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    marginTop: -2,
  },
  previewCard: {
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Brand.border,
    backgroundColor: Brand.surfaceSoft,
    padding: 14,
    gap: 8,
  },
  previewCal: {
    ...Typography.subtitle,
    color: Brand.greenDark,
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
  sectionHeader: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    ...Typography.subtitle,
    color: Brand.text,
    fontWeight: '800',
  },
  sectionCount: {
    ...Typography.caption,
    color: Brand.textSecondary,
  },
  hint: {
    ...Typography.body,
    color: Brand.textSecondary,
    textAlign: 'center',
    paddingVertical: 8,
  },
  emptyState: {
    marginTop: 2,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Brand.border,
    backgroundColor: Brand.surfaceAlt,
    padding: 18,
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: {
    ...Typography.body,
    color: Brand.text,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyHint: {
    ...Typography.caption,
    color: Brand.textSecondary,
    textAlign: 'center',
    lineHeight: 17,
  },
  errorBox: {
    borderRadius: Radii.md,
    backgroundColor: '#FFEDEE',
    padding: 12,
  },
  errorText: {
    ...Typography.body,
    color: Brand.danger,
    fontSize: 14,
  },
  list: {
    gap: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Brand.border,
    backgroundColor: Brand.card,
    padding: 10,
    ...Shadows.card,
  },
  cardPressed: {
    opacity: 0.88,
  },
  cardThumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 12,
  },
  cardThumbPlaceholder: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 12,
    backgroundColor: Brand.surfaceAlt,
    borderWidth: 1,
    borderColor: Brand.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
    paddingHorizontal: 12,
    gap: 6,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardFoods: {
    ...Typography.body,
    color: Brand.text,
    fontWeight: '700',
    flex: 1,
  },
  cardCal: {
    ...Typography.caption,
    color: Brand.greenDark,
    fontWeight: '800',
    fontSize: 12,
  },
  cardMacros: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: Radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pillLabel: {
    ...Typography.caption,
    textTransform: 'uppercase',
    fontWeight: '800',
    fontSize: 10,
  },
  pillValue: {
    ...Typography.caption,
    fontWeight: '700',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(31,41,51,0.34)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Brand.bg,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    paddingBottom: 34,
    paddingHorizontal: 20,
  },
  handleWrap: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 42,
    height: 4,
    borderRadius: Radii.pill,
    backgroundColor: Brand.border,
  },
  sheetTitle: {
    ...Typography.subtitle,
    color: Brand.text,
    textAlign: 'center',
    fontWeight: '700',
    marginBottom: 4,
  },
  sheetSubtitle: {
    ...Typography.caption,
    color: Brand.textSecondary,
    textAlign: 'center',
    marginBottom: 14,
  },
  sheetActions: {
    backgroundColor: Brand.card,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Brand.border,
    overflow: 'hidden',
  },
  sheetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  sheetBtnPressed: {
    opacity: 0.82,
  },
  sheetBorder: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Brand.border,
  },
  sheetIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetBtnLabel: {
    ...Typography.body,
    color: Brand.text,
    fontWeight: '600',
  },
  sheetCancelBtn: {
    marginTop: 10,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Brand.border,
    backgroundColor: Brand.card,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  sheetCancelText: {
    ...Typography.body,
    color: Brand.textSecondary,
    fontWeight: '700',
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  sheetThumb: {
    width: 46,
    height: 46,
    borderRadius: 12,
  },
  sheetThumbPlaceholder: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: Brand.surfaceAlt,
    borderWidth: 1,
    borderColor: Brand.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetHeaderName: {
    ...Typography.body,
    color: Brand.text,
    fontWeight: '600',
    flex: 1,
    lineHeight: 20,
  },
});
