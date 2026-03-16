import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  PanResponder,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { CalendarPickerModal } from '@/components/calendar-picker-modal';
import { EditProfileModal } from '@/components/edit-profile-modal';
import { NotificationCenterModal } from '@/components/notifications/notification-center-modal';
import { NutritionGoalsModal } from '@/components/nutrition-goals-modal';
import { RegisterMealModal } from '@/components/register-meal-modal';
import { Brand, Radii, Shadows, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useMeals } from '@/hooks/use-meals';
import {
  getNotifications,
  markNotificationsRead,
  type AppNotification,
  type NotificationsSnapshot,
} from '@/services/notifications';
import {
  getNutritionGoals,
  saveNutritionGoals,
  type NutritionGoalsStatus,
} from '@/services/nutrition-goals';
import { getWaterStatus, saveWaterStatus, type WaterEvent, type WaterStatus } from '@/services/water';
import type { Meal, MealType, NutritionData } from '@/types/nutrition';
import { buildFoodsString, extractNum, toDateStr, todayStr } from '@/utils/helpers';
import {
  HYDRATION_GOAL_MAX_ML,
  HYDRATION_GOAL_MIN_ML,
  getHydrationGoalDraftMl,
  hydrationGoalFromRatio,
  hydrationGoalRatio,
  normalizeHydrationGoalMl,
} from '@/utils/hydration';

const MEAL_SUMMARY_META: Record<
  MealType,
  {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    bg: string;
  }
> = {
  breakfast: { label: 'Café da manhã', icon: 'sunny-outline', color: '#D97706', bg: '#FFF4DE' },
  lunch: { label: 'Almoço', icon: 'restaurant-outline', color: Brand.greenDark, bg: '#EAF7EE' },
  snack: { label: 'Lanche', icon: 'cafe-outline', color: '#C97A1C', bg: '#FFF2E1' },
  dinner: { label: 'Jantar', icon: 'moon-outline', color: '#6D5BD0', bg: '#F1EEFF' },
  supper: { label: 'Ceia', icon: 'bed-outline', color: '#4F46E5', bg: '#EEF2FF' },
};

const MEAL_SUMMARY_ORDER: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner', 'supper'];

const HYDRATION_QUICK_ACTIONS = [
  { label: '-500 ml', deltaMl: -500, tone: 'negative' as const },
  { label: '-300 ml', deltaMl: -300, tone: 'negative' as const },
  { label: '+200 ml', deltaMl: 200, tone: 'positive' as const },
  { label: '+1L', deltaMl: 1000, tone: 'positive' as const },
];

type GoalProgress = {
  key: 'calories' | 'protein' | 'carbs' | 'fat';
  label: string;
  unit: string;
  consumed: number;
  goal: number;
  remaining: number;
  progress: number;
  reached: boolean;
  color: string;
  bg: string;
};

