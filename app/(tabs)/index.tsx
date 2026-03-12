import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Keyboard,
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
import { EditProfileModal } from '@/components/edit-profile-modal';
import { BmiCalculatorCard } from '@/components/health/bmi-calculator-card';
import { MealCard } from '@/components/meal-card';
import { AudioNutritionAnalyzer } from '@/components/nutrition/audio-nutrition-analyzer';
import { PdfPlanAnalyzer } from '@/components/nutrition/pdf-plan-analyzer';
import { PhotoNutritionAnalyzer } from '@/components/nutrition/photo-nutrition-analyzer';
import { NutritionErrorModal } from '@/components/nutrition-error-modal';
import { NutritionIllustration } from '@/components/nutrition-illustration';
import { QuickAddSheet } from '@/components/quick-add-sheet';
import { RegisterMealModal } from '@/components/register-meal-modal';
import { Brand, Radii, Shadows, Spacing, Typography } from '@/constants/theme';
import { useAsync } from '@/hooks/use-async';
import { useAuth } from '@/hooks/use-auth';
import { useFavorites } from '@/hooks/use-favorites';
import { useMeals } from '@/hooks/use-meals';
import { getMealsByRange } from '@/services/meals';
import { getNutrition } from '@/services/nutrition';
import { setReviewSession } from '@/services/review-session';
import { getWaterStatus, saveWaterStatus, type WaterStatus } from '@/services/water';
import type { AttachmentItem } from '@/types/attachments';
import type { Favorite, Meal, MealType, NutritionAnalysisResult, NutritionData } from '@/types/nutrition';
import type { PlanPdfAnalysisResult } from '@/types/plan';
import { buildFoodsString, extractNum, toDateStr } from '@/utils/helpers';

type AnalyzerTab = 'photo' | 'audio' | 'plan';
type WeeklySnapshot = {
  avgCalories: number;
  avgProtein: number;
  daysWithMeals: number;
};

const DAILY_GOAL_KCAL = 2000;
const DEFAULT_HYDRATION_GOAL_ML = 2500;
const DAILY_MACRO_GOALS = {
  protein: 160,
  carbs: 180,
  fat: 60,
} as const;

const FOOD_CATEGORIES = [
  { id: 'frutas', label: 'Frutas', icon: 'nutrition-outline', tint: '#EAF8EE', query: 'banana' },
  { id: 'carnes', label: 'Carnes', icon: 'barbell-outline', tint: '#FFF0EB', query: 'frango grelhado' },
  { id: 'laticinios', label: 'Laticinios', icon: 'cafe-outline', tint: '#EEF4FF', query: 'iogurte natural' },
  { id: 'vegetais', label: 'Vegetais', icon: 'leaf-outline', tint: '#EAF7EA', query: 'brocolis cozido' },
  { id: 'graos', label: 'Graos', icon: 'flower-outline', tint: '#FFF6E1', query: 'arroz integral' },
  { id: 'snacks', label: 'Snacks', icon: 'fast-food-outline', tint: '#F8EFE4', query: 'mix de castanhas' },
] as const;

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

