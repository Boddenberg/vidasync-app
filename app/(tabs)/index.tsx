import { useRouter } from 'expo-router';
import { ScrollView, StatusBar, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CalendarPickerModal } from '@/components/calendar-picker-modal';
import { EditProfileModal } from '@/components/edit-profile-modal';
import { NotificationCenterModal } from '@/components/notifications/notification-center-modal';
import { NutritionGoalsModal } from '@/components/nutrition-goals-modal';
import { RegisterMealModal } from '@/components/register-meal-modal';
import { Brand, Spacing } from '@/constants/theme';
import { HomeHeader } from '@/features/home/home-header';
import { HomeHeroCard } from '@/features/home/home-hero-card';
import { HomeHydrationCard } from '@/features/home/home-hydration-card';
import { HomeRegisterCard } from '@/features/home/home-register-card';
import { s } from '@/features/home/home-screen.styles';
import { formatDateForModal, shiftDate } from '@/features/home/home-utils';
import { useHomeScreen } from '@/features/home/use-home-screen';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const home = useHomeScreen({
    onNavigate: (route) => router.push(route as any),
  });

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Brand.bg} />

      <ScrollView
        contentContainerStyle={[s.scroll, { paddingTop: insets.top + Spacing.sm, paddingBottom: 140 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <HomeHeader
          user={home.user}
          dashboardDateLabel={home.dashboardDateLabel}
          dashboardSupportText={home.dashboardSupportText}
          selectedDate={home.selectedDate}
          canAdvanceDate={home.canAdvanceDate}
          unreadNotificationsCount={home.unreadNotificationsCount}
          onOpenProfile={() => home.setProfileVisible(true)}
          onOpenHistory={() => router.push('/(tabs)/history' as any)}
          onOpenNotifications={home.handleOpenNotifications}
          onOpenCalendar={() => home.setCalendarVisible(true)}
          onPreviousDate={() => home.setDate(shiftDate(home.selectedDate, -1))}
          onNextDate={() => home.setDate(shiftDate(home.selectedDate, 1))}
        />

        <HomeHeroCard
          mealsCount={home.meals.length}
          heroTitle={home.heroTitle}
          goalsLoading={home.goalsLoading}
          hasAnyGoals={home.hasAnyGoals}
          calories={home.calories}
          calorieBadgeValue={home.calorieBadgeValue}
          calorieBadgeLabel={home.calorieBadgeLabel}
          calorieSummaryText={home.calorieSummaryText}
          calorieSecondaryText={home.calorieSecondaryText}
          macroGoalItems={home.macroGoalItems}
          mealSummaries={home.mealSummaries}
          dayWidth={home.dayWidth}
          goalsError={home.goalsError}
          onOpenGoals={() => home.setGoalsModalVisible(true)}
          onOpenCalendar={() => home.setCalendarVisible(true)}
        />

        <HomeRegisterCard
          selectedDate={home.selectedDate}
          onOpenRegister={() => home.setRegisterVisible(true)}
          onOpenPhotoTool={() =>
            router.push({ pathname: '/(tabs)/devtools', params: { tool: 'photo' } } as any)
          }
          onOpenSearchTool={() =>
            router.push({ pathname: '/(tabs)/devtools', params: { tool: 'search' } } as any)
          }
        />

        <HomeHydrationCard
          hydrationLoading={home.hydrationLoading}
          hydrationSaving={home.hydrationSaving}
          hydrationMl={home.hydrationMl}
          hydrationGoal={home.hydrationGoal}
          hydrationProgress={home.hydrationProgress}
          goalReached={Boolean(home.waterStatus?.goalReached)}
          hydrationStatusText={home.hydrationStatusText}
          hydrationEventText={home.hydrationEventText}
          hydrationGoalMenuOpen={home.hydrationGoalMenuOpen}
          hydrationGoalDraftMl={home.hydrationGoalDraftMl}
          hydrationWidth={home.hydrationWidth}
          hydrationScale={home.hydrationScale}
          hydrationError={home.hydrationError}
          onToggleGoalMenu={() => home.setHydrationGoalMenuOpen((current) => !current)}
          onDraftChange={home.handleHydrationGoalDraftChange}
          onCommitGoal={home.handleHydrationGoalCommit}
          onQuickAction={(deltaMl) => home.sendHydrationUpdate({ deltaMl })}
        />
      </ScrollView>

      <RegisterMealModal
        visible={home.registerVisible}
        defaultDate={home.selectedDate}
        onSave={home.handleSaveNew}
        onClose={() => home.setRegisterVisible(false)}
      />
      <EditProfileModal visible={home.profileVisible} onClose={() => home.setProfileVisible(false)} />
      <NotificationCenterModal
        visible={home.notificationsVisible}
        notifications={home.notificationsSnapshot.notifications}
        unreadCount={home.notificationsSnapshot.unreadCount}
        loading={home.notificationsLoading}
        error={home.notificationsError}
        busyIds={home.notificationBusyIds}
        markingAll={home.notificationsMarkingAll}
        onClose={() => home.setNotificationsVisible(false)}
        onRefresh={home.handleOpenNotifications}
        onPressNotification={home.handlePressNotification}
        onMarkAllRead={home.handleMarkAllNotificationsRead}
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