type MealSummary = {
  type: MealType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
  count: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function parseDateInput(date: string): Date {
  const [year, month, day] = date.split('-').map((item) => parseInt(item, 10));
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

function isTodayDate(date: string) {
  return date === todayStr();
}

function formatCompactSelectedDate(date: string) {
  const parsed = parseDateInput(date);
  const weekday = parsed
    .toLocaleDateString('pt-BR', { weekday: 'short' })
    .replace('.', '');
  const month = parsed
    .toLocaleDateString('pt-BR', { month: 'short' })
    .replace('.', '');

  return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)}, ${parsed.getDate()} ${month}`;
}

function formatDateChip(date: string) {
  if (isTodayDate(date)) return 'Hoje';
  return parseDateInput(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  });
}

function formatDateForModal(date: string) {
  return parseDateInput(date).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function shiftDate(date: string, days: number) {
  const next = parseDateInput(date);
  next.setDate(next.getDate() + days);
  return toDateStr(next);
}

function formatLiters(valueMl: number) {
  return `${(valueMl / 1000).toFixed(1)}L`;
}

function formatMetricValue(value: number, unit: string) {
  return `${Number.isInteger(value) ? value : value.toFixed(1)}${unit}`;
}

function buildGoalProgress(
  key: GoalProgress['key'],
  label: string,
  unit: string,
  consumed: number,
  goal: number | null,
  color: string,
  bg: string,
): GoalProgress | null {
  if (goal === null || goal <= 0) return null;

  return {
    key,
    label,
    unit,
    consumed,
    goal,
    remaining: Math.max(0, goal - consumed),
    progress: clamp(consumed / goal, 0, 1),
    reached: consumed >= goal,
    color,
    bg,
  };
}

function buildGoalItems(
  calories: number,
  protein: number,
  carbs: number,
  fat: number,
  goals: NutritionGoalsStatus | null,
): GoalProgress[] {
  return [
    buildGoalProgress('calories', 'Calorias', ' kcal', calories, goals?.goals.calories ?? null, Brand.greenDark, '#E7F6EC'),
    buildGoalProgress('protein', 'Proteína', 'g', protein, goals?.goals.protein ?? null, Brand.macroProtein, Brand.macroProteinBg),
    buildGoalProgress('carbs', 'Carboidrato', 'g', carbs, goals?.goals.carbs ?? null, Brand.macroCarb, Brand.macroCarbBg),
    buildGoalProgress('fat', 'Gordura', 'g', fat, goals?.goals.fat ?? null, Brand.macroFat, Brand.macroFatBg),
  ].filter((item): item is GoalProgress => item !== null);
}

function buildMealSummaries(meals: Meal[]): MealSummary[] {
  const buckets = new Map<MealType, MealSummary>();

  MEAL_SUMMARY_ORDER.forEach((type) => {
    const meta = MEAL_SUMMARY_META[type];
    buckets.set(type, {
      type,
      label: meta.label,
      icon: meta.icon,
      color: meta.color,
      bg: meta.bg,
      count: 0,
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    });
  });

  meals.forEach((meal) => {
    const bucket = buckets.get(meal.mealType);
    if (!bucket) return;

    bucket.count += 1;
    bucket.calories += extractNum(meal.nutrition?.calories ?? '0');
    bucket.protein += extractNum(meal.nutrition?.protein ?? '0');
    bucket.carbs += extractNum(meal.nutrition?.carbs ?? '0');
    bucket.fat += extractNum(meal.nutrition?.fat ?? '0');
  });

  return MEAL_SUMMARY_ORDER.map((type) => buckets.get(type)!).filter((item) => item.count > 0);
}

function formatWaterEventTime(event: WaterEvent) {
  if (!event.createdAt) return 'Movimento registrado';

  const parsed = new Date(event.createdAt);
  if (Number.isNaN(parsed.getTime())) return 'Movimento registrado';

  return parsed.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function sortNotifications(notifications: AppNotification[]) {
  return [...notifications].sort((a, b) => {
    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();
    return bTime - aTime;
  });
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const today = todayStr();

  const [registerVisible, setRegisterVisible] = useState(false);
  const [profileVisible, setProfileVisible] = useState(false);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [goalsModalVisible, setGoalsModalVisible] = useState(false);

  const [waterStatus, setWaterStatus] = useState<WaterStatus | null>(null);
  const [hydrationMl, setHydrationMl] = useState(0);
  const [hydrationGoalMl, setHydrationGoalMl] = useState(0);
  const [hydrationSaving, setHydrationSaving] = useState(false);
  const [hydrationLoading, setHydrationLoading] = useState(false);
  const [hydrationError, setHydrationError] = useState<string | null>(null);
  const [hydrationGoalMenuOpen, setHydrationGoalMenuOpen] = useState(false);
  const [hydrationGoalDraftMl, setHydrationGoalDraftMl] = useState(getHydrationGoalDraftMl(null));

  const [nutritionGoals, setNutritionGoals] = useState<NutritionGoalsStatus | null>(null);
  const [goalsLoading, setGoalsLoading] = useState(false);
  const [goalsSaving, setGoalsSaving] = useState(false);
  const [goalsError, setGoalsError] = useState<string | null>(null);

  const [notificationsSnapshot, setNotificationsSnapshot] = useState<NotificationsSnapshot>({
    notifications: [],
    unreadCount: 0,
  });
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);
  const [notificationBusyIds, setNotificationBusyIds] = useState<Record<string, boolean>>({});
  const [notificationsMarkingAll, setNotificationsMarkingAll] = useState(false);

  const { meals, totals, add, refresh, date: selectedDate, setDate } = useMeals();
  const canAdvanceDate = selectedDate < today;

  const dayAnim = useRef(new Animated.Value(0)).current;
  const hydrationAnim = useRef(new Animated.Value(0)).current;
  const hydrationPulse = useRef(new Animated.Value(0)).current;

  const applyHydration = useCallback((water: WaterStatus | null) => {
    setWaterStatus(water);
    if (!water) {
      setHydrationMl(0);
      setHydrationGoalMl(0);
      return;
    }
    setHydrationMl(Math.max(0, water.consumedMl));
    setHydrationGoalMl(water.goalMl > 0 ? water.goalMl : 0);
  }, []);

  const loadHydration = useCallback(async (date: string) => {
    setHydrationLoading(true);
    try {
      applyHydration(await getWaterStatus(date));
      setHydrationError(null);
    } catch (error) {
      setHydrationError(error instanceof Error ? error.message : 'Falha ao carregar hidratacao.');
    } finally {
      setHydrationLoading(false);
    }
  }, [applyHydration]);

  const loadGoalState = useCallback(async (date: string) => {
    setGoalsLoading(true);
    try {
      setNutritionGoals(await getNutritionGoals(date));
      setGoalsError(null);
    } catch (error) {
      setGoalsError(error instanceof Error ? error.message : 'Falha ao carregar metas do dia.');
    } finally {
      setGoalsLoading(false);
    }
  }, []);

  const applyNotifications = useCallback((snapshot: NotificationsSnapshot) => {
    setNotificationsSnapshot({
      notifications: sortNotifications(snapshot.notifications),
      unreadCount: snapshot.unreadCount,
    });
  }, []);

  const loadNotifications = useCallback(async () => {
    setNotificationsLoading(true);
    try {
      applyNotifications(await getNotifications());
      setNotificationsError(null);
    } catch (error) {
      setNotificationsError(error instanceof Error ? error.message : 'Falha ao carregar notificações.');
    } finally {
      setNotificationsLoading(false);
    }
  }, [applyNotifications]);

  useFocusEffect(
    useCallback(() => {
      refresh();
      loadHydration(selectedDate);
      loadGoalState(selectedDate);
      loadNotifications();
    }, [refresh, loadHydration, loadGoalState, loadNotifications, selectedDate]),
  );

  useEffect(() => {
    loadHydration(selectedDate);
    loadGoalState(selectedDate);
    setHydrationGoalMenuOpen(false);
  }, [loadGoalState, loadHydration, selectedDate]);

  useEffect(() => {
    setHydrationGoalDraftMl(getHydrationGoalDraftMl(hydrationGoalMl));
  }, [hydrationGoalMl]);

  async function handleSaveNew(params: {
    foods: string;
    mealType: MealType;
    date?: string;
    time?: string;
    nutrition: NutritionData;
    dishName?: string;
    imageBase64?: string | null;
  }) {
    await add(buildFoodsString(params.dishName, params.foods), params.mealType, params.nutrition, params.time, params.date, params.imageBase64);
    setRegisterVisible(false);
  }

  async function sendHydrationUpdate(params: { deltaMl?: number; goalMl?: number }) {
    if (hydrationSaving) return;
    setHydrationSaving(true);
    try {
      applyHydration(await saveWaterStatus({ date: selectedDate, ...params }));
      setHydrationError(null);
      if (params.deltaMl) {
        hydrationPulse.setValue(0);
        Animated.sequence([
          Animated.timing(hydrationPulse, { toValue: 1, duration: 120, useNativeDriver: true }),
          Animated.timing(hydrationPulse, { toValue: 0, duration: 160, useNativeDriver: true }),
        ]).start();
      }
    } catch (error) {
      setHydrationError(error instanceof Error ? error.message : 'Falha ao atualizar hidratacao.');
    } finally {
      setHydrationSaving(false);
    }
  }

  function handleHydrationGoalDraftChange(goalMl: number) {
    setHydrationGoalDraftMl(normalizeHydrationGoalMl(goalMl));
  }

  async function handleHydrationGoalCommit(goalMl: number) {
    const normalizedGoal = normalizeHydrationGoalMl(goalMl);
    const currentGoal = hydrationGoalMl > 0 ? normalizeHydrationGoalMl(hydrationGoalMl) : 0;

    setHydrationGoalDraftMl(normalizedGoal);
    if (normalizedGoal === currentGoal) return;

    await sendHydrationUpdate({ goalMl: normalizedGoal });
  }

  async function handleSaveGoals(
    updates: Partial<{
      caloriesGoal: number;
      proteinGoal: number;
      carbsGoal: number;
      fatGoal: number;
    }>,
  ) {
    if (goalsSaving) return;

    setGoalsSaving(true);
    try {
      const nextGoals = await saveNutritionGoals({ date: selectedDate, ...updates });
      setNutritionGoals(nextGoals);
      setGoalsError(null);
      setGoalsModalVisible(false);
    } catch (error) {
      setGoalsError(error instanceof Error ? error.message : 'Falha ao salvar metas do dia.');
    } finally {
      setGoalsSaving(false);
    }
  }

  function markNotificationsLocally(params: { ids?: string[]; markAll?: boolean }) {
    setNotificationsSnapshot((current) => {
      const notifications = current.notifications.map((item) => {
        const shouldMark = params.markAll || params.ids?.includes(item.id);
        if (!shouldMark || item.readAt) return item;
        return { ...item, readAt: new Date().toISOString() };
      });

      return {
        notifications,
        unreadCount: notifications.filter((item) => !item.readAt).length,
      };
    });
  }

  async function handleOpenNotifications() {
    setNotificationsVisible(true);
    await loadNotifications();
  }

  async function handlePressNotification(notification: AppNotification) {
    if (!notification.readAt) {
      setNotificationBusyIds((current) => ({ ...current, [notification.id]: true }));
      markNotificationsLocally({ ids: [notification.id] });

      try {
        const snapshot = await markNotificationsRead({ notificationIds: [notification.id] });
        if (snapshot) {
          applyNotifications(snapshot);
        }
        setNotificationsError(null);
      } catch (error) {
        setNotificationsError(error instanceof Error ? error.message : 'Falha ao atualizar a notificação.');
        await loadNotifications();
      } finally {
        setNotificationBusyIds((current) => {
          const next = { ...current };
          delete next[notification.id];
          return next;
        });
      }
    }

    if (notification.actionRoute) {
      setNotificationsVisible(false);
      router.push(notification.actionRoute as any);
    }
  }

  async function handleMarkAllNotificationsRead() {
    if (notificationsMarkingAll || notificationsSnapshot.unreadCount === 0) return;

    setNotificationsMarkingAll(true);
    markNotificationsLocally({ markAll: true });

    try {
      const snapshot = await markNotificationsRead({ markAll: true });
      if (snapshot) {
        applyNotifications(snapshot);
      }
      setNotificationsError(null);
    } catch (error) {
      setNotificationsError(error instanceof Error ? error.message : 'Falha ao marcar as notificações.');
      await loadNotifications();
    } finally {
      setNotificationsMarkingAll(false);
    }
  }

  const calories = totals ? Math.round(extractNum(totals.calories)) : 0;
  const protein = totals ? Math.round(extractNum(totals.protein)) : 0;
  const carbs = totals ? Math.round(extractNum(totals.carbs)) : 0;
  const fat = totals ? Math.round(extractNum(totals.fat)) : 0;

  const goalItems = buildGoalItems(calories, protein, carbs, fat, nutritionGoals);
  const calorieGoal = goalItems.find((item) => item.key === 'calories') ?? null;
  const macroGoalItems = goalItems.filter((item) => item.key !== 'calories');
  const hasAnyGoals = goalItems.length > 0;
  const progress = hasAnyGoals ? goalItems.reduce((sum, item) => sum + item.progress, 0) / goalItems.length : 0;
  const dashboardDateLabel = isTodayDate(selectedDate) ? 'Hoje' : 'Dia selecionado';
  const dashboardSupportText = isTodayDate(selectedDate)
    ? 'Tudo importante do seu dia em um so lugar.'
    : 'Revise outra data sem perder o contexto.';
  const heroTitle = hasAnyGoals ? 'Metas e macros' : 'Nutrição do dia';
  const heroBadgeValue = meals.length;
  const heroBadgeLabel = meals.length === 1 ? 'refeição' : 'refeições';
  const calorieBadgeValue = calorieGoal ? `${Math.round(calorieGoal.progress * 100)}%` : `${Math.round(progress * 100)}%`;
  const calorieBadgeLabel = calorieGoal ? 'da meta' : 'do plano';
  const calorieSummaryText = calorieGoal
    ? calorieGoal.reached
      ? 'Meta calórica concluída.'
      : `${Math.round(calorieGoal.remaining)} kcal restantes.`
    : hasAnyGoals
      ? `${goalItems.length} metas ativas para esta data.`
      : 'Cadastre metas para acompanhar melhor o seu dia.';
  const calorieSecondaryText = calorieGoal
    ? `Meta ${Math.round(calorieGoal.goal)} kcal`
    : meals.length > 0
      ? `${meals.length} ${meals.length === 1 ? 'registro' : 'registros'} em ${formatDateChip(selectedDate)}`
      : `Sem registros em ${formatDateChip(selectedDate)}`;

  const hydrationGoal = hydrationGoalMl > 0 ? hydrationGoalMl : null;
  const hydrationProgress = hydrationGoal ? clamp(hydrationMl / hydrationGoal, 0, 1) : 0;

  const hydrationRemaining = waterStatus ? Math.max(0, waterStatus.remainingMl) : null;
  const lastWaterEvent =
    waterStatus && waterStatus.events.length > 0 ? waterStatus.events[waterStatus.events.length - 1] : null;
  const hydrationStatusText = hydrationGoal
    ? waterStatus?.goalReached
      ? 'Meta de água concluída hoje.'
      : hydrationRemaining !== null
        ? `Faltam ${Math.round(hydrationRemaining)} ml para fechar a meta.`
        : `Meta de ${formatLiters(hydrationGoal)} pronta para acompanhar.`
    : 'Defina uma meta na engrenagem para acompanhar seu progresso.';
  const hydrationEventText = lastWaterEvent
    ? `Último ajuste ${lastWaterEvent.deltaMl >= 0 ? '+' : ''}${Math.round(lastWaterEvent.deltaMl)} ml às ${formatWaterEventTime(lastWaterEvent)}.`
    : 'Ajuste a água com um toque nos botões abaixo.';
  const mealSummaries = buildMealSummaries(meals);
  const unreadNotificationsCount = notificationsSnapshot.unreadCount;

  useEffect(() => {
    Animated.timing(dayAnim, { toValue: progress, duration: 450, useNativeDriver: false }).start();
  }, [dayAnim, progress]);

  useEffect(() => {
    Animated.timing(hydrationAnim, { toValue: hydrationProgress, duration: 320, useNativeDriver: false }).start();
  }, [hydrationAnim, hydrationProgress]);

  const dayWidth = dayAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const hydrationWidth = hydrationAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const hydrationScale = hydrationPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] });

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Brand.bg} />
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingTop: insets.top + Spacing.sm, paddingBottom: 140 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View style={s.header}>
          <View style={s.headerRow}>
            <View style={s.profile}>
              <Pressable style={({ pressed }) => [s.avatarButton, pressed && s.pressed]} onPress={() => setProfileVisible(true)}>
                {user?.profileImageUrl ? (
                  <Image source={{ uri: user.profileImageUrl }} style={s.avatar} />
                ) : (
                  <View style={s.avatarFallback}><Text style={s.avatarText}>{(user?.username ?? 'V').charAt(0).toUpperCase()}</Text></View>
                )}
              </Pressable>
              <View style={{ flex: 1 }}>
                <Text style={s.greeting}>{greeting()}{user ? `, ${user.username}` : ''}</Text>
                <Text style={s.date}>{dashboardSupportText}</Text>
              </View>
            </View>
            <View style={s.actions}>
              <Pressable style={({ pressed }) => [s.iconBtn, pressed && s.pressed]} onPress={() => router.push('/(tabs)/history' as any)}>
                <Ionicons name="stats-chart-outline" size={18} color={Brand.text} />
              </Pressable>
              <Pressable style={({ pressed }) => [s.iconBtn, pressed && s.pressed]} onPress={handleOpenNotifications}>
                <Ionicons name={unreadNotificationsCount > 0 ? 'notifications' : 'notifications-outline'} size={18} color={Brand.text} />
                {unreadNotificationsCount > 0 ? (
                  <View style={s.notificationBadge}>
                    <Text style={s.notificationBadgeText}>{unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}</Text>
                  </View>
                ) : null}
              </Pressable>
            </View>
          </View>
          <View style={s.dateRail}>
            <Pressable style={({ pressed }) => [s.dateArrow, pressed && s.pressed]} onPress={() => setDate(shiftDate(selectedDate, -1))}>
              <Ionicons name="chevron-back" size={18} color={Brand.greenDark} />
            </Pressable>
            <Pressable style={({ pressed }) => [s.dateCenter, pressed && s.pressed]} onPress={() => setCalendarVisible(true)}>
              <View style={s.dateCenterHeader}>
                <Ionicons name="calendar-outline" size={14} color={Brand.greenDark} />
                <Text style={s.dateCenterLabel}>{dashboardDateLabel}</Text>
              </View>
              <Text style={s.dateCenterValue}>{formatCompactSelectedDate(selectedDate)}</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [s.dateArrow, !canAdvanceDate && s.disabled, pressed && canAdvanceDate && s.pressed]}
              onPress={() => setDate(shiftDate(selectedDate, 1))}
              disabled={!canAdvanceDate}>
              <Ionicons name="chevron-forward" size={18} color={Brand.greenDark} />
            </Pressable>
          </View>
        </View>

        <View style={s.hero}>
          <View pointerEvents="none" style={s.heroGlowTop} />
          <View pointerEvents="none" style={s.heroGlowBottom} />
          <View style={s.heroTop}>
            <View style={s.heroCopy}>
              <Text style={s.heroLabel}>Nutrição</Text>
              <Text style={s.heroTitle}>{heroTitle}</Text>
              <Text style={s.heroSubtitle}>
                {meals.length > 0
                  ? 'Calorias e macros organizados para leitura mais rápida.'
                  : 'Quando você registrar as refeições, o resumo vai ficar bem mais claro aqui.'}
              </Text>
            </View>
            <View style={s.heroBadge}>
              <Text style={s.heroBadgeValue}>{heroBadgeValue}</Text>
              <Text style={s.heroBadgeLabel}>{heroBadgeLabel}</Text>
            </View>
          </View>
          {goalsLoading ? (
            <View style={s.loadingBox}>
              <ActivityIndicator color={Brand.greenDark} size="small" />
              <Text style={s.loadingText}>Carregando metas desta data...</Text>
            </View>
          ) : hasAnyGoals ? (
            <>
              <View style={s.calorieSpotlight}>
                <View style={s.calorieSpotlightCopy}>
                  <Text style={s.calorieSpotlightLabel}>Calorias</Text>
                  <View style={s.calorieSpotlightRow}>
                    <Text style={s.calorieSpotlightValue}>{calories}</Text>
                    <Text style={s.calorieSpotlightUnit}>kcal</Text>
                  </View>
                </View>
                <View style={s.calorieBadge}>
                  <Text style={s.calorieBadgeValue}>{calorieBadgeValue}</Text>
                  <Text style={s.calorieBadgeLabel}>{calorieBadgeLabel}</Text>
                </View>
              </View>
              <View style={s.track}><Animated.View style={[s.fill, { width: dayWidth }]} /></View>
              <View style={s.heroMetaRow}>
                <View style={[s.heroMetaChip, s.heroMetaChipPrimary]}>
                  <Text style={[s.heroMetaChipText, s.heroMetaChipTextPrimary]}>{calorieSummaryText}</Text>
                </View>
                <View style={s.heroMetaChip}>
                  <Text style={s.heroMetaChipText}>{calorieSecondaryText}</Text>
                </View>
              </View>
              <View style={s.macroSection}>
                <View style={s.rowBetween}>
                  <Text style={s.sectionMiniTitle}>Macros</Text>
                  {macroGoalItems.length > 0 ? <Text style={s.counter}>{macroGoalItems.length} ativos</Text> : null}
                </View>
                {macroGoalItems.length > 0 ? (
                  macroGoalItems.map((item) => (
                    <MacroBar
                      key={item.key}
                      label={item.label}
                      consumed={Math.round(item.consumed)}
                      goal={Math.round(item.goal)}
                      color={item.color}
                      bg={item.bg}
                      unit={item.unit}
                      remaining={Math.round(item.remaining)}
                    />
                  ))
                ) : (
                  <Text style={s.sectionSub}>Cadastre proteina, carboidrato e gordura para acompanhar os macros com mais clareza.</Text>
                )}
              </View>
            </>
          ) : (
            <View style={s.emptyGoalState}>
              <Text style={s.emptyGoalTitle}>Nenhuma meta cadastrada para este dia</Text>
              <Text style={s.emptyGoalText}>Cadastre calorias e macros por data para acompanhar a evolução com a meta correta.</Text>
              <AppButton title="Configurar metas do dia" onPress={() => setGoalsModalVisible(true)} />
            </View>
          )}

          <View style={s.mealSummarySection}>
            <View style={s.rowBetween}>
              <Text style={s.sectionMiniTitle}>Períodos registrados</Text>
              <Text style={s.counter}>
                {meals.length > 0 ? `${meals.length} ${meals.length === 1 ? 'item' : 'itens'}` : 'Sem registros'}
              </Text>
            </View>
            {mealSummaries.length > 0 ? (
              <View style={s.mealSummaryGrid}>
                {mealSummaries.map((item) => (
                  <View key={item.type} style={s.mealSummaryCard}>
                    <View style={s.mealSummaryHeader}>
                      <View style={[s.mealSummaryIcon, { backgroundColor: item.bg }]}>
                        <Ionicons name={item.icon} size={16} color={item.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.mealSummaryLabel}>{item.label}</Text>
                        <Text style={s.mealSummaryCount}>{item.count} {item.count === 1 ? 'registro' : 'registros'}</Text>
                      </View>
                      <Text style={s.mealSummaryCalories}>{Math.round(item.calories)} kcal</Text>
                    </View>
                    <Text style={s.mealSummaryMacros}>
                      P {Math.round(item.protein)}g • C {Math.round(item.carbs)}g • G {Math.round(item.fat)}g
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={s.sectionSub}>Os períodos só aparecem aqui quando houver pratos registrados no dia.</Text>
            )}
          </View>
          <View style={s.heroActions}>
            <Pressable style={({ pressed }) => [s.secondaryChip, pressed && s.pressed]} onPress={() => setGoalsModalVisible(true)}>
              <Ionicons name="sparkles-outline" size={15} color={Brand.greenDark} />
              <Text style={s.secondaryChipText}>{hasAnyGoals ? 'Editar metas' : 'Criar metas'}</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [s.secondaryChip, pressed && s.pressed]} onPress={() => setCalendarVisible(true)}>
              <Ionicons name="calendar-outline" size={15} color={Brand.greenDark} />
              <Text style={s.secondaryChipText}>Trocar dia</Text>
            </Pressable>
          </View>
          {goalsError ? <Text style={s.error}>{goalsError}</Text> : null}
        </View>

        <View style={s.actionCard}>
          <Text style={s.sectionTitle}>Registrar refeição</Text>
          <Text style={s.sectionSub}>Tudo que você salvar aqui entra no resumo de {formatDateChip(selectedDate)}.</Text>
          <AppButton title="Registrar refeição" onPress={() => setRegisterVisible(true)} />
          <View style={s.quickRow}>
            <Shortcut label="Foto" icon="camera-outline" onPress={() => router.push({ pathname: '/(tabs)/devtools', params: { tool: 'photo' } } as any)} />
            <Shortcut label="Buscar" icon="search-outline" onPress={() => router.push({ pathname: '/(tabs)/devtools', params: { tool: 'search' } } as any)} />
          </View>
        </View>

        <View style={s.hydrationCard}>
          <View pointerEvents="none" style={s.hydrationGlowLarge} />
          <View pointerEvents="none" style={s.hydrationGlowSmall} />
          <View style={s.hydrationHeaderRow}>
            <View style={s.hydrationHeaderCopy}>
              <View style={s.hydrationIconWrap}>
                <Ionicons name="water-outline" size={18} color="#0B6B94" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.hydrationTitle}>Hidratação</Text>
                <Text style={s.hydrationHeaderHint}>
                  {hydrationGoal ? `Meta ${formatLiters(hydrationGoal)}` : 'Defina a meta na engrenagem'}
                </Text>
              </View>
            </View>
            <Pressable
              style={({ pressed }) => [s.hydrationSettingsButton, pressed && s.pressed]}
              onPress={() => setHydrationGoalMenuOpen((current) => !current)}>
              <Ionicons name="settings-outline" size={18} color="#0B6B94" />
            </Pressable>
          </View>
          {hydrationLoading ? (
            <View style={s.loadingBox}>
              <ActivityIndicator color={Brand.hydration} size="small" />
              <Text style={s.loadingText}>Carregando água desta data...</Text>
            </View>
          ) : (
            <>
              <View style={s.hydrationTopRow}>
                <View style={s.hydrationMetricGroup}>
                  <Animated.Text style={[s.hydrationHeroValue, { transform: [{ scale: hydrationScale }] }]}>
                    {formatLiters(hydrationMl)}
                  </Animated.Text>
                  <Text style={s.hydrationMetricHint}>
                    {hydrationGoal ? `de ${formatLiters(hydrationGoal)}` : 'sem meta definida'}
                  </Text>
                </View>
                <View style={[s.hydrationProgressBadge, waterStatus?.goalReached && s.hydrationProgressBadgeDone]}>
                  <Text style={[s.hydrationProgressValue, waterStatus?.goalReached && s.hydrationProgressValueDone]}>
                    {Math.round(hydrationProgress * 100)}%
                  </Text>
                  <Text style={[s.hydrationProgressLabel, waterStatus?.goalReached && s.hydrationProgressLabelDone]}>
                    progresso
                  </Text>
                </View>
              </View>
              <View style={s.hydrationTrackShell}>
                <Animated.View style={[s.hydrationTrackFill, { width: hydrationWidth }]} />
              </View>
              <Text style={s.hydrationStatus}>{hydrationStatusText}</Text>
              <View style={s.hydrationActionsGrid}>
                {HYDRATION_QUICK_ACTIONS.map((action) => (
                  <HydrationButton
                    key={action.label}
                    label={action.label}
                    tone={action.tone}
                    onPress={() => sendHydrationUpdate({ deltaMl: action.deltaMl })}
                    disabled={hydrationSaving}
                  />
                ))}
              </View>
              {hydrationGoalMenuOpen ? (
                <View style={s.hydrationGoalMenu}>
                  <Text style={s.hydrationGoalMenuTitle}>Meta diária</Text>
                  <View style={s.hydrationGoalMenuHeader}>
                    <View style={s.hydrationGoalMenuCopy}>
                      <Text style={s.hydrationGoalMenuHint}>Arraste para ajustar entre 1L e 10L. A meta salva ao soltar.</Text>
                    </View>
                    <View style={s.hydrationGoalValueBadge}>
                      <Text style={s.hydrationGoalValue}>{formatLiters(hydrationGoalDraftMl)}</Text>
                      <Text style={s.hydrationGoalValueLabel}>{hydrationSaving ? 'salvando' : 'meta atual'}</Text>
                    </View>
                  </View>
                  <HydrationGoalSlider
                    value={hydrationGoalDraftMl}
                    disabled={hydrationSaving}
                    onChange={handleHydrationGoalDraftChange}
                    onChangeEnd={handleHydrationGoalCommit}
                  />
                  <View style={s.hydrationGoalScale}>
                    <Text style={s.hydrationGoalScaleLabel}>{formatLiters(HYDRATION_GOAL_MIN_ML)}</Text>
                    <Text style={s.hydrationGoalScaleHint}>passos de 100ml</Text>
                    <Text style={s.hydrationGoalScaleLabel}>{formatLiters(HYDRATION_GOAL_MAX_ML)}</Text>
                  </View>
                </View>
              ) : null}
              <Text style={s.hydrationFootnote}>{hydrationEventText}</Text>
            </>
          )}
          {hydrationError ? <Text style={s.error}>{hydrationError}</Text> : null}
        </View>
      </ScrollView>

      <RegisterMealModal visible={registerVisible} defaultDate={selectedDate} onSave={handleSaveNew} onClose={() => setRegisterVisible(false)} />
      <EditProfileModal visible={profileVisible} onClose={() => setProfileVisible(false)} />
      <NotificationCenterModal
        visible={notificationsVisible}
        notifications={notificationsSnapshot.notifications}
        unreadCount={notificationsSnapshot.unreadCount}
        loading={notificationsLoading}
        error={notificationsError}
        busyIds={notificationBusyIds}
        markingAll={notificationsMarkingAll}
        onClose={() => setNotificationsVisible(false)}
        onRefresh={loadNotifications}
        onPressNotification={handlePressNotification}
        onMarkAllRead={handleMarkAllNotificationsRead}
      />
      <CalendarPickerModal
        visible={calendarVisible}
        currentDate={selectedDate}
        maxDate={today}
        title="Selecionar dia do painel"
        onSelect={(date) => setDate(date)}
        onClose={() => setCalendarVisible(false)}
      />
      <NutritionGoalsModal visible={goalsModalVisible} dateLabel={formatDateForModal(selectedDate)} currentGoals={nutritionGoals?.goals ?? null} goalInherited={nutritionGoals?.goalInherited} saving={goalsSaving} onSave={handleSaveGoals} onClose={() => setGoalsModalVisible(false)} />
    </View>
  );
}

function Shortcut({ label, icon, onPress }: { label: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void }) {
  return (
    <Pressable style={({ pressed }) => [s.shortcut, pressed && s.pressed]} onPress={onPress}>
      <Ionicons name={icon} size={15} color={Brand.greenDark} />
      <Text style={s.shortcutText}>{label}</Text>
    </Pressable>
  );
}

function HydrationButton({
  label,
  onPress,
  disabled,
  tone = 'positive',
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: 'positive' | 'negative';
}) {
  return (
    <Pressable
      disabled={disabled}
      style={({ pressed }) => [
        s.waterBtn,
        tone === 'positive' ? s.waterBtnPositive : s.waterBtnNegative,
        disabled && s.disabled,
        pressed && s.pressed,
      ]}
      onPress={onPress}>
      <Text style={[s.waterBtnText, tone === 'positive' ? s.waterBtnTextPositive : s.waterBtnTextNegative]}>{label}</Text>
    </Pressable>
  );
}

function HydrationGoalSlider({
  value,
  disabled,
  onChange,
  onChangeEnd,
}: {
  value: number;
  disabled?: boolean;
  onChange: (goalMl: number) => void;
  onChangeEnd: (goalMl: number) => void;
}) {
  const [trackWidth, setTrackWidth] = useState(0);

  const valueRef = useRef(value);
  const trackWidthRef = useRef(trackWidth);
  const disabledRef = useRef(Boolean(disabled));
  const onChangeRef = useRef(onChange);
  const onChangeEndRef = useRef(onChangeEnd);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    trackWidthRef.current = trackWidth;
  }, [trackWidth]);

  useEffect(() => {
    disabledRef.current = Boolean(disabled);
  }, [disabled]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onChangeEndRef.current = onChangeEnd;
  }, [onChangeEnd]);

  const updateGoalFromLocation = useCallback((locationX: number, commit = false) => {
    const width = trackWidthRef.current;
    const nextValue = width > 0 ? hydrationGoalFromRatio(locationX / width) : valueRef.current;

    valueRef.current = nextValue;
    onChangeRef.current(nextValue);

    if (commit) {
      onChangeEndRef.current(nextValue);
    }
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabledRef.current,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        !disabledRef.current && Math.abs(gestureState.dx) >= Math.abs(gestureState.dy),
      onPanResponderGrant: (event) => updateGoalFromLocation(event.nativeEvent.locationX),
      onPanResponderMove: (event) => updateGoalFromLocation(event.nativeEvent.locationX),
      onPanResponderRelease: (event) => updateGoalFromLocation(event.nativeEvent.locationX, true),
      onPanResponderTerminate: (event) => updateGoalFromLocation(event.nativeEvent.locationX, true),
      onPanResponderTerminationRequest: () => true,
    }),
  ).current;

  function handleTrackLayout(event: LayoutChangeEvent) {
    setTrackWidth(event.nativeEvent.layout.width);
  }

  const progress = hydrationGoalRatio(value);
  const thumbLeft = trackWidth > 0 ? progress * trackWidth : 0;

  return (
    <View style={[s.hydrationGoalSliderWrap, disabled && s.disabled]}>
      <View style={s.hydrationGoalSliderTapArea} onLayout={handleTrackLayout} {...panResponder.panHandlers}>
        <View style={s.hydrationGoalSliderTrack}>
          <View style={[s.hydrationGoalSliderFill, { width: `${Math.round(progress * 100)}%` }]} />
        </View>
        <View style={[s.hydrationGoalSliderThumb, { left: thumbLeft - 14 }]} />
      </View>
    </View>
  );
}

function MacroBar({
  label,
  consumed,
  goal,
  color,
  bg,
  unit,
  remaining,
}: {
  label: string;
  consumed: number;
  goal: number;
  color: string;
  bg: string;
  unit: string;
  remaining: number;
}) {
  const ratio = goal <= 0 ? 0 : clamp(consumed / goal, 0, 1);
  return (
    <View style={s.macroCard}>
      <View style={s.rowBetween}><Text style={s.macroLabel}>{label}</Text><Text style={s.macroValue}>{formatMetricValue(consumed, unit)} / {formatMetricValue(goal, unit)}</Text></View>
      <View style={[s.macroTrack, { backgroundColor: bg }]}><View style={[s.macroFill, { backgroundColor: color, width: `${Math.round(ratio * 100)}%` }]} /></View>
      <Text style={s.macroHint}>{consumed >= goal ? 'Meta concluída.' : `${remaining}${unit} restantes.`}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Brand.bg },
  scroll: { paddingHorizontal: Spacing.md, gap: Spacing.sm },

  header: {
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#D7ECDD',
    backgroundColor: '#EEF7F1',
    padding: 16,
    gap: 14,
    ...Shadows.card,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  avatarButton: { borderRadius: 24 },
  avatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: '#FFFFFF' },
  avatarFallback: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: Brand.green, borderWidth: 2, borderColor: '#FFFFFF' },
  avatarText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  greeting: { ...Typography.subtitle, color: Brand.text, fontWeight: '800' },
  date: { ...Typography.caption, color: Brand.textSecondary, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.9)', borderWidth: 1, borderColor: '#FFFFFF', position: 'relative' },
  notificationBadge: { position: 'absolute', top: -5, right: -4, minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4, backgroundColor: Brand.danger, borderWidth: 2, borderColor: '#E6F4EA', alignItems: 'center', justifyContent: 'center' },
  notificationBadgeText: { ...Typography.caption, color: '#FFFFFF', fontWeight: '800', fontSize: 9, lineHeight: 10 },
  dateRail: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dateArrow: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.9)', borderWidth: 1, borderColor: '#D6E8DB' },
  dateCenter: { flex: 1, borderRadius: 22, borderWidth: 1, borderColor: '#D6E8DB', backgroundColor: 'rgba(255,255,255,0.96)', paddingHorizontal: 14, paddingVertical: 12, gap: 4 },
  dateCenterHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateCenterLabel: { ...Typography.caption, color: Brand.greenDark, textTransform: 'uppercase', fontWeight: '700' },
  dateCenterValue: { ...Typography.subtitle, color: Brand.text, fontWeight: '800' },
  headerPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { borderRadius: Radii.pill, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: 'rgba(255,255,255,0.82)', borderWidth: 1, borderColor: '#D1E7D8' },
  pillText: { ...Typography.caption, color: Brand.greenDeeper, fontWeight: '700' },

  hero: {
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#DDE9E0',
    backgroundColor: '#FCFDFC',
    padding: 18,
    gap: 14,
    overflow: 'hidden',
    position: 'relative',
    ...Shadows.soft,
  },
  heroGlowTop: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(198, 239, 214, 0.45)',
    top: -80,
    right: -40,
  },
  heroGlowBottom: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(232, 246, 237, 0.8)',
    bottom: -40,
    left: -16,
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  heroCopy: { gap: 4, flex: 1 },
  heroLabel: { ...Typography.caption, color: Brand.greenDark, textTransform: 'uppercase', fontWeight: '700' },
  heroTitle: { ...Typography.title, color: Brand.text, fontSize: 24, lineHeight: 28 },
  heroSubtitle: { ...Typography.helper, color: Brand.textSecondary, lineHeight: 18 },
  heroBadge: {
    minWidth: 78,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#D7EBDD',
    backgroundColor: 'rgba(255,255,255,0.88)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  heroBadgeValue: { ...Typography.subtitle, color: Brand.greenDark, fontWeight: '800' },
  heroBadgeLabel: { ...Typography.caption, color: Brand.textSecondary, fontWeight: '700' },
  score: { width: 70, height: 70, borderRadius: 35, borderWidth: 1, borderColor: '#DCEADC', backgroundColor: '#F5FBF6', alignItems: 'center', justifyContent: 'center' },
  scoreValue: { ...Typography.subtitle, color: Brand.greenDark, fontWeight: '800' },
  scoreLabel: { ...Typography.caption, color: Brand.textSecondary, fontSize: 10 },
  loadingBox: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  loadingText: { ...Typography.helper, color: Brand.textSecondary },
  calorieSpotlight: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2ECE5',
    backgroundColor: 'rgba(255,255,255,0.84)',
    padding: 14,
  },
  calorieSpotlightCopy: { gap: 4, flex: 1 },
  calorieSpotlightLabel: { ...Typography.caption, color: Brand.textSecondary, textTransform: 'uppercase', fontWeight: '700' },
  calorieSpotlightRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  calorieSpotlightValue: { ...Typography.hero, color: Brand.text, fontSize: 40, lineHeight: 42 },
  calorieSpotlightUnit: { ...Typography.body, color: Brand.textSecondary, fontWeight: '700' },
  calorieBadge: {
    minWidth: 84,
    borderRadius: 22,
    backgroundColor: '#EAF7EE',
    borderWidth: 1,
    borderColor: '#D3E9DA',
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  calorieBadgeValue: { ...Typography.subtitle, color: Brand.greenDark, fontWeight: '800' },
  calorieBadgeLabel: { ...Typography.caption, color: Brand.textSecondary, textTransform: 'uppercase', fontWeight: '700' },
  track: { height: 11, borderRadius: Radii.pill, backgroundColor: '#DDEADF', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: Radii.pill, backgroundColor: Brand.green },
  hint: { ...Typography.caption, color: Brand.textSecondary, fontWeight: '700' },
  heroMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  heroMetaChip: {
    flexGrow: 1,
    minWidth: 140,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E3ECE5',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  heroMetaChipPrimary: {
    backgroundColor: '#F3FAF5',
    borderColor: '#D8ECDD',
  },
  heroMetaChipText: { ...Typography.caption, color: Brand.textSecondary, fontWeight: '700' },
  heroMetaChipTextPrimary: { color: Brand.greenDeeper },
  macroSection: { gap: 10 },
  emptyGoalState: { borderRadius: Radii.lg, borderWidth: 1, borderColor: '#D9E8DD', backgroundColor: '#F7FBF8', padding: 16, gap: 10 },
  emptyGoalTitle: { ...Typography.body, color: Brand.text, fontWeight: '700' },
  emptyGoalText: { ...Typography.helper, color: Brand.textSecondary },
  timelineBox: { borderTopWidth: 1, borderTopColor: '#E7EEE8', paddingTop: 8, gap: 6 },
  timelineItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: Radii.md, borderWidth: 1, borderColor: '#E8EFE8', backgroundColor: '#FAFCFA', paddingHorizontal: 10, paddingVertical: 7 },
  timelineLabel: { ...Typography.body, color: Brand.text, fontWeight: '600', fontSize: 14 },
  timelineStatus: { ...Typography.subtitle, fontWeight: '800', minWidth: 18, textAlign: 'center' },
  timelineDone: { color: Brand.greenDark },
  timelinePending: { color: Brand.textMuted },
  mealSummarySection: { borderTopWidth: 1, borderTopColor: '#E7EEE8', paddingTop: 12, gap: 10 },
  mealSummaryGrid: { gap: 8 },
  mealSummaryCard: { borderRadius: Radii.md, borderWidth: 1, borderColor: '#E6ECE7', backgroundColor: '#FAFCFA', padding: 12, gap: 8 },
  mealSummaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mealSummaryIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  mealSummaryLabel: { ...Typography.body, color: Brand.text, fontWeight: '700' },
  mealSummaryCount: { ...Typography.caption, color: Brand.textSecondary },
  mealSummaryCalories: { ...Typography.caption, color: Brand.greenDark, fontWeight: '800' },
  mealSummaryMacros: { ...Typography.caption, color: Brand.textSecondary, fontWeight: '700' },
  heroActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  secondaryChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: Radii.pill, borderWidth: 1, borderColor: '#D9E8DD', backgroundColor: '#F8FCF8', paddingHorizontal: 12, paddingVertical: 8 },
  secondaryChipText: { ...Typography.caption, color: Brand.greenDark, fontWeight: '700' },

  actionCard: { borderRadius: Radii.lg, borderWidth: 1, borderColor: '#CCE4D4', backgroundColor: '#EBF8EF', padding: 16, gap: 10, ...Shadows.card },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  shortcut: { borderRadius: Radii.pill, borderWidth: 1, borderColor: '#D3E8DA', backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 6 },
  shortcutText: { ...Typography.caption, color: Brand.greenDeeper, fontWeight: '700' },

  card: { borderRadius: Radii.lg, borderWidth: 1, borderColor: Brand.border, backgroundColor: Brand.card, padding: 16, gap: 10, ...Shadows.card },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  sectionTitle: { ...Typography.subtitle, color: Brand.text, fontWeight: '800' },
  sectionMiniTitle: { ...Typography.caption, color: Brand.textSecondary, textTransform: 'uppercase', fontWeight: '700' },
  sectionSub: { ...Typography.helper, color: Brand.textSecondary },
  hydrationCard: {
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#C6E8F8',
    backgroundColor: '#F7FCFF',
    padding: 16,
    gap: 12,
    overflow: 'hidden',
    position: 'relative',
    ...Shadows.card,
  },
  hydrationGlowLarge: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(110, 208, 255, 0.18)',
    top: -70,
    right: -40,
  },
  hydrationGlowSmall: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    bottom: -30,
    left: -20,
  },
  hydrationHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  hydrationHeaderCopy: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  hydrationIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.74)',
    borderWidth: 1,
    borderColor: '#D7EFFA',
  },
  hydrationTitle: { ...Typography.subtitle, color: '#083B58', fontWeight: '800' },
  hydrationHeaderHint: { ...Typography.caption, color: '#4F7E9A', fontWeight: '700' },
  hydrationSettingsButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: '#D7EFFA',
  },
  hydrationTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  hydrationMetricGroup: { gap: 2, flex: 1 },
  hydrationHeroValue: { ...Typography.hero, color: '#0D5F8E', fontSize: 36, lineHeight: 40 },
  hydrationMetricHint: { ...Typography.helper, color: '#56819A', fontWeight: '600' },
  hydrationProgressBadge: {
    minWidth: 76,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderWidth: 1,
    borderColor: '#D2ECFA',
    paddingHorizontal: 12,
    paddingVertical: 9,
    alignItems: 'center',
  },
  hydrationProgressBadgeDone: { backgroundColor: '#0B6B94', borderColor: '#0B6B94' },
  hydrationProgressValue: { ...Typography.subtitle, color: '#0B6B94', fontWeight: '800' },
  hydrationProgressValueDone: { color: '#FFFFFF' },
  hydrationProgressLabel: { ...Typography.caption, color: '#5F88A1', textTransform: 'uppercase', fontWeight: '700' },
  hydrationProgressLabelDone: { color: 'rgba(255,255,255,0.78)' },
  hydrationTrackShell: {
    height: 10,
    borderRadius: Radii.pill,
    backgroundColor: 'rgba(166, 221, 245, 0.5)',
    overflow: 'hidden',
  },
  hydrationTrackFill: {
    height: '100%',
    borderRadius: Radii.pill,
    backgroundColor: '#1AA6E8',
  },
  hydrationStatus: { ...Typography.body, color: '#134B6A', fontWeight: '700' },
  hydrationActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  waterBtn: {
    flexGrow: 1,
    minWidth: 132,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waterBtnPositive: {
    borderColor: '#0F88BF',
    backgroundColor: '#0F88BF',
    ...Shadows.soft,
  },
  waterBtnNegative: {
    borderColor: '#CFE7F5',
    backgroundColor: 'rgba(255,255,255,0.82)',
  },
  waterBtnText: { ...Typography.body, fontWeight: '800' },
  waterBtnTextPositive: { color: '#FFFFFF' },
  waterBtnTextNegative: { color: '#1A678F' },
  hydrationGoalMenu: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D4ECF8',
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 12,
    gap: 10,
  },
  hydrationGoalMenuTitle: { ...Typography.caption, color: '#4C7892', textTransform: 'uppercase', fontWeight: '700' },
  hydrationGoalMenuHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  hydrationGoalMenuCopy: { flex: 1 },
  hydrationGoalMenuHint: { ...Typography.helper, color: '#4C7892' },
  hydrationGoalValueBadge: {
    minWidth: 88,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D3EAF7',
    backgroundColor: '#F5FBFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  hydrationGoalValue: { ...Typography.subtitle, color: '#0D5F8E', fontWeight: '800' },
  hydrationGoalValueLabel: { ...Typography.caption, color: '#5C88A2', textTransform: 'uppercase', fontWeight: '700' },
  hydrationGoalSliderWrap: { gap: 10 },
  hydrationGoalSliderTapArea: { paddingVertical: 10, justifyContent: 'center' },
  hydrationGoalSliderTrack: {
    height: 8,
    borderRadius: Radii.pill,
    backgroundColor: '#D8EEF8',
    overflow: 'hidden',
  },
  hydrationGoalSliderFill: {
    height: '100%',
    borderRadius: Radii.pill,
    backgroundColor: '#1AA6E8',
  },
  hydrationGoalSliderThumb: {
    position: 'absolute',
    top: '50%',
    width: 28,
    height: 28,
    marginTop: -14,
    borderRadius: 14,
    borderWidth: 4,
    borderColor: '#D8F3FF',
    backgroundColor: '#0B6B94',
    ...Shadows.soft,
  },
  hydrationGoalScale: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  hydrationGoalScaleLabel: { ...Typography.caption, color: '#386D8A', fontWeight: '700' },
  hydrationGoalScaleHint: { ...Typography.caption, color: '#6C95AC', fontWeight: '700' },
  hydrationFootnote: { ...Typography.caption, color: '#5D86A1', fontWeight: '700' },
  error: { ...Typography.caption, color: Brand.danger, fontWeight: '700' },

  counter: { ...Typography.caption, color: Brand.textSecondary, textTransform: 'uppercase', fontWeight: '700' },
  insight: { ...Typography.body, color: Brand.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: Radii.pill, borderWidth: 1, borderColor: '#DDEBDD', backgroundColor: '#FFFFFF', paddingHorizontal: 10, paddingVertical: 6 },
  chipText: { ...Typography.caption, color: Brand.greenDeeper, fontWeight: '700' },
  habitRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  habit: { flexGrow: 1, minWidth: 95, borderRadius: Radii.md, borderWidth: 1, borderColor: '#DDEBDD', backgroundColor: '#FFFFFF', paddingHorizontal: 10, paddingVertical: 10 },
  habitValue: { ...Typography.subtitle, color: Brand.text, fontWeight: '800' },
  habitLabel: { ...Typography.caption, color: Brand.textSecondary, fontWeight: '700' },

  macroCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5ECE6',
    backgroundColor: '#FFFFFF',
    padding: 12,
    gap: 6,
  },
  macroLabel: { ...Typography.caption, color: Brand.text, fontWeight: '700' },
  macroValue: { ...Typography.caption, color: Brand.textSecondary, fontWeight: '700' },
  macroTrack: { height: 8, borderRadius: Radii.pill, overflow: 'hidden' },
  macroFill: { height: '100%', borderRadius: Radii.pill },
  macroHint: { ...Typography.caption, color: Brand.textSecondary },

  empty: { borderRadius: Radii.md, borderWidth: 1, borderColor: Brand.border, backgroundColor: Brand.surfaceAlt, padding: 14, gap: 8, alignItems: 'center' },
  emptyTitle: { ...Typography.body, color: Brand.text, fontWeight: '700', textAlign: 'center' },
  emptySub: { ...Typography.caption, color: Brand.textSecondary, textAlign: 'center', lineHeight: 17 },

  saved: { width: 152, borderRadius: Radii.md, borderWidth: 1, borderColor: '#E0EBE1', backgroundColor: '#F9FCF9', padding: 10, gap: 6 },
  savedImg: { width: '100%', height: 78, borderRadius: 12 },
  savedFallback: { width: '100%', height: 78, borderRadius: 12, borderWidth: 1, borderColor: Brand.border, backgroundColor: Brand.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  savedTitle: { ...Typography.body, color: Brand.text, fontWeight: '700', minHeight: 38, lineHeight: 18 },
  savedCal: { ...Typography.caption, color: Brand.greenDark, fontWeight: '800' },
  savedMacro: { ...Typography.caption, color: Brand.textSecondary, fontSize: 10 },

  link: { ...Typography.caption, color: Brand.greenDark, fontWeight: '700' },
  disabled: { opacity: 0.56 },
  pressed: { opacity: 0.82 },
});