function todayLabel(): string {
  const now = new Date();
  const weekdayRaw = now.toLocaleDateString('pt-BR', { weekday: 'long' });
  const monthRaw = now.toLocaleDateString('pt-BR', { month: 'long' });
  const weekday = weekdayRaw.charAt(0).toUpperCase() + weekdayRaw.slice(1);
  return `${weekday}, ${now.getDate()} de ${monthRaw}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function calculateNutritionScore(proteinG: number, carbsG: number, fatG: number, calories: number): number {
  const proteinKcal = proteinG * 4;
  const carbsKcal = carbsG * 4;
  const fatKcal = fatG * 9;
  const totalMacroKcal = proteinKcal + carbsKcal + fatKcal;

  if (totalMacroKcal <= 0) return 0;

  const proteinRatio = proteinKcal / totalMacroKcal;
  const carbsRatio = carbsKcal / totalMacroKcal;
  const fatRatio = fatKcal / totalMacroKcal;

  const deviation =
    Math.abs(proteinRatio - 0.3) + Math.abs(carbsRatio - 0.45) + Math.abs(fatRatio - 0.25);

  const macroScore = clamp(Math.round(100 - deviation * 130), 0, 100);
  const completionBonus = clamp(Math.round(Math.min(calories / DAILY_GOAL_KCAL, 1) * 20), 0, 20);

  return clamp(macroScore * 0.8 + completionBonus, 0, 100);
}

function formatLiters(valueMl: number): string {
  return `${(valueMl / 1000).toFixed(1)}L`;
}

function macroGoalProgress(consumed: number, goal: number): number {
  if (goal <= 0) return 0;
  return clamp(consumed / goal, 0, 1);
}

function insightMessage(params: {
  mealsCount: number;
  proteinRemaining: number;
  hydrationRemainingMl: number;
  caloriesRemaining: number;
}): string {
  if (params.mealsCount === 0) {
    return 'Registre a primeira refeicao do dia para liberar recomendacoes inteligentes.';
  }

  if (params.proteinRemaining >= 25) {
    return `Proteina abaixo da meta: faltam ${params.proteinRemaining}g para fechar o dia.`;
  }

  if (params.hydrationRemainingMl >= 400) {
    return `Hidratacao em alerta: faltam ${params.hydrationRemainingMl}ml para a meta.`;
  }

  if (params.caloriesRemaining >= 450) {
    return `Voce ainda tem ${params.caloriesRemaining} kcal disponiveis para completar a meta.`;
  }

  return 'Dia consistente: mantenha refeicoes equilibradas e hidratacao ativa.';
}

function mealSuggestions(params: {
  proteinRemaining: number;
  carbsRemaining: number;
  fatRemaining: number;
  caloriesRemaining: number;
}): string[] {
  const suggestions: string[] = [];

  if (params.proteinRemaining >= 25) {
    suggestions.push('Omelete com queijo cottage');
    suggestions.push('Frango grelhado com salada');
  }

  if (params.carbsRemaining >= 35) {
    suggestions.push('Arroz integral com legumes');
  }

  if (params.fatRemaining >= 12) {
    suggestions.push('Iogurte natural com castanhas');
  }

  if (params.caloriesRemaining <= 300) {
    suggestions.push('Iogurte proteico com frutas');
  }

  if (suggestions.length === 0) {
    suggestions.push('Meta quase concluida: finalize com uma refeicao leve.');
  }

  return suggestions.slice(0, 3);
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const router = useRouter();

  const [registerVisible, setRegisterVisible] = useState(false);
  const [profileVisible, setProfileVisible] = useState(false);
  const [quickAddVisible, setQuickAddVisible] = useState(false);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [photoAttachments, setPhotoAttachments] = useState<AttachmentItem[]>([]);
  const [planPdfAttachments, setPlanPdfAttachments] = useState<AttachmentItem[]>([]);
  const [analyzerTab, setAnalyzerTab] = useState<AnalyzerTab>('photo');
  const [hydrationMl, setHydrationMl] = useState(0);
  const [hydrationGoalMl, setHydrationGoalMl] = useState(DEFAULT_HYDRATION_GOAL_ML);
  const [hydrationLoading, setHydrationLoading] = useState(false);
  const [hydrationSaving, setHydrationSaving] = useState(false);
  const [hydrationError, setHydrationError] = useState<string | null>(null);
  const [weeklySnapshot, setWeeklySnapshot] = useState<WeeklySnapshot | null>(null);
  const [weeklyLoading, setWeeklyLoading] = useState(false);

  const [query, setQuery] = useState('');
  const [queryWeight, setQueryWeight] = useState('');
  const [queryUnit, setQueryUnit] = useState<'g' | 'ml' | 'un'>('g');
  const queryInputRef = useRef<TextInput>(null);

  const nutrition = useAsync(getNutrition);
  const UNITS: ('g' | 'ml' | 'un')[] = ['g', 'ml', 'un'];

  const { meals, totals, add, edit, remove, duplicate, refresh } = useMeals();
  const { favorites, refresh: refreshFavorites } = useFavorites();

  const dayProgressAnim = useRef(new Animated.Value(0)).current;
  const hydrationProgressAnim = useRef(new Animated.Value(0)).current;
  const hydrationPulse = useRef(new Animated.Value(0)).current;

  const applyHydrationState = useCallback((water: WaterStatus | null) => {
    if (!water) {
      setHydrationMl(0);
      setHydrationGoalMl(DEFAULT_HYDRATION_GOAL_ML);
      return;
    }

    setHydrationMl(Math.max(0, water.consumedMl));
    setHydrationGoalMl(water.goalMl > 0 ? water.goalMl : DEFAULT_HYDRATION_GOAL_ML);
  }, []);

  const loadHydration = useCallback(async () => {
    setHydrationLoading(true);
    try {
      const water = await getWaterStatus();
      applyHydrationState(water);
      setHydrationError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao carregar agua do dia.';
      setHydrationError(message);
    } finally {
      setHydrationLoading(false);
    }
  }, [applyHydrationState]);

  useFocusEffect(
    useCallback(() => {
      refresh();
      refreshFavorites();
      loadHydration();
    }, [loadHydration, refresh, refreshFavorites]),
  );

  useEffect(() => {
    let active = true;

    async function loadWeeklySnapshot() {
      setWeeklyLoading(true);
      try {
        const end = new Date();
        const start = new Date(end);
        start.setDate(end.getDate() - 6);

        const mealsInWeek = await getMealsByRange(toDateStr(start), toDateStr(end));
        const totalsByDate = new Map<string, { calories: number; protein: number }>();

        mealsInWeek.forEach((meal) => {
          const current = totalsByDate.get(meal.date) ?? { calories: 0, protein: 0 };
          current.calories += extractNum(meal.nutrition?.calories ?? '0');
          current.protein += extractNum(meal.nutrition?.protein ?? '0');
          totalsByDate.set(meal.date, current);
        });

        const daysWithMeals = totalsByDate.size;
        const totals = Array.from(totalsByDate.values());
        const sumCalories = totals.reduce((acc, day) => acc + day.calories, 0);
        const sumProtein = totals.reduce((acc, day) => acc + day.protein, 0);

        if (!active) return;

        setWeeklySnapshot({
          avgCalories: daysWithMeals > 0 ? Math.round(sumCalories / daysWithMeals) : 0,
          avgProtein: daysWithMeals > 0 ? Math.round(sumProtein / daysWithMeals) : 0,
          daysWithMeals,
        });
      } catch {
        if (!active) return;
        setWeeklySnapshot(null);
      } finally {
        if (active) {
          setWeeklyLoading(false);
        }
      }
    }

    loadWeeklySnapshot();

    return () => {
      active = false;
    };
  }, [meals.length]);

  function handleQuery() {
    const name = query.trim();
    if (!name) return;
    Keyboard.dismiss();
    const weight = queryWeight.trim();
    const text = weight ? `${weight}${queryUnit} de ${name}` : name;
    nutrition.execute(text);
  }

  function handleClearQuery() {
    setQuery('');
    setQueryWeight('');
    setQueryUnit('g');
    nutrition.reset();
  }

  function handleNutritionNeedsReview(
    source: 'photo' | 'audio',
    result: NutritionAnalysisResult,
    payload?: { photoPreviewUri?: string | null; photoPayload?: string | null },
  ) {
    setReviewSession({
      kind: 'nutrition',
      source,
      createdAt: new Date().toISOString(),
      result,
      photoPreviewUri: payload?.photoPreviewUri ?? null,
      photoPayload: payload?.photoPayload ?? null,
    });
    router.push('/review/assistida' as any);
  }

  function handlePlanPdfNeedsReview(result: PlanPdfAnalysisResult) {
    setReviewSession({
      kind: 'plan',
      source: 'pdf',
      createdAt: new Date().toISOString(),
      result,
    });
    router.push('/review/assistida' as any);
  }

  function handleOpenBmiQuickAction() {
    router.push('/tools/imc' as any);
  }
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

  async function handleEditSave(
    id: string,
    params: {
      foods: string;
      mealType: MealType;
      time?: string;
      nutrition: NutritionData;
      imageBase64?: string | null;
    },
  ) {
    const { imageBase64, ...mealParams } = params;
    await edit(id, { ...mealParams, ...(imageBase64 ? { image: imageBase64 } : {}) });
    setEditingMeal(null);
    setRegisterVisible(false);
    refresh();
  }

  async function handleQuickAdd(fav: Favorite, mealType: MealType) {
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
    await add(fav.foods, mealType, fav.nutrition, undefined, undefined, imageBase64);
    setQuickAddVisible(false);
  }

  function handleOpenMyDishes() {
    if (favorites.length > 0) {
      setQuickAddVisible(true);
      return;
    }
    router.push('/(tabs)/explore' as any);
  }

  function runHydrationPulse() {
    Animated.sequence([
      Animated.timing(hydrationPulse, {
        toValue: 1,
        duration: 130,
        useNativeDriver: true,
      }),
      Animated.timing(hydrationPulse, {
        toValue: 0,
        duration: 190,
        useNativeDriver: true,
      }),
    ]).start();
  }

  async function sendHydrationUpdate(params: { deltaMl?: number; goalMl?: number }) {
    if (hydrationSaving) return;

    setHydrationSaving(true);
    try {
      const water = await saveWaterStatus(params);
      applyHydrationState(water);
      setHydrationError(null);

      if (typeof params.deltaMl === 'number' && params.deltaMl !== 0) {
        runHydrationPulse();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao atualizar hidratacao.';
      setHydrationError(message);
    } finally {
      setHydrationSaving(false);
    }
  }

  function addHydration(deltaMl: number) {
    void sendHydrationUpdate({ deltaMl });
  }

  function setHydrationGoal(goalMl: number) {
    void sendHydrationUpdate({ goalMl });
  }

  const cal = totals ? Math.round(extractNum(totals.calories)) : 0;
  const prot = totals ? Math.round(extractNum(totals.protein)) : 0;
  const carb = totals ? Math.round(extractNum(totals.carbs)) : 0;
  const fat = totals ? Math.round(extractNum(totals.fat)) : 0;
  const progress = clamp(cal / DAILY_GOAL_KCAL, 0, 1);
  const score = calculateNutritionScore(prot, carb, fat, cal);
  const activeHydrationGoalMl = hydrationGoalMl > 0 ? hydrationGoalMl : DEFAULT_HYDRATION_GOAL_ML;
  const hydrationProgress = clamp(hydrationMl / activeHydrationGoalMl, 0, 1);
  const sortedMeals = [...meals].sort((a, b) => (b.time ?? '').localeCompare(a.time ?? ''));
  const macros = [
    {
      id: 'protein',
      label: 'Proteina',
      consumed: prot,
      goal: DAILY_MACRO_GOALS.protein,
      color: Brand.macroProtein,
      bg: Brand.macroProteinBg,
    },
    {
      id: 'carbs',
      label: 'Carboidrato',
      consumed: carb,
      goal: DAILY_MACRO_GOALS.carbs,
      color: Brand.macroCarb,
      bg: Brand.macroCarbBg,
    },
    {
      id: 'fat',
      label: 'Gordura',
      consumed: fat,
      goal: DAILY_MACRO_GOALS.fat,
      color: Brand.macroFat,
      bg: Brand.macroFatBg,
    },
  ] as const;

  const proteinRemaining = Math.max(0, DAILY_MACRO_GOALS.protein - prot);
  const carbsRemaining = Math.max(0, DAILY_MACRO_GOALS.carbs - carb);
  const fatRemaining = Math.max(0, DAILY_MACRO_GOALS.fat - fat);
  const caloriesRemaining = Math.max(0, DAILY_GOAL_KCAL - cal);
  const hydrationRemaining = Math.max(0, activeHydrationGoalMl - hydrationMl);
  const dailyInsight = insightMessage({
    mealsCount: meals.length,
    proteinRemaining,
    hydrationRemainingMl: hydrationRemaining,
    caloriesRemaining,
  });
  const suggestedMeals = mealSuggestions({
    proteinRemaining,
    carbsRemaining,
    fatRemaining,
    caloriesRemaining,
  });

  useEffect(() => {
    Animated.timing(dayProgressAnim, {
      toValue: progress,
      duration: 450,
      useNativeDriver: false,
    }).start();
  }, [dayProgressAnim, progress]);

  useEffect(() => {
    Animated.timing(hydrationProgressAnim, {
      toValue: hydrationProgress,
      duration: 350,
      useNativeDriver: false,
    }).start();
  }, [hydrationProgress, hydrationProgressAnim]);

  const dayProgressWidth = dayProgressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const hydrationProgressWidth = hydrationProgressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const hydrationScale = hydrationPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.04],
  });

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Brand.bg} />

      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: 160 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View style={[s.headerHero, { paddingTop: insets.top + 10 }]}> 
          <View style={s.headerGlowPrimary} />
          <View style={s.headerGlowSecondary} />

          <View style={s.headerTopRow}>
            <Pressable style={s.headerLeft} onPress={() => setProfileVisible(true)}>
              {user?.profileImageUrl ? (
                <Image source={{ uri: user.profileImageUrl }} style={s.avatar} />
              ) : (
                <View style={s.avatarPlaceholder}>
                  <Text style={s.avatarLetter}>{(user?.username ?? 'V').charAt(0).toUpperCase()}</Text>
                </View>
              )}
              <View style={s.headerTextWrap}>
                <Text style={s.greeting}>{greeting()}{user ? `, ${user.username}` : ''}</Text>
                <Text style={s.dateLabel}>{todayLabel()}</Text>
              </View>
            </Pressable>
            <View style={s.headerActions}>
              <Pressable style={({ pressed }) => [s.headerIconBtn, pressed && s.iconBtnPressed]} onPress={() => router.push('/(tabs)/history' as any)}>
                <Ionicons name="notifications-outline" size={18} color={Brand.text} />
              </Pressable>
              <Pressable style={({ pressed }) => [s.headerIconBtn, pressed && s.iconBtnPressed]} onPress={() => setProfileVisible(true)}>
                <Ionicons name="settings-outline" size={18} color={Brand.text} />
              </Pressable>
            </View>
          </View>

          <View style={s.headerBottomHint}>
            <NutritionIllustration size={20} />
            <Text style={s.headerBottomHintText}>Seu progresso alimentar de hoje</Text>
          </View>
        </View>

        <View style={s.dayCard}>
          <View style={s.cardHeadingRow}>
            <View>
              <Text style={s.dayTitle}>Meu dia</Text>
              <Text style={s.daySubtitle}>Resumo calorico e distribuicao de macros</Text>
            </View>
            <View style={s.scoreChip}>
              <Text style={s.scoreLabel}>Score</Text>
              <Text style={s.scoreValue}>{Math.round(score)}</Text>
            </View>
          </View>

          <View style={s.kcalRow}>
            <Text style={s.kcalValue}>{cal}</Text>
            <Text style={s.kcalGoal}>/ {DAILY_GOAL_KCAL} kcal</Text>
          </View>

          <View style={s.progressTrack}>
            <Animated.View style={[s.progressFill, { width: dayProgressWidth }]} />
          </View>
          <Text style={s.progressText}>{Math.round(progress * 100)}% da meta concluida</Text>
          <Text style={s.goalHint}>{Math.max(0, DAILY_GOAL_KCAL - cal)} kcal para bater a meta</Text>

          <View style={s.macroRow}>
            <MacroPill label="proteina" value={`${prot}g`} color={Brand.macroProtein} bg={Brand.macroProteinBg} />
            <MacroPill label="carboidrato" value={`${carb}g`} color={Brand.macroCarb} bg={Brand.macroCarbBg} />
            <MacroPill label="gordura" value={`${fat}g`} color={Brand.macroFat} bg={Brand.macroFatBg} />
          </View>

          <View style={s.macroGoalsWrap}>
            <Text style={s.macroGoalsTitle}>Metas de macros</Text>
            {macros.map((macro) => {
              const ratio = macroGoalProgress(macro.consumed, macro.goal);
              return (
                <View key={macro.id} style={s.macroGoalRow}>
                  <View style={s.macroGoalTop}>
                    <Text style={s.macroGoalLabel}>{macro.label}</Text>
                    <Text style={s.macroGoalValue}>
                      {macro.consumed} / {macro.goal}g
                    </Text>
                  </View>
                  <View style={[s.macroGoalTrack, { backgroundColor: macro.bg }]}>
                    <View
                      style={[
                        s.macroGoalFill,
                        {
                          backgroundColor: macro.color,
                          width: `${Math.round(ratio * 100)}%`,
                        },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View style={s.hydrationCard}>
          <View style={s.hydrationTopRow}>
            <View style={s.hydrationTitleWrap}>
              <View style={s.hydrationIconWrap}>
                <Ionicons name="water-outline" size={17} color={Brand.hydration} />
              </View>
              <View>
                <Text style={s.hydrationTitle}>Hidratacao</Text>
                <Text style={s.hydrationSubtitle}>Acompanhe sua agua no dia</Text>
              </View>
            </View>
            <Animated.View style={[s.hydrationValueWrap, { transform: [{ scale: hydrationScale }] }]}>
              <Text style={s.hydrationValue}>{formatLiters(hydrationMl)}</Text>
              <Text style={s.hydrationGoal}>/ {formatLiters(activeHydrationGoalMl)}</Text>
            </Animated.View>
          </View>

          <View style={s.hydrationTrack}>
            <Animated.View style={[s.hydrationFill, { width: hydrationProgressWidth }]} />
          </View>

          {hydrationLoading || hydrationSaving ? (
            <Text style={s.hydrationStatusText}>
              {hydrationSaving ? 'Sincronizando hidratacao...' : 'Carregando hidratacao do dia...'}
            </Text>
          ) : null}
          {hydrationError ? <Text style={s.hydrationErrorText}>{hydrationError}</Text> : null}

          <View style={s.hydrationActions}>
            <HydrationButton
              label="+200ml"
              onPress={() => addHydration(200)}
              disabled={hydrationLoading || hydrationSaving}
            />
            <HydrationButton
              label="-15ml"
              onPress={() => addHydration(-15)}
              disabled={hydrationLoading || hydrationSaving || hydrationMl <= 0}
            />
            <HydrationButton
              label="Meta 2.5L"
              onPress={() => setHydrationGoal(2500)}
              disabled={hydrationLoading || hydrationSaving}
            />
          </View>
        </View>

        <View style={s.insightCard}>
          <View style={s.sectionHeaderRow}>
            <Text style={s.sectionTitle}>Insight do dia</Text>
            <Text style={s.counterText}>acoes sugeridas</Text>
          </View>
          <Text style={s.insightText}>{dailyInsight}</Text>
          <View style={s.suggestionRow}>
            {suggestedMeals.map((suggestion, index) => (
              <View key={`${suggestion}-${index}`} style={s.suggestionChip}>
                <Text style={s.suggestionChipText}>{suggestion}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={s.card}>
          <View style={s.sectionHeaderRow}>
            <Text style={s.sectionTitle}>Semana em foco</Text>
            <Text style={s.counterText}>ultimos 7 dias</Text>
          </View>
          {weeklyLoading ? (
            <Text style={s.sectionSubtitle}>Carregando panorama semanal...</Text>
          ) : weeklySnapshot && weeklySnapshot.daysWithMeals > 0 ? (
            <View style={s.weeklyGrid}>
              <View style={s.weeklyMetric}>
                <Text style={s.weeklyMetricLabel}>Calorias medias</Text>
                <Text style={s.weeklyMetricValue}>{weeklySnapshot.avgCalories} kcal</Text>
              </View>
              <View style={s.weeklyMetric}>
                <Text style={s.weeklyMetricLabel}>Proteina media</Text>
                <Text style={s.weeklyMetricValue}>{weeklySnapshot.avgProtein}g</Text>
              </View>
              <View style={s.weeklyMetric}>
                <Text style={s.weeklyMetricLabel}>Dias com refeicoes</Text>
                <Text style={s.weeklyMetricValue}>{weeklySnapshot.daysWithMeals}/7</Text>
              </View>
            </View>
          ) : (
            <Text style={s.sectionSubtitle}>
              Sem dados suficientes na semana. Registre refeicoes para liberar seu panorama.
            </Text>
          )}
        </View>

        <AppButton title="+ Nova refeicao" onPress={() => setRegisterVisible(true)} />

        <View style={s.card}>
          <View style={s.sectionHeaderRow}>
            <Text style={s.sectionTitle}>Pratos salvos</Text>
            <Pressable onPress={handleOpenMyDishes}>
              <Text style={s.linkText}>{favorites.length > 0 ? 'Ver todos' : 'Cadastrar'}</Text>
            </Pressable>
          </View>

          {favorites.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.savedCarousel}>
              {favorites.map((fav) => (
                <Pressable
                  key={fav.id}
                  style={({ pressed }) => [s.savedCard, pressed && s.savedCardPressed]}
                  onPress={() => setQuickAddVisible(true)}>
                  {fav.imageUrl ? (
                    <Image source={{ uri: fav.imageUrl }} style={s.savedCardImage} />
                  ) : (
                    <View style={s.savedCardImagePlaceholder}>
                      <Ionicons name="restaurant-outline" size={18} color={Brand.textSecondary} />
                    </View>
                  )}
                  <Text style={s.savedCardTitle} numberOfLines={2}>{fav.foods}</Text>
                  <Text style={s.savedCardKcal}>{fav.nutrition.calories}</Text>
                </Pressable>
              ))}
            </ScrollView>
          ) : (
            <View style={s.emptyState}>
              <Text style={s.emptyTitle}>Nenhum prato salvo ainda</Text>
              <Text style={s.emptySubtitle}>Salve seus pratos para lancamento rapido.</Text>
              <View style={s.emptyButtonWrap}>
                <AppButton title="Ir para Meus pratos" variant="secondary" onPress={handleOpenMyDishes} />
              </View>
            </View>
          )}
        </View>

        <View style={s.card}>
          <Text style={s.sectionTitle}>Consulta de alimentos</Text>
          <Text style={s.sectionSubtitle}>Busque rapidamente e consulte calorias e macros.</Text>

          <View style={s.searchInputWrap}>
            <Ionicons style={s.searchIcon} name="search-outline" size={18} color={Brand.textSecondary} />
            <AppInput
              ref={queryInputRef}
              placeholder="Buscar banana, arroz, frango..."
              value={query}
              onChangeText={(t: string) => setQuery(t.replace(/[^a-zA-Z\s]/g, ''))}
              maxLength={50}
              style={s.searchInput}
            />
          </View>

          <View style={s.categoryRow}>
            {FOOD_CATEGORIES.map((item) => (
              <Pressable
                key={item.id}
                style={({ pressed }) => [s.categoryChip, { backgroundColor: item.tint }, pressed && s.categoryChipPressed]}
                onPress={() => {
                  setQuery(item.query);
                  setQueryWeight('');
                  setQueryUnit('g');
                  nutrition.reset();
                }}>
                <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={14} color={Brand.text} />
                <Text style={s.categoryChipLabel}>{item.label}</Text>
              </Pressable>
            ))}
          </View>

          <View style={s.queryWeightRow}>
            <View style={{ flex: 1 }}>
              <AppInput
                placeholder="Quantidade"
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

          <AppButton title="Consultar calorias" onPress={handleQuery} loading={nutrition.loading} disabled={!query.trim()} />

          {nutrition.data ? (
            <View style={s.resultBox}>
              <Text style={s.resultCal}>{nutrition.data.calories}</Text>
              <View style={s.resultMacros}>
                <MacroPill label="proteina" value={nutrition.data.protein} color={Brand.macroProtein} bg={Brand.macroProteinBg} />
                <MacroPill label="carboidrato" value={nutrition.data.carbs} color={Brand.macroCarb} bg={Brand.macroCarbBg} />
                <MacroPill label="gordura" value={nutrition.data.fat} color={Brand.macroFat} bg={Brand.macroFatBg} />
              </View>
              <Pressable onPress={handleClearQuery}>
                <Text style={s.resultClear}>Limpar consulta</Text>
              </Pressable>
            </View>
          ) : null}

          {nutrition.error ? (
            <NutritionErrorModal visible={!!nutrition.error} message={nutrition.error} onClose={() => nutrition.reset()} />
          ) : null}
        </View>

        <View style={s.analysisCard}>
          <View style={s.analysisGlowTop} />
          <View style={s.sectionHeader}>
            <View>
              <Text style={s.sectionTitle}>Analisar refeicao</Text>
              <Text style={s.analysisSubtitle}>Foto, voz ou plano alimentar (PDF)</Text>
            </View>
            <View style={s.analysisBadge}>
              <Ionicons name="sparkles-outline" size={14} color={Brand.greenDark} />
            </View>
          </View>
          <View style={s.analyzerTabRow}>
            <AnalyzerTabButton label="Foto" active={analyzerTab === 'photo'} onPress={() => setAnalyzerTab('photo')} />
            <AnalyzerTabButton label="Voz" active={analyzerTab === 'audio'} onPress={() => setAnalyzerTab('audio')} />
            <AnalyzerTabButton label="Plano alimentar" active={analyzerTab === 'plan'} onPress={() => setAnalyzerTab('plan')} />
          </View>

          {analyzerTab === 'photo' ? (
            <PhotoNutritionAnalyzer
              attachments={photoAttachments}
              onChangeAttachments={setPhotoAttachments}
              onRequiresReview={(result, payload) => handleNutritionNeedsReview('photo', result, payload)}
            />
          ) : null}
          {analyzerTab === 'audio' ? (
            <AudioNutritionAnalyzer onRequiresReview={(result) => handleNutritionNeedsReview('audio', result)} />
          ) : null}
          {analyzerTab === 'plan' ? (
            <PdfPlanAnalyzer
              attachments={planPdfAttachments}
              onChangeAttachments={setPlanPdfAttachments}
              onRequiresReview={handlePlanPdfNeedsReview}
            />
          ) : null}
        </View>

        <View style={s.card}>
          <View style={s.sectionHeaderRow}>
            <Text style={s.sectionTitle}>Refeicoes de hoje</Text>
            <Text style={s.counterText}>{meals.length} {meals.length === 1 ? 'registro' : 'registros'}</Text>
          </View>

          {sortedMeals.length > 0 ? (
            <View style={s.mealsList}>
              {sortedMeals.map((meal) => (
                <MealCard key={meal.id} meal={meal} onEdit={handleEdit} onDuplicate={duplicate} onDelete={remove} />
              ))}
            </View>
          ) : (
            <View style={s.emptyState}>
              <Text style={s.emptyTitle}>Nenhuma refeicao registrada hoje</Text>
              <Text style={s.emptySubtitle}>Comece registrando sua primeira refeicao para acompanhar o progresso.</Text>
              <View style={s.emptyButtonWrap}>
                <AppButton title="+ Adicionar refeicao" onPress={() => setRegisterVisible(true)} variant="secondary" />
              </View>
            </View>
          )}
        </View>

        <View style={s.card}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Calculadora de IMC</Text>
          </View>
          <BmiCalculatorCard onOpenAsQuickAction={handleOpenBmiQuickAction} />
        </View>
      </ScrollView>

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

      <EditProfileModal visible={profileVisible} onClose={() => setProfileVisible(false)} />

      <QuickAddSheet
        visible={quickAddVisible}
        favorites={favorites}
        onSelect={handleQuickAdd}
        onClose={() => setQuickAddVisible(false)}
      />
    </View>
  );
}
function AnalyzerTabButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[s.analyzerTab, active && s.analyzerTabActive]} onPress={onPress}>
      <Text style={[s.analyzerTabText, active && s.analyzerTabTextActive]}>{label}</Text>
    </Pressable>
  );
}

function HydrationButton({
  label,
  onPress,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      disabled={disabled}
      style={({ pressed }) => [
        s.hydrationBtn,
        disabled && s.hydrationBtnDisabled,
        pressed && !disabled && s.hydrationBtnPressed,
      ]}
      onPress={onPress}>
      <Text style={s.hydrationBtnText}>{label}</Text>
    </Pressable>
  );
}

function MacroPill({
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

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Brand.bg,
  },
  scroll: {
    paddingHorizontal: Spacing.md,
    paddingTop: 0,
    gap: Spacing.sm,
  },

  headerHero: {
    minHeight: 156,
    borderBottomLeftRadius: Radii.xxl,
    borderBottomRightRadius: Radii.xxl,
    backgroundColor: '#E7F5EB',
    paddingHorizontal: Spacing.md,
    paddingBottom: 14,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  headerGlowPrimary: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 220,
    right: -70,
    top: -120,
    backgroundColor: '#CDEDD9',
  },
  headerGlowSecondary: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 200,
    left: -80,
    bottom: -110,
    backgroundColor: '#D9F2E1',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Brand.green,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  headerTextWrap: {
    flex: 1,
    paddingRight: 8,
  },
  greeting: {
    ...Typography.subtitle,
    color: Brand.text,
    fontWeight: '800',
  },
  dateLabel: {
    ...Typography.helper,
    color: Brand.textSecondary,
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.95)',
  },
  iconBtnPressed: {
    opacity: 0.75,
  },
  headerBottomHint: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: Radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.95)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerBottomHintText: {
    ...Typography.caption,
    color: Brand.greenDeeper,
    fontWeight: '700',
  },

  dayCard: {
    backgroundColor: '#F4F9F4',
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: '#DDEADD',
    padding: 18,
    gap: 12,
    ...Shadows.soft,
  },
  cardHeadingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  dayTitle: {
    ...Typography.subtitle,
    color: Brand.text,
    fontWeight: '800',
  },
  daySubtitle: {
    ...Typography.helper,
    color: Brand.textSecondary,
    marginTop: 1,
  },
  scoreChip: {
    width: 74,
    height: 74,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 37,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDEADD',
    ...Shadows.card,
  },
  scoreLabel: {
    ...Typography.caption,
    color: Brand.textSecondary,
    textTransform: 'uppercase',
    lineHeight: 12,
    fontSize: 10,
  },
  scoreValue: {
    ...Typography.title,
    color: Brand.greenDark,
    fontWeight: '800',
    marginTop: -1,
    lineHeight: 26,
  },
  kcalRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  kcalValue: {
    ...Typography.hero,
    color: Brand.text,
    fontSize: 42,
    lineHeight: 44,
  },
  kcalGoal: {
    ...Typography.body,
    color: Brand.textSecondary,
    fontWeight: '600',
  },
  progressTrack: {
    width: '100%',
    height: 11,
    borderRadius: Radii.pill,
    backgroundColor: '#DCE8DC',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: Radii.pill,
    backgroundColor: Brand.green,
  },
  progressText: {
    ...Typography.helper,
    color: Brand.textSecondary,
    marginTop: -2,
  },
  goalHint: {
    ...Typography.caption,
    color: Brand.greenDark,
    fontWeight: '700',
    marginTop: -2,
  },
  macroRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },
  macroGoalsWrap: {
    marginTop: 2,
    gap: 9,
  },
  macroGoalsTitle: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  macroGoalRow: {
    gap: 6,
  },
  macroGoalTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  macroGoalLabel: {
    ...Typography.caption,
    color: Brand.text,
    fontWeight: '700',
  },
  macroGoalValue: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '700',
  },
  macroGoalTrack: {
    height: 7,
    borderRadius: Radii.pill,
    overflow: 'hidden',
  },
  macroGoalFill: {
    height: '100%',
    borderRadius: Radii.pill,
  },

  hydrationCard: {
    backgroundColor: Brand.hydrationBg,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: '#D8E9FF',
    padding: 18,
    gap: 12,
    ...Shadows.card,
  },
  hydrationTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  hydrationTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  hydrationIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DAE9FF',
  },
  hydrationTitle: {
    ...Typography.subtitle,
    color: '#356AA7',
    fontWeight: '800',
  },
  hydrationSubtitle: {
    ...Typography.helper,
    color: '#507BAE',
    marginTop: 1,
  },
  hydrationValueWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  hydrationValue: {
    ...Typography.title,
    color: '#356AA7',
    fontSize: 24,
  },
  hydrationGoal: {
    ...Typography.body,
    color: '#5E84B5',
    fontWeight: '600',
  },
  hydrationTrack: {
    width: '100%',
    height: 9,
    borderRadius: Radii.pill,
    backgroundColor: '#D8E8FC',
    overflow: 'hidden',
  },
  hydrationFill: {
    height: '100%',
    borderRadius: Radii.pill,
    backgroundColor: Brand.hydration,
  },
  hydrationActions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  hydrationStatusText: {
    ...Typography.caption,
    color: '#507BAE',
    fontWeight: '600',
  },
  hydrationErrorText: {
    ...Typography.caption,
    color: '#A03D3D',
    fontWeight: '700',
  },
  hydrationBtn: {
    borderRadius: Radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D6E7FF',
  },
  hydrationBtnDisabled: {
    opacity: 0.55,
  },
  hydrationBtnPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  hydrationBtnText: {
    ...Typography.caption,
    color: '#3E6FA8',
    fontWeight: '700',
  },
  insightCard: {
    backgroundColor: '#F5FAF6',
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: '#DDECDD',
    padding: 16,
    gap: 12,
    ...Shadows.card,
  },
  insightText: {
    ...Typography.body,
    color: Brand.text,
  },
  suggestionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: '#DCEADB',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  suggestionChipText: {
    ...Typography.caption,
    color: Brand.greenDeeper,
    fontWeight: '700',
  },
  weeklyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  weeklyMetric: {
    flexGrow: 1,
    minWidth: '31%',
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: '#DDE6E0',
    backgroundColor: Brand.surfaceAlt,
    padding: 10,
    gap: 4,
  },
  weeklyMetricLabel: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '700',
  },
  weeklyMetricValue: {
    ...Typography.body,
    color: Brand.text,
    fontWeight: '800',
  },

  card: {
    backgroundColor: Brand.card,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: 16,
    gap: 12,
    ...Shadows.card,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    ...Typography.subtitle,
    color: Brand.text,
    fontWeight: '800',
  },
  sectionSubtitle: {
    ...Typography.helper,
    color: Brand.textSecondary,
    marginTop: -4,
  },
  linkText: {
    ...Typography.helper,
    color: Brand.greenDark,
    fontWeight: '700',
  },
  analysisCard: {
    backgroundColor: '#F8FBF7',
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: '#DFEBDD',
    padding: 16,
    gap: 12,
    overflow: 'hidden',
    ...Shadows.card,
  },
  analysisGlowTop: {
    position: 'absolute',
    top: -42,
    right: -32,
    width: 140,
    height: 140,
    borderRadius: 140,
    backgroundColor: '#E4F4E9',
  },
  analysisSubtitle: {
    ...Typography.caption,
    color: Brand.textSecondary,
    marginTop: 2,
  },
  analysisBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EBF6EE',
    borderWidth: 1,
    borderColor: '#D6EAD9',
  },

  savedCarousel: {
    gap: 10,
    paddingRight: 2,
  },
  savedCard: {
    width: 132,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: '#DDEADD',
    backgroundColor: '#F8FCF8',
    padding: 10,
    gap: 8,
  },
  savedCardPressed: {
    opacity: 0.86,
  },
  savedCardImage: {
    width: '100%',
    height: 76,
    borderRadius: 12,
  },
  savedCardImagePlaceholder: {
    width: '100%',
    height: 76,
    borderRadius: 12,
    backgroundColor: Brand.surfaceAlt,
    borderWidth: 1,
    borderColor: Brand.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedCardTitle: {
    ...Typography.body,
    color: Brand.text,
    fontWeight: '700',
    minHeight: 38,
  },
  savedCardKcal: {
    ...Typography.caption,
    color: Brand.greenDark,
    fontWeight: '800',
  },

  searchInputWrap: {
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    left: 14,
    top: 18,
    zIndex: 1,
  },
  searchInput: {
    paddingLeft: 40,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: Brand.border,
    paddingVertical: 8,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryChipPressed: {
    opacity: 0.82,
  },
  categoryChipLabel: {
    ...Typography.caption,
    color: Brand.text,
    fontWeight: '700',
  },

  queryWeightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  queryUnitRow: {
    flexDirection: 'row',
    borderRadius: Radii.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Brand.border,
    backgroundColor: Brand.surfaceAlt,
  },
  queryUnitBtn: {
    minWidth: 42,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  queryUnitBtnActive: {
    backgroundColor: Brand.green,
  },
  queryUnitText: {
    ...Typography.body,
    fontSize: 13,
    color: Brand.textSecondary,
    fontWeight: '600',
  },
  queryUnitTextActive: {
    color: '#FFFFFF',
  },

  resultBox: {
    borderRadius: Radii.md,
    backgroundColor: Brand.surfaceSoft,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: 14,
    alignItems: 'center',
    gap: 10,
  },
  resultCal: {
    ...Typography.title,
    color: Brand.greenDark,
    fontSize: 27,
  },
  resultMacros: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  resultClear: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '700',
  },

  analyzerTabRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  analyzerTab: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: '#D5E6D9',
    backgroundColor: '#FFFFFF',
  },
  analyzerTabActive: {
    backgroundColor: '#E3F3E8',
    borderColor: '#BFDCC8',
  },
  analyzerTabText: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '700',
  },
  analyzerTabTextActive: {
    color: Brand.greenDeeper,
  },

  counterText: {
    ...Typography.caption,
    color: Brand.textSecondary,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  mealsList: {
    gap: 8,
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: Brand.surfaceAlt,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: 20,
    gap: 8,
  },
  emptyTitle: {
    ...Typography.body,
    color: Brand.text,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtitle: {
    ...Typography.helper,
    color: Brand.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyButtonWrap: {
    marginTop: 4,
    width: '100%',
  },

  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: Radii.pill,
  },
  pillLabel: {
    ...Typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  pillValue: {
    ...Typography.caption,
    fontWeight: '700',
  },
});

