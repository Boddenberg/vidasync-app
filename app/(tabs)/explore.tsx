/**
 * Tela Meus Pratos
 *
 * Cadastro de pratos com ingredientes estruturados (nome + peso separados), nome e foto.
 * Salva SEM tipo de refeição — o tipo é escolhido na hora de registrar.
 */

import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  Alert,
  Image,
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

import { AppButton } from '@/components/app-button';
import { AppInput } from '@/components/app-input';
import { Brand } from '@/constants/theme';
import { useAsync } from '@/hooks/use-async';
import { useFavorites } from '@/hooks/use-favorites';
import { pickDishImage } from '@/services/dish-images';
import { getNutrition } from '@/services/nutrition';
import type { Favorite } from '@/types/nutrition';
import {
  buildFoodsString,
  formatIngredient,
  parseFoodsToIngredients,
  splitFoodsAndDishName,
  type Ingredient,
  type WeightUnit,
} from '@/utils/helpers';

const UNITS: WeightUnit[] = ['g', 'ml', 'un'];

export default function MyDishesScreen() {
  const insets = useSafeAreaInsets();
  const [showForm, setShowForm] = useState(false);

  // Formulário estruturado
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [ingName, setIngName] = useState('');
  const [ingWeight, setIngWeight] = useState('');
  const [ingUnit, setIngUnit] = useState<WeightUnit>('g');
  const [dishName, setDishName] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoChanged, setPhotoChanged] = useState(false);

  const nutrition = useAsync(getNutrition);
  const { favorites, loading, error, add, remove, refresh } = useFavorites();

  // Recarrega favoritos sempre que a aba ganha foco
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  // ── Ref do input de ingrediente ──
  const ingNameRef = useRef<TextInput>(null);

  // ── Ingredientes ──
  function handleAddIngredient() {
    const name = ingName.trim();
    if (!name) return;
    setIngredients((prev) => [...prev, { name, weight: ingWeight.trim(), unit: ingUnit }]);
    setIngName('');
    setIngWeight('');
    setIngUnit('g');
    // Ingredientes mudaram → macros ficam desatualizados
    if (nutrition.data) nutrition.reset();
    // Voltar foco para o campo de ingrediente
    setTimeout(() => ingNameRef.current?.focus(), 100);
  }

  function handleRemoveIngredient(index: number) {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
    // Ingredientes mudaram → macros ficam desatualizados
    if (nutrition.data) nutrition.reset();
  }

  function handleCalculate() {
    if (ingredients.length === 0) return;
    Keyboard.dismiss();
    const foodsStr = ingredients.map(formatIngredient).join(', ');
    nutrition.execute(foodsStr);
  }

  async function handlePickPhoto() {
    const options: any[] = [
      {
        text: 'Camera',
        onPress: async () => {
          const uri = await pickDishImage(true);
          if (uri) { setPhotoUri(uri); setPhotoChanged(true); }
        },
      },
      {
        text: 'Galeria',
        onPress: async () => {
          const uri = await pickDishImage(false);
          if (uri) { setPhotoUri(uri); setPhotoChanged(true); }
        },
      },
    ];
    if (photoUri) {
      options.push({
        text: 'Remover foto',
        style: 'destructive',
        onPress: () => { setPhotoUri(null); setPhotoChanged(true); },
      });
    }
    options.push({ text: 'Cancelar', style: 'cancel' });
    Alert.alert('Foto do prato', undefined, options);
  }

  async function handleSave() {
    if (!nutrition.data) return;
    const ingredientsStr = ingredients.map(formatIngredient).join(', ');
    const foodsStr = buildFoodsString(dishName, ingredientsStr);
    await add(foodsStr, nutrition.data, photoUri);
    handleCancel();
  }

  function handleCancel() {
    setIngredients([]);
    setIngName('');
    setIngWeight('');
    setIngUnit('g');
    setDishName('');
    setPhotoUri(null);
    setPhotoChanged(false);
    setEditingFav(null);
    nutrition.reset();
    setShowForm(false);
  }

  // ── Editar favorito ──
  const [editingFav, setEditingFav] = useState<Favorite | null>(null);

  function handleFavoriteActions(fav: Favorite) {
    Alert.alert(fav.foods, undefined, [
      {
        text: 'Editar',
        onPress: () => startEditing(fav),
      },
      {
        text: 'Apagar',
        style: 'destructive',
        onPress: () => {
          Alert.alert('Remover prato?', fav.foods, [
            { text: 'Remover', style: 'destructive', onPress: () => remove(fav.id) },
            { text: 'Cancelar', style: 'cancel' },
          ]);
        },
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  function startEditing(fav: Favorite) {
    setEditingFav(fav);
    // Recupera dishName e ingredientes da string foods
    const { dishName: recoveredName, ingredientsRaw } = splitFoodsAndDishName(fav.foods);
    const parsed = parseFoodsToIngredients(ingredientsRaw);
    setIngredients(parsed);
    setDishName(recoveredName);
    setPhotoUri(fav.imageUrl ?? null);
    // Pré-popula a nutrição para não precisar recalcular
    nutrition.setData(fav.nutrition);
    setShowForm(true);
  }

  async function handleSaveEdit() {
    if (!editingFav || !nutrition.data) return;
    const ingredientsStr = ingredients.map(formatIngredient).join(', ');
    const foodsStr = buildFoodsString(dishName, ingredientsStr);
    await remove(editingFav.id);
    await add(foodsStr, nutrition.data, photoUri);
    setEditingFav(null);
    handleCancel();
  }

  const hasIngredients = ingredients.length > 0;
  const calculated = !!nutrition.data;
  const canAddIngredient = ingName.trim().length > 0;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}>
    <View style={[s.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={Brand.bg} />

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        {/* Header */}
        <Text style={s.title}>Meus Pratos</Text>
        <Text style={s.subtitle}>
          Cadastre o que você come com frequência.{'\n'}
          Depois é só lançar rápido na Home.
        </Text>

        <View style={s.divider} />

        {/* ── Formulário de cadastro ── */}
        {!showForm ? (
          <Pressable
            style={s.newBtn}
            onPress={() => setShowForm(true)}>
            <Text style={s.newBtnIcon}>+</Text>
            <Text style={s.newBtnText}>Novo prato</Text>
          </Pressable>
        ) : (
          <View style={s.formSection}>

            {/* Step 1: Ingredientes */}
            <Text style={s.stepLabel}>1. Ingredientes</Text>

            {ingredients.length > 0 && (
              <View style={s.chipList}>
                {ingredients.map((ing, idx) => (
                  <View key={idx} style={s.chip}>
                    <Text style={s.chipText}>{formatIngredient(ing)}</Text>
                    <Pressable
                      onPress={() => handleRemoveIngredient(idx)}
                      hitSlop={8}>
                      <Text style={s.chipRemove}>✕</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            {!calculated && (
              <>
                <AppInput
                  ref={ingNameRef}
                  placeholder={ingredients.length === 0 ? 'Ingrediente (ex: arroz branco)' : 'Ingrediente'}
                  value={ingName}
                  onChangeText={(t: string) => setIngName(t.replace(/[^a-zA-ZÀ-ÿ\s]/g, ''))}
                  maxLength={50}
                />
                <View style={s.weightRow}>
                  <View style={{ flex: 1 }}>
                    <AppInput
                      placeholder="Peso"
                      value={ingWeight}
                      onChangeText={(t: string) => setIngWeight(t.replace(/[^0-9.,]/g, ''))}
                      keyboardType="numeric"
                      maxLength={7}
                    />
                  </View>
                  <View style={s.unitRow}>
                    {UNITS.map((u) => (
                      <Pressable
                        key={u}
                        style={[s.unitBtn, ingUnit === u && s.unitBtnActive]}
                        onPress={() => setIngUnit(u)}>
                        <Text style={[s.unitText, ingUnit === u && s.unitTextActive]}>{u}</Text>
                      </Pressable>
                    ))}
                  </View>
                  <Pressable
                    style={[s.addIngBtn, !canAddIngredient && s.addIngBtnDisabled]}
                    onPress={handleAddIngredient}
                    disabled={!canAddIngredient}>
                    <Text style={s.addIngBtnText}>+</Text>
                  </Pressable>
                </View>
              </>
            )}

            {!calculated && hasIngredients && (
              <AppButton
                title={`Calcular macros (${ingredients.length} ${ingredients.length === 1 ? 'item' : 'itens'})`}
                onPress={handleCalculate}
                loading={nutrition.loading}
              />
            )}

            {nutrition.error && (
              <View style={s.errorBox}>
                <Text style={s.errorText}>{nutrition.error}</Text>
              </View>
            )}

            {/* Step 2: Resultado + detalhes */}
            {calculated && (
              <>
                <View style={s.stepDivider} />
                <Text style={s.stepLabel}>2. Resultado</Text>

                <View style={s.previewCard}>
                  <View style={s.previewHeader}>
                    {/* Foto */}
                    <Pressable style={s.photoBtn} onPress={handlePickPhoto}>
                      {photoUri ? (
                        <Image source={{ uri: photoUri }} style={s.photoImg} />
                      ) : (
                        <View style={s.photoPlaceholder}>
                          <Text style={s.photoHint}>FOTO</Text>
                        </View>
                      )}
                    </Pressable>
                    {/* Calorias */}
                    <View style={s.previewInfo}>
                      <Text style={s.previewCal}>{nutrition.data!.calories}</Text>
                      <View style={s.previewMacros}>
                        <MacroPill label="prot" value={nutrition.data!.protein} color="#5DADE2" bg="#EBF5FB" />
                        <MacroPill label="carb" value={nutrition.data!.carbs} color={Brand.orange} bg="#FEF5E7" />
                        <MacroPill label="gord" value={nutrition.data!.fat} color="#E74C3C" bg="#FDEDEC" />
                      </View>
                    </View>
                  </View>
                </View>

                <Pressable
                  style={s.recalcBtn}
                  onPress={() => nutrition.reset()}>
                  <Text style={s.recalcText}>← Editar ingredientes</Text>
                </Pressable>

                <View style={s.stepDivider} />
                <Text style={s.stepLabel}>3. Nome do prato</Text>

                <AppInput
                  placeholder="ex: Marmita fitness, Café da manhã..."
                  value={dishName}
                  onChangeText={setDishName}
                />

                <View style={s.formActions}>
                  <View style={{ flex: 2 }}>
                    <AppButton
                      title={editingFav ? 'Atualizar prato' : 'Salvar prato'}
                      onPress={editingFav ? handleSaveEdit : handleSave}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppButton title="Cancelar" onPress={handleCancel} variant="secondary" />
                  </View>
                </View>
              </>
            )}

            {/* Cancelar quando ainda não calculou */}
            {!calculated && (
              <View style={s.formActions}>
                <View style={{ flex: 1 }}>
                  <AppButton title="Cancelar" onPress={handleCancel} variant="secondary" />
                </View>
              </View>
            )}
          </View>
        )}

        {/* ── Lista de pratos salvos ── */}
        {loading && <Text style={s.hint}>Carregando...</Text>}

        {!loading && favorites.length === 0 && !showForm && (
          <View style={s.empty}>
            <View style={s.emptyIconWrap}>
              <Text style={s.emptyIconLetter}>P</Text>
            </View>
            <Text style={s.emptyTitle}>Nenhum prato cadastrado</Text>
            <Text style={s.hint}>
              Toque em "+ Novo prato" para cadastrar algo que você come sempre.
            </Text>
          </View>
        )}

        {error && (
          <View style={s.errorBox}>
            <Text style={s.errorText}>{error}</Text>
          </View>
        )}

        {favorites.length > 0 && (
          <>
            <View style={s.divider} />
            <Text style={s.sectionTitle}>
              {favorites.length} {favorites.length === 1 ? 'prato salvo' : 'pratos salvos'}
            </Text>

            <View style={s.list}>
              {favorites.map((fav) => (
                <Pressable
                  key={fav.id}
                  style={s.card}
                  onLongPress={() => handleFavoriteActions(fav)}
                  onPress={() => handleFavoriteActions(fav)}>
                  {fav.imageUrl ? (
                    <Image source={{ uri: fav.imageUrl }} style={s.cardThumb} />
                  ) : (
                    <View style={s.cardThumbPlaceholder}>
                      <Text style={s.cardThumbLetter}>P</Text>
                    </View>
                  )}
                  <View style={s.cardContent}>
                    <View style={s.cardTop}>
                      <Text style={s.cardFoods} numberOfLines={1}>{fav.foods}</Text>
                      <Text style={s.cardCal}>{fav.nutrition.calories}</Text>
                    </View>
                    <View style={s.cardMacros}>
                      <MacroPill label="prot" value={fav.nutrition.protein} color="#5DADE2" bg="#EBF5FB" />
                      <MacroPill label="carb" value={fav.nutrition.carbs} color={Brand.orange} bg="#FEF5E7" />
                      <MacroPill label="gord" value={fav.nutrition.fat} color="#E74C3C" bg="#FDEDEC" />
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
    </KeyboardAvoidingView>
  );
}

// ─── Sub-componente ──────────────────────────────────────

function MacroPill({ label, value, color, bg }: {
  label: string; value: string; color: string; bg: string;
}) {
  return (
    <View style={[s.pill, { backgroundColor: bg }]}>
      <Text style={[s.pillLabel, { color }]}>{label}</Text>
      <Text style={[s.pillValue, { color }]}>{value}</Text>
    </View>
  );
}

// ─── Estilos ─────────────────────────────────────────────

const THUMB_SIZE = 52;

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Brand.bg,
  },
  scroll: {
    paddingHorizontal: 28,
    paddingBottom: 120,
    paddingTop: 20,
  },

  // Header
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Brand.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: Brand.textSecondary,
    marginTop: 4,
    lineHeight: 20,
  },
  divider: {
    width: 40,
    height: 2,
    backgroundColor: Brand.border,
    borderRadius: 1,
    alignSelf: 'center',
    marginVertical: 24,
  },

  // New button
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: Brand.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Brand.green,
    borderStyle: 'dashed',
  },
  newBtnIcon: {
    fontSize: 20,
    fontWeight: '700',
    color: Brand.green,
  },
  newBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: Brand.green,
  },

  // Form
  formSection: {
    gap: 12,
  },
  stepLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Brand.green,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 2,
  },
  stepDivider: {
    width: 32,
    height: 2,
    borderRadius: 1,
    backgroundColor: Brand.border,
    alignSelf: 'center',
    marginVertical: 8,
  },

  // Ingredient chips
  chipList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Brand.card,
    borderRadius: 10,
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: Brand.border,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: Brand.text,
  },
  chipRemove: {
    fontSize: 11,
    fontWeight: '700',
    color: Brand.textSecondary,
    paddingHorizontal: 4,
  },

  // Add ingredient row
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  unitRow: {
    flexDirection: 'row',
    gap: 0,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: Brand.border,
  },
  unitBtn: {
    paddingVertical: 12,
    minWidth: 40,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Brand.card,
  },
  unitBtnActive: {
    backgroundColor: Brand.green,
  },
  unitText: {
    fontSize: 13,
    fontWeight: '600',
    color: Brand.textSecondary,
  },
  unitTextActive: {
    color: '#FFFFFF',
  },
  addIngBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Brand.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIngBtnDisabled: {
    backgroundColor: Brand.border,
  },
  addIngBtnText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: -2,
  },

  // Recalculate
  recalcBtn: {
    alignSelf: 'center',
    paddingVertical: 4,
  },
  recalcText: {
    fontSize: 13,
    fontWeight: '600',
    color: Brand.textSecondary,
  },

  formActions: {
    flexDirection: 'row',
    gap: 10,
  },

  // Photo button (in preview)
  photoBtn: {
    width: 72,
    height: 72,
    borderRadius: 14,
    overflow: 'hidden',
  },
  photoImg: {
    width: 72,
    height: 72,
    borderRadius: 14,
  },
  photoPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 14,
    backgroundColor: Brand.card,
    borderWidth: 1.5,
    borderColor: Brand.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoHint: {
    fontSize: 10,
    fontWeight: '700',
    color: Brand.textSecondary,
    letterSpacing: 1,
  },

  // Edit photo row
  editPhotoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 4,
  },
  editPhotoBtn: {
    width: 56,
    height: 56,
    borderRadius: 12,
    overflow: 'hidden',
  },
  editPhotoImg: {
    width: 56,
    height: 56,
    borderRadius: 12,
  },
  editPhotoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: Brand.bg,
    borderWidth: 1.5,
    borderColor: Brand.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editPhotoText: {
    fontSize: 9,
    fontWeight: '700',
    color: Brand.textSecondary,
    letterSpacing: 1,
  },
  editPhotoLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Brand.green,
  },

  // Preview card
  previewCard: {
    backgroundColor: Brand.card,
    borderRadius: 16,
    padding: 18,
    gap: 14,
  },
  previewHeader: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  previewInfo: {
    flex: 1,
    gap: 8,
  },
  previewCal: {
    fontSize: 20,
    fontWeight: '700',
    color: Brand.greenDark,
  },
  previewMacros: {
    flexDirection: 'row',
    gap: 6,
  },

  // Section title
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Brand.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 12,
    textTransform: 'uppercase',
  },

  // Empty
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Brand.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyIconLetter: {
    fontSize: 18,
    fontWeight: '800',
    color: Brand.textSecondary,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Brand.text,
  },
  hint: {
    fontSize: 13,
    color: Brand.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Error
  errorBox: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#FFF0F0',
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  errorText: {
    fontSize: 14,
    color: Brand.danger,
    textAlign: 'center',
  },

  // List
  list: {
    gap: 8,
  },

  // Card with thumbnail
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Brand.card,
    borderRadius: 14,
    overflow: 'hidden',
    paddingLeft: 12,
    paddingVertical: 10,
  },
  cardThumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 10,
  },
  cardThumbPlaceholder: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 10,
    backgroundColor: Brand.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardThumbLetter: {
    fontSize: 16,
    fontWeight: '800',
    color: Brand.textSecondary,
  },
  cardContent: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 14,
    gap: 4,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardFoods: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: Brand.text,
    marginRight: 12,
  },
  cardCal: {
    fontSize: 13,
    fontWeight: '700',
    color: Brand.greenDark,
  },
  cardMacros: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },

  // Macro pill
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  pillLabel: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  pillValue: {
    fontSize: 11,
    fontWeight: '600',
  },
});
