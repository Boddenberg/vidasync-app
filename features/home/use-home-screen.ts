import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';

import { useAuth } from '@/hooks/use-auth';
import { useMeals } from '@/hooks/use-meals';
import {
  countUnreadNotifications,
  getNotifications,
  isNotificationVisible,
  markNotificationsDeleted,
  markNotificationsRead,
  type AppNotification,
  type NotificationsUpdate,
  type NotificationsSnapshot,
  mergeNotificationPatch,
} from '@/services/notifications';
import {
  getNutritionGoals,
  saveNutritionGoals,
  type NutritionGoalsStatus,
} from '@/services/nutrition-goals';
import { getWaterStatus, saveWaterStatus, type WaterStatus } from '@/services/water';
import type { Meal, MealType, NutritionData } from '@/types/nutrition';
import { buildFoodsString, extractNum, todayStr } from '@/utils/helpers';
import { getHydrationGoalDraftMl, normalizeHydrationGoalMl } from '@/utils/hydration';
import {
  buildGoalItems,
  buildMealSummaries,
  clamp,
  formatDateChip,
  formatHomeDateLabel,
  formatLiters,
  shiftDate,
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

type NotificationBusyAction = 'read' | 'delete';

export function useHomeScreen({ onNavigate }: Props) {
  const today = todayStr();
  const { user } = useAuth();
  const { meals, totals, add, edit, remove, refresh, date: selectedDate, setDate } = useMeals();

  const [registerVisible, setRegisterVisible] = useState(false);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [editVisible, setEditVisible] = useState(false);
  const [profileVisible, setProfileVisible] = useState(false);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [notificationDetailVisible, setNotificationDetailVisible] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<AppNotification | null>(null);
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
  const [notificationBusyActions, setNotificationBusyActions] = useState<Record<string, NotificationBusyAction>>({});
  const [notificationsMarkingAll, setNotificationsMarkingAll] = useState(false);
  const [notificationsDeletingAll, setNotificationsDeletingAll] = useState(false);

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
      setHydrationError(error instanceof Error ? error.message : 'Falha ao carregar hidratação.');
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

  const replaceNotifications = useCallback((snapshot: NotificationsSnapshot) => {
    setNotificationsSnapshot({
      notifications: sortNotifications(snapshot.notifications),
      unreadCount: snapshot.unreadCount,
    });
  }, []);

  const mergeNotificationsUpdate = useCallback((update: NotificationsUpdate) => {
    setNotificationsSnapshot((current) => {
      if (update.notifications.length === 0 && update.unreadCount === null) {
        return current;
      }

      const notificationsById = new Map<string, AppNotification>(
        current.notifications.map((item) => [item.id, item]),
      );
      update.notifications.forEach((patch) => {
        const merged = mergeNotificationPatch(notificationsById.get(patch.id), patch);
        if (merged) {
          notificationsById.set(patch.id, merged);
        }
      });

      const notifications = sortNotifications(Array.from(notificationsById.values()));
      return {
        notifications,
        unreadCount: update.unreadCount ?? countUnreadNotifications(notifications),
      };
    });
  }, []);

  const loadNotifications = useCallback(async () => {
    setNotificationsLoading(true);

    try {
      replaceNotifications(await getNotifications());
      setNotificationsError(null);
    } catch (error) {
      setNotificationsError(error instanceof Error ? error.message : 'Falha ao carregar notificações.');
    } finally {
      setNotificationsLoading(false);
    }
  }, [replaceNotifications]);

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

  useEffect(() => {
    setSelectedNotification((current) => {
      if (!current) return current;
      return notificationsSnapshot.notifications.find((item) => item.id === current.id) ?? current;
    });
  }, [notificationsSnapshot.notifications]);

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

  function handleEditMeal(meal: Meal) {
    setEditingMeal(meal);
    setEditVisible(true);
  }

  function handleCloseEditMeal() {
    setEditingMeal(null);
    setEditVisible(false);
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

    await edit(id, {
      ...mealParams,
      ...(imageBase64 ? { image: imageBase64 } : {}),
    });

    setEditingMeal(null);
    setEditVisible(false);
  }

  async function handleDeleteMeal(meal: Meal) {
    await remove(meal.id);

    if (editingMeal?.id === meal.id) {
      setEditingMeal(null);
      setEditVisible(false);
    }
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
      setHydrationError(error instanceof Error ? error.message : 'Falha ao atualizar hidratação.');
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
        if (!shouldMark || item.deleted || item.readAt) return item;
        return { ...item, readAt: new Date().toISOString() };
      });

      return {
        notifications,
        unreadCount: countUnreadNotifications(notifications),
      };
    });
  }

  function deleteNotificationsLocally(params: { ids?: string[]; markAll?: boolean }) {
    setNotificationsSnapshot((current) => {
      const notifications = current.notifications.map((item) => {
        const shouldDelete = params.markAll || params.ids?.includes(item.id);
        if (!shouldDelete || item.deleted) return item;
        return { ...item, deleted: true, deletedAt: new Date().toISOString() };
      });

      return {
        notifications,
        unreadCount: countUnreadNotifications(notifications),
      };
    });
  }

  async function handleOpenNotifications() {
    setNotificationsVisible(true);
    await loadNotifications();
  }

  function handleCloseNotifications() {
    setNotificationDetailVisible(false);
    setSelectedNotification(null);
    setNotificationsVisible(false);
  }

  function handleCloseNotificationDetail() {
    setNotificationDetailVisible(false);
    setSelectedNotification(null);
  }

  async function handlePressNotification(notification: AppNotification) {
    setSelectedNotification(notification);
    setNotificationDetailVisible(true);

    if (!notification.readAt) {
      setNotificationBusyActions((current) => ({ ...current, [notification.id]: 'read' }));
      markNotificationsLocally({ ids: [notification.id] });

      try {
        const update = await markNotificationsRead({ notificationIds: [notification.id] });
        if (update) {
          mergeNotificationsUpdate(update);
        } else {
          await loadNotifications();
        }
        setNotificationsError(null);
      } catch (error) {
        setNotificationsError(error instanceof Error ? error.message : 'Falha ao atualizar a notificação.');
        await loadNotifications();
      } finally {
        setNotificationBusyActions((current) => {
          const next = { ...current };
          delete next[notification.id];
          return next;
        });
      }
    }
  }

  function handleOpenNotificationAction(notification: AppNotification) {
    if (!notification.actionRoute) return;

    setNotificationDetailVisible(false);
    setSelectedNotification(null);
    setNotificationsVisible(false);
    onNavigate(notification.actionRoute);
  }

  async function handleMarkAllNotificationsRead() {
    if (notificationsMarkingAll || notificationsDeletingAll || notificationsSnapshot.unreadCount === 0) return;

    setNotificationsMarkingAll(true);
    markNotificationsLocally({ markAll: true });

    try {
      const update = await markNotificationsRead({ markAll: true });
      if (update) {
        mergeNotificationsUpdate(update);
      } else {
        await loadNotifications();
      }
      setNotificationsError(null);
    } catch (error) {
      setNotificationsError(error instanceof Error ? error.message : 'Falha ao marcar as notificações.');
      await loadNotifications();
    } finally {
      setNotificationsMarkingAll(false);
    }
  }

  async function handleDeleteNotification(notification: AppNotification) {
    if (notification.deleted) return;

    if (selectedNotification?.id === notification.id) {
      setNotificationDetailVisible(false);
      setSelectedNotification(null);
    }

    setNotificationBusyActions((current) => ({ ...current, [notification.id]: 'delete' }));
    deleteNotificationsLocally({ ids: [notification.id] });

    try {
      const update = await markNotificationsDeleted({ notificationIds: [notification.id] });
      if (update) {
        mergeNotificationsUpdate(update);
      } else {
        await loadNotifications();
      }
      setNotificationsError(null);
    } catch (error) {
      setNotificationsError(error instanceof Error ? error.message : 'Falha ao excluir a notificação.');
      await loadNotifications();
    } finally {
      setNotificationBusyActions((current) => {
        const next = { ...current };
        delete next[notification.id];
        return next;
      });
    }
  }

  async function handleDeleteAllNotifications() {
    if (notificationsDeletingAll || notificationsMarkingAll || !notificationsSnapshot.notifications.some(isNotificationVisible)) {
      return;
    }

    setNotificationDetailVisible(false);
    setSelectedNotification(null);
    setNotificationsDeletingAll(true);
    deleteNotificationsLocally({ markAll: true });

    try {
      const update = await markNotificationsDeleted({ markAll: true });
      if (update) {
        mergeNotificationsUpdate(update);
      } else {
        await loadNotifications();
      }
      setNotificationsError(null);
    } catch (error) {
      setNotificationsError(error instanceof Error ? error.message : 'Falha ao limpar as notificações.');
      await loadNotifications();
    } finally {
      setNotificationsDeletingAll(false);
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

  function handlePreviousDate() {
    setDate(shiftDate(selectedDate, -1));
  }

  function handleNextDate() {
    if (!canAdvanceDate) return;
    setDate(shiftDate(selectedDate, 1));
  }

  const dashboardDateText = formatHomeDateLabel(selectedDate);
  const heroTitle = 'Nutrição';
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
  const hydrationStatusText = hydrationGoal
    ? waterStatus?.goalReached
      ? 'Meta de água concluída.'
      : hydrationRemaining !== null
        ? `Faltam ${Math.round(hydrationRemaining)} ml para fechar a meta.`
        : `Meta de ${formatLiters(hydrationGoal)} pronta para acompanhar.`
    : 'Defina uma meta na engrenagem para acompanhar seu progresso.';

  const mealSummaries = buildMealSummaries(meals);
  const visibleNotifications = notificationsSnapshot.notifications.filter(isNotificationVisible);
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
    editingMeal,
    editVisible,
    setEditVisible,
    profileVisible,
    setProfileVisible,
    notificationsVisible,
    handleCloseNotifications,
    notificationDetailVisible,
    selectedNotification,
    calendarVisible,
    setCalendarVisible,
    goalsModalVisible,
    setGoalsModalVisible,
    dashboardDateText,
    heroTitle,
    goalsLoading,
    hasAnyGoals,
    calories,
    protein,
    carbs,
    fat,
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
    hydrationGoalMenuOpen,
    setHydrationGoalMenuOpen,
    hydrationGoalDraftMl,
    hydrationWidth,
    hydrationScale,
    hydrationError,
    notificationsSnapshot,
    visibleNotifications,
    notificationsLoading,
    notificationsError,
    notificationBusyActions,
    notificationsMarkingAll,
    notificationsDeletingAll,
    nutritionGoals,
    goalsSaving,
    unreadNotificationsCount,
    handlePreviousDate,
    handleNextDate,
    handleSaveNew,
    handleEditMeal,
    handleCloseEditMeal,
    handleEditSave,
    handleDeleteMeal,
    handleOpenNotifications,
    handleCloseNotificationDetail,
    handleOpenNotificationAction,
    handlePressNotification,
    handleMarkAllNotificationsRead,
    handleDeleteNotification,
    handleDeleteAllNotifications,
    handleHydrationGoalDraftChange,
    handleHydrationGoalCommit,
    sendHydrationUpdate,
    handleSaveGoals,
  };
}
