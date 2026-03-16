import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';

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
import { getWaterStatus, saveWaterStatus, type WaterStatus } from '@/services/water';
import type { MealType, NutritionData } from '@/types/nutrition';
import { buildFoodsString, extractNum, todayStr } from '@/utils/helpers';
import { getHydrationGoalDraftMl, normalizeHydrationGoalMl } from '@/utils/hydration';
import {
  buildGoalItems,
  buildMealSummaries,
  clamp,
  formatDateChip,
  formatLiters,
  formatWaterEventTime,
  isTodayDate,
  sortNotifications,
} from '@/features/home/home-utils';

type SaveMealParams = {
  foods: string;
  mealType: MealType;
  date?: string;
  time?: string;
  nutrition: NutritionData;
  dishName?: string;
  imageBase64?: string | null;
};

type SaveGoalsUpdates = Partial<{
  caloriesGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
}>;

type Props = {
  onNavigate: (route: string) => void;
};

export function useHomeScreen({ onNavigate }: Props) {
  const today = todayStr();
  const { user } = useAuth();
  const { meals, totals, add, refresh, date: selectedDate, setDate } = useMeals();

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

  const dayAnim = useRef(new Animated.Value(0)).current;
  const hydrationAnim = useRef(new Animated.Value(0)).current;
  const hydrationPulse = useRef(new Animated.Value(0)).current;

  const canAdvanceDate = selectedDate < today;

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
      setNotificationsError(error instanceof Error ? error.message : 'Falha ao carregar notificacoes.');
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

  async function handleSaveNew(params: SaveMealParams) {
    await add(
      buildFoodsString(params.dishName, params.foods),
      params.mealType,
      params.nutrition,
      params.time,
      params.date,
      params.imageBase64,
    );
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

  async function handleSaveGoals(updates: SaveGoalsUpdates) {
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
        setNotificationsError(error instanceof Error ? error.message : 'Falha ao atualizar a notificacao.');
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
      onNavigate(notification.actionRoute);
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
      setNotificationsError(error instanceof Error ? error.message : 'Falha ao marcar as notificacoes.');
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
  const heroTitle = hasAnyGoals ? 'Metas e macros' : 'Nutricao do dia';
  const calorieBadgeValue = calorieGoal ? `${Math.round(calorieGoal.progress * 100)}%` : `${Math.round(progress * 100)}%`;
  const calorieBadgeLabel = calorieGoal ? 'da meta' : 'do plano';
  const calorieSummaryText = calorieGoal
    ? calorieGoal.reached
      ? 'Meta calorica concluida.'
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
      ? 'Meta de agua concluida hoje.'
      : hydrationRemaining !== null
        ? `Faltam ${Math.round(hydrationRemaining)} ml para fechar a meta.`
        : `Meta de ${formatLiters(hydrationGoal)} pronta para acompanhar.`
    : 'Defina uma meta na engrenagem para acompanhar seu progresso.';
  const hydrationEventText = lastWaterEvent
    ? `Ultimo ajuste ${lastWaterEvent.deltaMl >= 0 ? '+' : ''}${Math.round(lastWaterEvent.deltaMl)} ml as ${formatWaterEventTime(lastWaterEvent)}.`
    : 'Ajuste a agua com um toque nos botoes abaixo.';

  const mealSummaries = buildMealSummaries(meals);
  const unreadNotificationsCount = notificationsSnapshot.unreadCount;
  const dayWidth = dayAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const hydrationWidth = hydrationAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const hydrationScale = hydrationPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] });

  useEffect(() => {
    Animated.timing(dayAnim, { toValue: progress, duration: 450, useNativeDriver: false }).start();
  }, [dayAnim, progress]);

  useEffect(() => {
    Animated.timing(hydrationAnim, { toValue: hydrationProgress, duration: 320, useNativeDriver: false }).start();
  }, [hydrationAnim, hydrationProgress]);

  return {
    user,
    today,
    meals,
    selectedDate,
    setDate,
    canAdvanceDate,
    registerVisible,
    setRegisterVisible,
    profileVisible,
    setProfileVisible,
    notificationsVisible,
    setNotificationsVisible,
    calendarVisible,
    setCalendarVisible,
    goalsModalVisible,
    setGoalsModalVisible,
    dashboardDateLabel,
    dashboardSupportText,
    heroTitle,
    goalsLoading,
    hasAnyGoals,
    calories,
    calorieBadgeValue,
    calorieBadgeLabel,
    calorieSummaryText,
    calorieSecondaryText,
    macroGoalItems,
    mealSummaries,
    dayWidth,
    goalsError,
    hydrationLoading,
    hydrationSaving,
    hydrationMl,
    hydrationGoal,
    hydrationProgress,
    waterStatus,
    hydrationStatusText,
    hydrationEventText,
    hydrationGoalMenuOpen,
    setHydrationGoalMenuOpen,
    hydrationGoalDraftMl,
    hydrationWidth,
    hydrationScale,
    hydrationError,
    notificationsSnapshot,
    notificationsLoading,
    notificationsError,
    notificationBusyIds,
    notificationsMarkingAll,
    nutritionGoals,
    goalsSaving,
    unreadNotificationsCount,
    handleSaveNew,
    handleOpenNotifications,
    handlePressNotification,
    handleMarkAllNotificationsRead,
    handleHydrationGoalDraftChange,
    handleHydrationGoalCommit,
    sendHydrationUpdate,
    handleSaveGoals,
  };
}
