/**
 * Modal para registrar refeição
 *
 * Duas opções:
 *   1. "Novo prato" — ingrediente + peso separados → calcula → nome + foto + horário + tipo → salva
 *   2. "Selecionar favorito" — lista pratos salvos → escolhe tipo + horário → salva
 *
 * Meus Pratos salva SEM tipo de refeição (tipo só na hora de registrar).
 */

import { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { AppButton } from '@/components/app-button';
import { AppInput } from '@/components/app-input';
import { DatePicker } from '@/components/date-picker';
import { MealTypeSelector } from '@/components/meal-type-selector';
import { NutritionErrorModal } from '@/components/nutrition-error-modal';
import { TimePicker } from '@/components/time-picker';
import { Brand } from '@/constants/theme';
import { useAsync } from '@/hooks/use-async';
import { pickDishImage } from '@/services/dish-images';
import { getNutrition } from '@/services/nutrition';
import type { Meal, MealType, NutritionData } from '@/types/nutrition';
import {
    buildFoodsString,
    formatIngredient,
    nowTimeStr,
    parseFoodsToIngredients,
    randomFoodExample,
    splitFoodsAndDishName,
    type Ingredient,
    type WeightUnit,
} from '@/utils/helpers';

type Props = {
  visible: boolean;
  /** Refeição a editar (modo edição). Se undefined, é modo criação. */
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
  /** Callback de edição — recebe id + dados parciais */
  onEditSave?: (id: string, params: {
    foods: string;
    mealType: MealType;
    time?: string;
    nutrition: NutritionData;
    imageBase64?: string | null;
  }) => void;
  onClose: () => void;
};

const TYPES: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner', 'supper'];
const UNITS: WeightUnit[] = ['g', 'ml', 'un'];
const THUMB = 44;

export function RegisterMealModal({
  visible,
  editMeal,
  onSave,
  onEditSave,
  onClose,
}: Props) {
  const isEditing = !!editMeal;

  // ── Estado do formulário ──
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
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [editInitialized, setEditInitialized] = useState(false);
  const nutrition = useAsync(getNutrition);

  // ── Inicializar campos quando entra em modo edição ──
  useEffect(() => {
    if (visible && editMeal && !editInitialized) {
      // Recupera dishName e ingredientes da string foods
      const { dishName: recoveredName, ingredientsRaw } = splitFoodsAndDishName(editMeal.foods);
      const parsed = parseFoodsToIngredients(ingredientsRaw);
      setIngredients(parsed);
      setDishName(recoveredName);
      setMealType(editMeal.mealType);
      setTime(editMeal.time || '');
      setUseNow(false);
      setPhotoUri(editMeal.imageUrl ?? null);
      // Pré-calcula a nutrição
      nutrition.setData(editMeal.nutrition);
      setEditInitialized(true);
    }
    if (!visible) {
      setEditInitialized(false);
    }
  }, [visible, editMeal, editInitialized]);

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
    setPhotoUri(null);
    nutrition.reset();
  }

  function handleClose() {
    reset();
    onClose();
  }

  // ── Refs ──
  const ingNameRef = useRef<import('react-native').TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);

  /** Scroll para baixo quando campo recebe foco (evita teclado cobrir) */
  function scrollToEnd() {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);
  }

  // ── Ingredientes ──
  function handleAddIngredient() {
    const name = ingName.trim();
    const weight = ingWeight.trim();
    if (!name) return;
    setIngredients((prev) => [...prev, { name, weight, unit: ingUnit }]);
    setIngName('');
    setIngWeight('');
    setIngUnit('g');
    // Ingredientes mudaram → macros ficam desatualizados
    if (nutrition.data) nutrition.reset();
  }

  function handleRemoveIngredient(index: number) {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
    // Ingredientes mudaram → macros ficam desatualizados
    if (nutrition.data) nutrition.reset();
  }

  // ── Calcular macros ──
  function handleCalculate() {
    if (ingredients.length === 0) return;
    Keyboard.dismiss();
    const foodsStr = ingredients.map(formatIngredient).join(', ');
    nutrition.execute(foodsStr);
  }

  // ── Foto ──
  function handlePickPhoto() {
    Alert.alert('Adicionar foto', undefined, [
      {
        text: 'Câmera',
        onPress: async () => {
          const uri = await pickDishImage(true);
          if (uri) setPhotoUri(uri);
        },
      },
      {
        text: 'Galeria',
        onPress: async () => {
          const uri = await pickDishImage(false);
          if (uri) setPhotoUri(uri);
        },
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  // ── Resolver data e horário ──
  function resolveDate(): string | undefined {
    if (useToday) return undefined; // backend uses today by default
    return mealDate || undefined;
  }

  function resolveTime(): string | undefined {
    if (useNow) return nowTimeStr();
    return time || undefined;
  }

  // ── Salvar (novo) ──
  function handleSaveNew() {
    if (!nutrition.data || !mealType) return;
    const foodsStr = ingredients.map(formatIngredient).join(', ');
    onSave({
      foods: foodsStr,
      mealType,
      date: resolveDate(),
      time: resolveTime(),
      nutrition: nutrition.data,
      dishName: dishName.trim() || undefined,
      imageBase64: photoUri,
    });
    reset();
  }

  // ── Salvar (edição) ──
  function handleSaveEdit() {
    if (!nutrition.data || !mealType || !editMeal || !onEditSave) return;
    const ingredientsStr = ingredients.map(formatIngredient).join(', ');
    const foodsStr = buildFoodsString(dishName, ingredientsStr);
    onEditSave(editMeal.id, {
      foods: foodsStr,
      mealType,
      time: resolveTime(),
      nutrition: nutrition.data,
      imageBase64: photoUri,
    });
    reset();
  }

  // ── Helpers ──
  const hasIngredients = ingredients.length > 0;
  const calculated = !!nutrition.data;
  const canAddIngredient = ingName.trim().length > 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={s.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}>
        {/* Spacer that pushes the sheet to the bottom + dismiss area */}
        <Pressable style={s.backdrop} onPress={handleClose} />

        {/* Sheet — sizes by content, capped at 90% screen height */}
        <View style={s.sheet}>
          {/* Handle */}
          <View style={s.handleWrap}>
            <View style={s.handle} />
          </View>

          <Text style={s.title}>{isEditing ? 'Editar refeição' : 'Registrar refeição'}</Text>

          {/* ── Scrollable content ── */}
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={s.bodyContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">

            {/* ══════════ Formulário ══════════ */}
              <View style={s.form}>

                {/* ── Step 1: Ingredientes ── */}
                <Text style={s.stepLabel}>1. Ingredientes</Text>

                {/* Lista de ingredientes adicionados */}
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

                {/* Campos para adicionar ingrediente — sempre visíveis */}
                <AppInput
                  ref={ingNameRef}
                  placeholder={ingredients.length === 0 ? foodHint : 'Adicionar ingrediente'}
                  value={ingName}
                  onChangeText={(t: string) => setIngName(t.replace(/[^a-zA-ZÀ-ÿ\s]/g, ''))}
                  maxLength={50}
                  onFocus={scrollToEnd}
                />

                <View style={s.weightRow}>
                  <View style={{ flex: 1 }}>
                    <AppInput
                      placeholder="Peso"
                      value={ingWeight}
                      onChangeText={(t: string) => setIngWeight(t.replace(/[^0-9.,]/g, ''))}
                      keyboardType="numeric"
                      maxLength={7}
                      onFocus={scrollToEnd}
                    />
                  </View>
                  {/* Unidade selector */}
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
                  {/* Botão + */}
                  <Pressable
                    style={[s.addBtn, !canAddIngredient && s.addBtnDisabled]}
                    onPress={handleAddIngredient}
                    disabled={!canAddIngredient}>
                    <Text style={s.addBtnText}>+</Text>
                  </Pressable>
                </View>

                {/* Botão calcular */}
                {hasIngredients && (
                  <AppButton
                    title={calculated ? `Recalcular macros (${ingredients.length} ${ingredients.length === 1 ? 'item' : 'itens'})` : `Calcular macros (${ingredients.length} ${ingredients.length === 1 ? 'item' : 'itens'})`}
                    onPress={handleCalculate}
                    loading={nutrition.loading}
                  />
                )}

                {nutrition.error && (
                  <NutritionErrorModal
                    visible={!!nutrition.error}
                    message={nutrition.error}
                    onClose={() => nutrition.reset()}
                  />
                )}

                {/* ── Step 2: Resultado ── */}
                {calculated && (
                  <>
                    <View style={s.divider} />
                    <Text style={s.stepLabel}>2. Resultado</Text>

                    <View style={s.preview}>
                      <Text style={s.previewCal}>{nutrition.data!.calories}</Text>
                      <View style={s.previewMacros}>
                        <MacroPill label="prot" value={nutrition.data!.protein} color="#5DADE2" bg="#EBF5FB" />
                        <MacroPill label="carb" value={nutrition.data!.carbs} color={Brand.orange} bg="#FEF5E7" />
                        <MacroPill label="gord" value={nutrition.data!.fat} color="#E74C3C" bg="#FDEDEC" />
                      </View>
                    </View>



                    {/* ── Step 3: Detalhes ── */}
                    <View style={s.divider} />
                    <Text style={s.stepLabel}>3. Detalhes</Text>

                    {/* Nome + foto */}
                    <View style={s.namePhotoRow}>
                      <Pressable style={s.photoBtn} onPress={handlePickPhoto}>
                        {photoUri ? (
                          <Image source={{ uri: photoUri }} style={s.photoImg} />
                        ) : (
                          <View style={s.photoPlaceholder}>
                            <Text style={s.photoHint}>FOTO</Text>
                          </View>
                        )}
                      </Pressable>
                      <View style={{ flex: 1 }}>
                        <AppInput
                          placeholder="Nome do prato (opcional)"
                          value={dishName}
                          onChangeText={setDishName}
                          onFocus={scrollToEnd}
                        />
                      </View>
                    </View>

                    {/* Data */}
                    {/* Data (oculta em edição — use "Mover" para trocar data) */}
                    {!isEditing && (
                      <>
                        <Text style={s.label}>Data</Text>
                        <DatePicker
                          value={mealDate}
                          useToday={useToday}
                          onChangeDate={setMealDate}
                          onToggleToday={setUseToday}
                        />
                      </>
                    )}

                    {/* Horário */}
                    <Text style={s.label}>Horário</Text>
                    <TimePicker
                      value={time}
                      useNow={useNow}
                      onChangeTime={setTime}
                      onToggleNow={setUseNow}
                    />

                    {/* Tipo de refeição */}
                    <Text style={s.label}>Tipo de refeição</Text>
                    <MealTypeSelector selected={mealType} onSelect={setMealType} />

                  </>
                )}

                {/* ── Botões (dentro do scroll) ── */}
                {calculated ? (
                  <View style={s.actionRow}>
                    <View style={{ flex: 2 }}>
                      <AppButton
                        title={isEditing ? 'Salvar alterações' : 'Salvar refeição'}
                        onPress={isEditing ? handleSaveEdit : handleSaveNew}
                        disabled={!mealType}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <AppButton title="Cancelar" onPress={handleClose} variant="secondary" />
                    </View>
                  </View>
                ) : (
                  <View style={{ marginTop: 8 }}>
                    <AppButton title="Cancelar" onPress={handleClose} variant="secondary" />
                  </View>
                )}
              </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
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

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    backgroundColor: Brand.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 32 : 20,
    maxHeight: '90%',
  },
  handleWrap: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Brand.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Brand.text,
    letterSpacing: -0.3,
    marginBottom: 12,
  },

  // Tabs
  tabs: {
    flexDirection: 'row',
    backgroundColor: Brand.card,
    borderRadius: 12,
    padding: 3,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: Brand.green,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: Brand.textSecondary,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },

  // Body
  bodyContent: {
    paddingBottom: 16,
  },

  // Form
  form: {
    gap: 10,
  },
  stepLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Brand.green,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Brand.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  divider: {
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

  // Weight row
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

  // Add ingredient button
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Brand.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnDisabled: {
    backgroundColor: Brand.border,
  },
  addBtnText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: -2,
  },

  // Preview
  preview: {
    backgroundColor: Brand.card,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    gap: 12,
  },
  previewCal: {
    fontSize: 22,
    fontWeight: '700',
    color: Brand.greenDark,
  },
  previewMacros: {
    flexDirection: 'row',
    gap: 8,
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

  // Name + photo row
  namePhotoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  photoBtn: {
    width: 64,
    height: 64,
    borderRadius: 14,
    overflow: 'hidden',
  },
  photoImg: {
    width: 64,
    height: 64,
    borderRadius: 14,
  },
  photoPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: Brand.card,
    borderWidth: 1.5,
    borderColor: Brand.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoHint: {
    fontSize: 9,
    fontWeight: '700',
    color: Brand.textSecondary,
    letterSpacing: 1,
  },

  // Checkbox
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Brand.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: Brand.green,
    borderColor: Brand.green,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  checkLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Brand.text,
  },

  // Action row (inside scroll)
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },

  // Error
  errorBox: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFF0F0',
    borderRadius: 12,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 13,
    color: Brand.danger,
    textAlign: 'center',
  },

  // Favorites list
  favList: {
    gap: 8,
  },
  favItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Brand.card,
    borderRadius: 14,
    paddingLeft: 12,
    paddingVertical: 10,
  },
  favItemPressed: {
    opacity: 0.7,
  },
  favThumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: 10,
  },
  favThumbPlaceholder: {
    width: THUMB,
    height: THUMB,
    borderRadius: 10,
    backgroundColor: Brand.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favThumbLetter: {
    fontSize: 14,
    fontWeight: '800',
    color: Brand.textSecondary,
  },
  favContent: {
    flex: 1,
    paddingHorizontal: 12,
    gap: 4,
  },
  favTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  favFoods: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: Brand.text,
    marginRight: 12,
  },
  favCal: {
    fontSize: 13,
    fontWeight: '700',
    color: Brand.greenDark,
  },
  favMacros: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
  },

  // Empty
  empty: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Brand.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyIconLetter: {
    fontSize: 16,
    fontWeight: '800',
    color: Brand.textSecondary,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Brand.text,
  },
  emptyHint: {
    fontSize: 13,
    color: Brand.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },

  // Macro pill
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pillLabel: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  pillValue: {
    fontSize: 12,
    fontWeight: '600',
  },
});
