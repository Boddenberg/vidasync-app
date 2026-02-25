/**
 * Tela Início (Home)
 *
 * Dividida em duas áreas:
 *   1. Consultar Calorias — campo simples para calcular macros
 *   2. Meu Dia — panorama + refeições + botão para registrar (abre modal)
 */

import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Image,
  Keyboard,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { AppInput } from '@/components/app-input';
import { EditProfileModal } from '@/components/edit-profile-modal';
import { MealCard } from '@/components/meal-card';
import { NutritionIllustration } from '@/components/nutrition-illustration';
import { QuickAddSheet } from '@/components/quick-add-sheet';
import { RegisterMealModal } from '@/components/register-meal-modal';
import { Brand } from '@/constants/theme';
import { useAsync } from '@/hooks/use-async';
import { useAuth } from '@/hooks/use-auth';
import { useFavorites } from '@/hooks/use-favorites';
import { useMeals } from '@/hooks/use-meals';
import { getNutrition } from '@/services/nutrition';
import type { Favorite, Meal, MealType, NutritionData } from '@/types/nutrition';
import { buildFoodsString, DIAS_SEMANA, extractNum, MONTHS_SHORT } from '@/utils/helpers';

// ─── helpers ─────────────────────────────────────────────

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function todayLabel(): string {
  const d = new Date();
  return `${DIAS_SEMANA[d.getDay()]}, ${d.getDate()} de ${MONTHS_SHORT[d.getMonth()]}`;
}

