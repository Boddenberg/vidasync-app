import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { PanResponder, RefreshControl, ScrollView, StatusBar, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CalendarPickerModal } from '@/components/calendar-picker-modal';
import { EditProfileModal } from '@/components/edit-profile-modal';
import { NotificationCenterModal } from '@/components/notifications/notification-center-modal';
import { NotificationDetailModal } from '@/components/notifications/notification-detail-modal';
import { NutritionGoalsModal } from '@/components/nutrition-goals-modal';
import { RegisterMealModal } from '@/components/register-meal-modal';
import { Brand, Spacing } from '@/constants/theme';
import { HomeHeader } from '@/features/home/home-header';
import { HomeOverviewCard } from '@/features/home/home-overview-card';
import { HomeMealSummaryList } from '@/features/home/home-meal-summary-list';
import { HomeRegisterCard } from '@/features/home/home-register-card';
import { HomeRegisterOptionsSheet } from '@/features/home/home-register-options-sheet';
import { s } from '@/features/home/home-screen.styles';
import { formatDateForModal } from '@/features/home/home-utils';
import { useHomeScreen } from '@/features/home/use-home-screen';

const HOME_SWIPE_THRESHOLD = 44;
const HOME_BOTTOM_CONTENT_PADDING = 20;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [registerOptionsVisible, setRegisterOptionsVisible] = useState(false);
  const home = useHomeScreen({
    onNavigate: (route) => router.push(route as any),
  });

  const swipeLockedRef = useRef(false);
  const handlePreviousDateRef = useRef(home.handlePreviousDate);
  const handleNextDateRef = useRef(home.handleNextDate);

  useEffect(() => {
    swipeLockedRef.current = home.hydrationGoalMenuOpen;
  }, [home.hydrationGoalMenuOpen]);

  useEffect(() => {
    handlePreviousDateRef.current = home.handlePreviousDate;
    handleNextDateRef.current = home.handleNextDate;
  }, [home.handleNextDate, home.handlePreviousDate]);

  const shouldHandleHorizontalSwipe = (dx: number, dy: number) =>
    !swipeLockedRef.current && Math.abs(dx) > 14 && Math.abs(dx) > Math.abs(dy) * 1.15;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_event, gestureState) =>
        shouldHandleHorizontalSwipe(gestureState.dx, gestureState.dy),
      onMoveShouldSetPanResponderCapture: (_event, gestureState) =>
        shouldHandleHorizontalSwipe(gestureState.dx, gestureState.dy),
      onPanResponderRelease: (_event, gestureState) => {
        if (swipeLockedRef.current) return;

        if (gestureState.dx >= HOME_SWIPE_THRESHOLD || gestureState.vx >= 0.38) {
          handlePreviousDateRef.current();
          return;
        }

        if (gestureState.dx <= -HOME_SWIPE_THRESHOLD || gestureState.vx <= -0.38) {
          handleNextDateRef.current();
        }
      },
    }),
  ).current;

  function openRegisterDestination(action: () => void) {
    setRegisterOptionsVisible(false);
    setTimeout(action, 180);
  }

  function openSearchRegister() {
    router.push({
      pathname: '/(tabs)/devtools',
      params: { tool: 'search', from: 'home', date: home.selectedDate },
    } as any);
  }

  function openSavedDishesRegister() {
    router.push({ pathname: '/(tabs)/explore', params: { from: 'home' } } as any);
  }

  function openPhotoRegister() {
    router.push({
      pathname: '/(tabs)/devtools',
      params: { tool: 'photo', from: 'home', date: home.selectedDate },
    } as any);
  }

  function openManualRegister() {
    home.setRegisterVisible(true);
  }

  const bottomContentPadding = Math.max(HOME_BOTTOM_CONTENT_PADDING, insets.bottom + Spacing.sm);

  return (
    <View style={s.root} {...panResponder.panHandlers}>
      <StatusBar barStyle="dark-content" backgroundColor={Brand.bg} />
      <View pointerEvents="none" style={s.backgroundOrbTop} />
      <View pointerEvents="none" style={s.backgroundOrbMid} />
      <View pointerEvents="none" style={s.backgroundOrbBottom} />

      <ScrollView
        bounces={false}
        alwaysBounceVertical={false}
        contentContainerStyle={[s.scroll, { paddingTop: insets.top + Spacing.sm, paddingBottom: bottomContentPadding }]}
        contentInsetAdjustmentBehavior="never"
        overScrollMode="never"
        scrollIndicatorInsets={{ bottom: bottomContentPadding }}
        refreshControl={
          <RefreshControl
            refreshing={home.refreshing}
            onRefresh={home.handleRefreshHome}
            tintColor={Brand.greenDark}
            colors={[Brand.greenDark]}
            progressViewOffset={insets.top + Spacing.sm}
          />
        }
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <HomeHeader
          user={home.user}
          dashboardDateText={home.dashboardDateText}
          unreadNotificationsCount={home.unreadNotificationsCount}
          onOpenProfile={() => home.setProfileVisible(true)}
          onOpenHistory={() => router.push('/(tabs)/history' as any)}
          onOpenNotifications={home.handleOpenNotifications}
          onOpenCalendar={() => home.setCalendarVisible(true)}
        />

        <HomeOverviewCard
          mealsCount={home.meals.length}
          goalsLoading={home.goalsLoading}
          hasAnyGoals={home.hasAnyGoals}
          calories={home.calories}
          protein={home.protein}
          carbs={home.carbs}
          fat={home.fat}
          calorieBadgeValue={home.calorieBadgeValue}
          calorieSummaryText={home.calorieSummaryText}
          macroGoalItems={home.macroGoalItems}
          dayWidth={home.dayWidth}
          hydrationLoading={home.hydrationLoading}
          hydrationSaving={home.hydrationSaving}
          hydrationMl={home.hydrationMl}
          hydrationGoal={home.hydrationGoal}
          goalReached={Boolean(home.waterStatus?.goalReached)}
          hydrationWidth={home.hydrationWidth}
          hydrationScale={home.hydrationScale}
          goalsError={home.goalsError}
          hydrationGoalMenuOpen={home.hydrationGoalMenuOpen}
          hydrationGoalDraftMl={home.hydrationGoalDraftMl}
          hydrationError={home.hydrationError}
          onOpenGoals={() => home.setGoalsModalVisible(true)}
          onToggleGoalMenu={() => home.setHydrationGoalMenuOpen((current) => !current)}
          onCloseGoalMenu={() => home.setHydrationGoalMenuOpen(false)}
          onDraftChange={home.handleHydrationGoalDraftChange}
          onCommitGoal={home.handleHydrationGoalCommit}
          onQuickHydration={home.sendHydrationUpdate}
        />

        <HomeRegisterCard
          selectedDate={home.selectedDate}
          onOpenRegisterOptions={() => setRegisterOptionsVisible(true)}
          onOpenSearch={openSearchRegister}
          onOpenPhoto={openPhotoRegister}
        />

        <HomeMealSummaryList
          mealSummaries={home.mealSummaries}
          meals={home.meals}
          mealsCount={home.meals.length}
          onEditMeal={home.handleEditMeal}
          onDeleteMeal={home.handleDeleteMeal}
        />
      </ScrollView>

      <HomeRegisterOptionsSheet
        visible={registerOptionsVisible}
        onClose={() => setRegisterOptionsVisible(false)}
        onOpenSearch={() => openRegisterDestination(openSearchRegister)}
        onOpenSavedDishes={() => openRegisterDestination(openSavedDishesRegister)}
        onOpenPhoto={() => openRegisterDestination(openPhotoRegister)}
        onOpenManual={() => openRegisterDestination(openManualRegister)}
      />

      <RegisterMealModal
        visible={home.registerVisible}
        defaultDate={home.selectedDate}
        onSave={home.handleSaveNew}
        onClose={() => home.setRegisterVisible(false)}
      />
      <RegisterMealModal
        visible={home.editVisible}
        editMeal={home.editingMeal}
        defaultDate={home.selectedDate}
        onSave={() => {}}
        onEditSave={home.handleEditSave}
        onClose={home.handleCloseEditMeal}
      />
      <EditProfileModal visible={home.profileVisible} onClose={() => home.setProfileVisible(false)} />
      <NotificationCenterModal
        visible={home.notificationsVisible}
        notifications={home.visibleNotifications}
        unreadCount={home.notificationsSnapshot.unreadCount}
        loading={home.notificationsLoading}
        error={home.notificationsError}
        busyActions={home.notificationBusyActions}
        markingAll={home.notificationsMarkingAll}
        deletingAll={home.notificationsDeletingAll}
        onClose={home.handleCloseNotifications}
        onRefresh={home.handleOpenNotifications}
        onPressNotification={home.handlePressNotification}
        onMarkAllRead={home.handleMarkAllNotificationsRead}
        onDeleteNotification={home.handleDeleteNotification}
        onDeleteAll={home.handleDeleteAllNotifications}
      />
      <NotificationDetailModal
        visible={home.notificationDetailVisible}
        notification={home.selectedNotification}
        onClose={home.handleCloseNotificationDetail}
        onOpenAction={home.handleOpenNotificationAction}
      />
      <CalendarPickerModal
        visible={home.calendarVisible}
        currentDate={home.selectedDate}
        maxDate={home.today}
        title="Selecionar dia do painel"
        onSelect={home.setDate}
        onClose={() => home.setCalendarVisible(false)}
      />
      <NutritionGoalsModal
        visible={home.goalsModalVisible}
        dateLabel={formatDateForModal(home.selectedDate)}
        currentGoals={home.nutritionGoals?.goals ?? null}
        goalInherited={home.nutritionGoals?.goalInherited}
        saving={home.goalsSaving}
        onSave={home.handleSaveGoals}
        onClose={() => home.setGoalsModalVisible(false)}
      />
    </View>
  );
}