// ─── componente ──────────────────────────────────────────
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [registerVisible, setRegisterVisible] = useState(false);
  const [profileVisible, setProfileVisible] = useState(false);
  const [quickAddVisible, setQuickAddVisible] = useState(false);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);

  // Consultar calorias
  const [query, setQuery] = useState('');
  const [queryWeight, setQueryWeight] = useState('');
  const [queryUnit, setQueryUnit] = useState<'g' | 'ml' | 'un'>('g');
  const nutrition = useAsync(getNutrition);
  const UNITS: Array<'g' | 'ml' | 'un'> = ['g', 'ml', 'un'];

  const { meals, totals, add, edit, remove, duplicate, refresh } = useMeals();
  const { favorites, refresh: refreshFavorites } = useFavorites();

  // Recarrega refeições e favoritos sempre que a aba ganha foco
  useFocusEffect(
    useCallback(() => {
      refresh();
      refreshFavorites();
    }, [refresh, refreshFavorites]),
  );

  function handleQuery() {
    const name = query.trim();
    if (!name) return;
    Keyboard.dismiss();
    const w = queryWeight.trim();
    const text = w ? `${w}${queryUnit} de ${name}` : name;
    nutrition.execute(text);
  }

  function handleClearQuery() {
    setQuery('');
    setQueryWeight('');
    setQueryUnit('g');
    nutrition.reset();
  }

  // ── Salvar via modal "Novo prato" ──
  async function handleSaveNew(params: {
    foods: string;
    mealType: MealType;
    date?: string;
    time?: string;
    nutrition: NutritionData;
    dishName?: string;
    imageBase64?: string | null;
  }) {
    const foodsWithName = buildFoodsString(params.dishName, params.foods);
    await add(foodsWithName, params.mealType, params.nutrition, params.time, params.date, params.imageBase64);
    setRegisterVisible(false);
  }

  function handleEdit(meal: Meal) {
    setEditingMeal(meal);
    setRegisterVisible(true);
  }

  // ── Salvar edição via modal ──
  async function handleEditSave(id: string, params: {
    foods: string;
    mealType: MealType;
    time?: string;
    nutrition: NutritionData;
    imageBase64?: string | null;
  }) {
    const { imageBase64, ...mealParams } = params;
    await edit(id, { ...mealParams, ...(imageBase64 ? { image: imageBase64 } : {}) });
    setEditingMeal(null);
    setRegisterVisible(false);
    refresh();
  }

  // ── Lançar prato salvo (Quick Add) ──
  async function handleQuickAdd(fav: Favorite, mealType: MealType) {
    await add(fav.foods, mealType, fav.nutrition, undefined, undefined, fav.imageUrl);
    setQuickAddVisible(false);
  }

  // ── Totais do dia ──
  const cal = totals ? Math.round(extractNum(totals.calories)) : 0;
  const prot = totals ? Math.round(extractNum(totals.protein)) : 0;
  const carb = totals ? Math.round(extractNum(totals.carbs)) : 0;
  const fat = totals ? Math.round(extractNum(totals.fat)) : 0;

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={Brand.bg} />

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        {/* ── Header ── */}
        <View style={s.header}>
          <Pressable
            style={s.headerLeft}
            onPress={() => setProfileVisible(true)}>
            {user?.profileImageUrl ? (
              <Image source={{ uri: user.profileImageUrl }} style={s.avatar} />
            ) : (
              <View style={s.avatarPlaceholder}>
                <Text style={s.avatarLetter}>
                  {(user?.username ?? 'V').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View>
              <Text style={s.greeting}>{greeting()}{user ? `, ${user.username}` : ''}</Text>
              <Text style={s.dateLabel}>{todayLabel()}</Text>
            </View>
          </Pressable>
          <View style={s.logoWrap}>
            <NutritionIllustration size={40} />
          </View>
        </View>

        {/* ════════════════════════════════════════════════ */}
        {/* ── 1. Consultar Calorias ──                     */}
        {/* ════════════════════════════════════════════════ */}
        <View style={s.card}>
          <View style={s.cardTitleRow}>
            <View style={s.cardIcon}>
              <Text style={s.cardIconText}>C</Text>
            </View>
            <Text style={s.cardTitle}>Consultar calorias</Text>
          </View>
          <Text style={s.cardHint}>Digite um alimento para saber os macros</Text>

          <AppInput
            placeholder="Alimento (ex: arroz branco)"
            value={query}
            onChangeText={(t: string) => setQuery(t.replace(/[^a-zA-ZÀ-ÿ\s]/g, ''))}
            maxLength={50}
          />

          <View style={s.queryWeightRow}>
            <View style={{ flex: 1 }}>
              <AppInput
                placeholder="Peso"
                value={queryWeight}
                onChangeText={(t: string) => setQueryWeight(t.replace(/[^0-9.,]/g, ''))}
                keyboardType="numeric"
                maxLength={7}
              />
            </View>
            <View style={s.queryUnitRow}>
              {UNITS.map((u) => (
                <Pressable
                  key={u}
                  style={[s.queryUnitBtn, queryUnit === u && s.queryUnitBtnActive]}
                  onPress={() => setQueryUnit(u)}>
                  <Text style={[s.queryUnitText, queryUnit === u && s.queryUnitTextActive]}>{u}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <AppButton
            title="Consultar"
            onPress={handleQuery}
            loading={nutrition.loading}
            disabled={!query.trim()}
          />

          {/* Resultado */}
          {nutrition.data && (
            <View style={s.resultBox}>
              <Text style={s.resultCal}>{nutrition.data.calories}</Text>
              <View style={s.resultMacros}>
                <MacroPill label="prot" value={nutrition.data.protein} color="#5DADE2" bg="#EBF5FB" />
                <MacroPill label="carb" value={nutrition.data.carbs} color={Brand.orange} bg="#FEF5E7" />
                <MacroPill label="gord" value={nutrition.data.fat} color="#E74C3C" bg="#FDEDEC" />
              </View>
              <Pressable onPress={handleClearQuery}>
                <Text style={s.resultClear}>Limpar</Text>
              </Pressable>
            </View>
          )}

          {nutrition.error && (
            <View style={s.errorBox}>
              <Text style={s.errorText}>{nutrition.error}</Text>
            </View>
          )}
        </View>

        {/* ════════════════════════════════════════════════ */}
        {/* ── 2. Meu Dia ──                                */}
        {/* ════════════════════════════════════════════════ */}
        <View style={s.card}>
          <View style={s.cardTitleRow}>
            <View style={s.cardIcon}>
              <Text style={s.cardIconText}>D</Text>
            </View>
            <Text style={s.cardTitle}>Meu dia</Text>
          </View>

          {/* Panorama */}
          <View style={s.panorama}>
            <View style={s.calRow}>
              <Text style={s.calValue}>{cal}</Text>
              <Text style={s.calUnit}>kcal</Text>
            </View>
            <View style={s.macroBarRow}>
              <MacroBar label="Proteína" value={prot} unit="g" color="#5DADE2" bg="#EBF5FB" />
              <MacroBar label="Carbo" value={carb} unit="g" color={Brand.orange} bg="#FEF5E7" />
              <MacroBar label="Gordura" value={fat} unit="g" color="#E74C3C" bg="#FDEDEC" />
            </View>
          </View>

          {/* Botões de ação */}
          <View style={s.actionRow}>
            <Pressable
              style={[s.registerBtn, { flex: 1 }]}
              onPress={() => setRegisterVisible(true)}>
              <Text style={s.registerBtnIcon}>+</Text>
              <Text style={s.registerBtnText}>Nova refeição</Text>
            </Pressable>

            {favorites.length > 0 && (
              <Pressable
                style={s.quickAddBtn}
                onPress={() => setQuickAddVisible(true)}>
                <Text style={s.quickAddBtnIcon}>★</Text>
                <Text style={s.quickAddBtnText}>Meus Pratos</Text>
              </Pressable>
            )}
          </View>

          {/* Lista de refeições */}
          {meals.length > 0 && (
            <View style={s.mealsList}>
              <Text style={s.mealsTitle}>
                {meals.length} {meals.length === 1 ? 'refeição' : 'refeições'}
              </Text>
              {[...meals].sort((a, b) => {
                const tA = a.time || '';
                const tB = b.time || '';
                return tB.localeCompare(tA);
              }).map((meal) => (
                <MealCard
                  key={meal.id}
                  meal={meal}
                  onEdit={handleEdit}
                  onDuplicate={duplicate}
                  onDelete={remove}
                />
              ))}
            </View>
          )}

          {meals.length === 0 && (
            <Text style={s.emptyHint}>
              Nenhuma refeição registrada hoje.{'\n'}Toque em "+ Nova refeição" para começar.
            </Text>
          )}
        </View>
      </ScrollView>

      {/* ── Modal de registro / edição ── */}
      <RegisterMealModal
        visible={registerVisible}
        editMeal={editingMeal}
        onSave={handleSaveNew}
        onEditSave={handleEditSave}
        onClose={() => {
          setEditingMeal(null);
          setRegisterVisible(false);
        }}
      />

      {/* ── Modal de perfil ── */}
      <EditProfileModal
        visible={profileVisible}
        onClose={() => setProfileVisible(false)}
      />

      {/* ── Sheet de lançamento rápido (Meus Pratos) ── */}
      <QuickAddSheet
        visible={quickAddVisible}
        favorites={favorites}
        onSelect={handleQuickAdd}
        onClose={() => setQuickAddVisible(false)}
      />
    </View>
  );
}

// ─── Sub-componentes ─────────────────────────────────────

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

function MacroBar({ label, value, unit, color, bg }: {
  label: string; value: number; unit: string; color: string; bg: string;
}) {
  return (
    <View style={[s.macroBar, { backgroundColor: bg }]}>
      <Text style={[s.macroBarValue, { color }]}>{value}{unit}</Text>
      <Text style={s.macroBarLabel}>{label}</Text>
    </View>
  );
}

// ─── Estilos ─────────────────────────────────────────────

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Brand.bg,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 48,
    paddingTop: 16,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  avatarPlaceholder: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Brand.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  greeting: {
    fontSize: 18,
    fontWeight: '700',
    color: Brand.text,
    letterSpacing: -0.3,
  },
  dateLabel: {
    fontSize: 12,
    color: Brand.textSecondary,
    marginTop: 1,
  },
  logoWrap: {
    opacity: 0.8,
  },

  // Cards
  card: {
    backgroundColor: Brand.card,
    borderRadius: 20,
    padding: 20,
    gap: 12,
    marginBottom: 16,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Brand.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Brand.text,
    letterSpacing: -0.2,
  },
  cardHint: {
    fontSize: 12,
    color: Brand.textSecondary,
    marginTop: -4,
    marginBottom: 4,
  },

  // Query structured fields
  queryWeightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  queryUnitRow: {
    flexDirection: 'row',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: Brand.border,
  },
  queryUnitBtn: {
    paddingVertical: 12,
    minWidth: 40,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Brand.card,
  },
  queryUnitBtnActive: {
    backgroundColor: Brand.green,
  },
  queryUnitText: {
    fontSize: 13,
    fontWeight: '600',
    color: Brand.textSecondary,
  },
  queryUnitTextActive: {
    color: '#FFFFFF',
  },

  // Consultar resultado
  resultBox: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    backgroundColor: Brand.bg,
    borderRadius: 14,
    padding: 16,
  },
  resultCal: {
    fontSize: 24,
    fontWeight: '700',
    color: Brand.greenDark,
  },
  resultMacros: {
    flexDirection: 'row',
    gap: 8,
  },
  resultClear: {
    fontSize: 13,
    fontWeight: '600',
    color: Brand.textSecondary,
    marginTop: 4,
  },

  // Panorama
  panorama: {
    gap: 12,
  },
  calRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  calValue: {
    fontSize: 38,
    fontWeight: '700',
    color: Brand.greenDark,
    letterSpacing: -1,
  },
  calUnit: {
    fontSize: 15,
    fontWeight: '600',
    color: Brand.textSecondary,
  },
  macroBarRow: {
    flexDirection: 'row',
    gap: 8,
  },
  macroBar: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
    gap: 2,
  },
  macroBarValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  macroBarLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: Brand.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  // Action row
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },

  // Register button
  registerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Brand.green,
  },
  registerBtnIcon: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  registerBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Quick add button
  quickAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: Brand.card,
    borderWidth: 1.5,
    borderColor: Brand.green,
  },
  quickAddBtnIcon: {
    fontSize: 16,
    color: Brand.greenDark,
  },
  quickAddBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Brand.greenDark,
  },

  // Meals list
  mealsList: {
    gap: 8,
  },
  mealsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Brand.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Empty
  emptyHint: {
    fontSize: 13,
    color: Brand.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingVertical: 8,
  },

  // Macro pill
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 9,
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
});
