import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CalendarPickerModal } from '@/components/calendar-picker-modal';
import { RegisterMealModal } from '@/components/register-meal-modal';
import { Brand, Typography } from '@/constants/theme';
import { HistoryCalendarCard } from '@/features/history/history-calendar-card';
import { HistoryDayHero } from '@/features/history/history-day-hero';
import { HistoryEmptyStateCard } from '@/features/history/history-empty-state-card';
import { HistoryPanoramaCard } from '@/features/history/history-panorama-card';
import { HistoryMealsSection, HistoryWaterSection } from '@/features/history/history-record-sections';
import { getCalendarRows } from '@/features/history/history-utils';
import { deleteMeal, getDaySummary, getMealsByRange, updateMeal } from '@/services/meals';
import {
  getProgressPanorama,
  type PanoramaDataset,
  type PanoramaMetric,
  type PanoramaPeriod,
} from '@/services/progress-panorama';
import { getWaterHistory, getWaterStatus, type WaterStatus } from '@/services/water';
import type { Meal, MealType, NutritionData } from '@/types/nutrition';
import { extractNum, monthRange, todayStr } from '@/utils/helpers';

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const today = todayStr();
  const currentMonthKey = today.slice(0, 7);

  const [selectedDate, setSelectedDate] = useState(today);
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());

  const [meals, setMeals] = useState<Meal[]>([]);
  const [totals, setTotals] = useState<NutritionData | null>(null);
  const [waterStatus, setWaterStatus] = useState<WaterStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [editVisible, setEditVisible] = useState(false);
  const [movingMeal, setMovingMeal] = useState<Meal | null>(null);
  const [datesWithData, setDatesWithData] = useState<Set<string>>(new Set());
  const [waterDatesWithData, setWaterDatesWithData] = useState<Set<string>>(new Set());
  const [panoramaOpen, setPanoramaOpen] = useState(false);
  const [panoramaPeriod, setPanoramaPeriod] = useState<PanoramaPeriod>(7);
  const [panoramaMetric, setPanoramaMetric] = useState<PanoramaMetric>('water');
  const [panoramaData, setPanoramaData] = useState<PanoramaDataset | null>(null);
  const [panoramaLoading, setPanoramaLoading] = useState(false);
  const [panoramaError, setPanoramaError] = useState<string | null>(null);

  const calendarRows = getCalendarRows(viewYear, viewMonth);
  const viewedMonthKey = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
  const canGoToNextMonth = viewedMonthKey < currentMonthKey;

  useEffect(() => {
    const { startDate, endDate } = monthRange(viewYear, viewMonth);

    Promise.all([getMealsByRange(startDate, endDate), getWaterHistory(startDate, endDate)])
      .then(([rangeMeals, rangeWater]) => {
        setDatesWithData(new Set(rangeMeals.filter((item) => item.date <= today).map((item) => item.date)));
        setWaterDatesWithData(
          new Set(
            rangeWater.days
              .filter((item) => (item.goalMl > 0 || item.consumedMl > 0) && item.date <= today)
              .map((item) => item.date),
          ),
        );
      })
      .catch(() => {
        setDatesWithData(new Set());
        setWaterDatesWithData(new Set());
      });
  }, [today, viewMonth, viewYear]);

  const loadDay = useCallback(async (date: string) => {
    const safeDate = date > today ? today : date;

    setSelectedDate(safeDate);
    setLoading(true);

    try {
      const [summary, water] = await Promise.all([getDaySummary(safeDate), getWaterStatus(safeDate)]);

      setMeals(summary.meals ?? []);
      setTotals(summary.totals ?? null);
      setWaterStatus(water);

      setDatesWithData((current) => {
        const next = new Set(current);
        if ((summary.meals ?? []).length > 0) next.add(safeDate);
        else next.delete(safeDate);
        return next;
      });
    } catch {
      setMeals([]);
      setTotals(null);
      setWaterStatus(null);
    } finally {
      setLoading(false);
    }
  }, [today]);

  const refreshMonthMarks = useCallback(async () => {
    const { startDate, endDate } = monthRange(viewYear, viewMonth);

    try {
      const [rangeMeals, rangeWater] = await Promise.all([
        getMealsByRange(startDate, endDate),
        getWaterHistory(startDate, endDate),
      ]);

      setDatesWithData(new Set(rangeMeals.filter((item) => item.date <= today).map((item) => item.date)));
      setWaterDatesWithData(
        new Set(
          rangeWater.days
            .filter((item) => (item.goalMl > 0 || item.consumedMl > 0) && item.date <= today)
            .map((item) => item.date),
        ),
      );
    } catch {
      // no-op
    }
  }, [today, viewMonth, viewYear]);

  async function doMoveMeal(mealId: string, newDate: string) {
    if (newDate > today) return;

    try {
      await updateMeal(mealId, { date: newDate });
      await loadDay(selectedDate);
      await refreshMonthMarks();
    } catch {
      Alert.alert('Erro', 'Não foi possível mover a refeição.');
    }
  }

  function handleEdit(meal: Meal) {
    setEditingMeal(meal);
    setEditVisible(true);
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
    try {
      const { imageBase64, ...mealParams } = params;
      await updateMeal(id, { ...mealParams, ...(imageBase64 ? { image: imageBase64 } : {}) });
      setEditingMeal(null);
      setEditVisible(false);
      await loadDay(selectedDate);
    } catch {
      Alert.alert('Erro', 'Não foi possível editar a refeição.');
    }
  }

  async function handleDeleteMeal(meal: Meal) {
    try {
      await deleteMeal(meal.id);
      await loadDay(selectedDate);
      await refreshMonthMarks();
    } catch {
      Alert.alert('Erro', 'Não foi possível remover a refeição.');
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadDay(selectedDate);
      refreshMonthMarks();
    }, [loadDay, refreshMonthMarks, selectedDate]),
  );

  useEffect(() => {
    if (!panoramaOpen) return;

    let cancelled = false;

    async function loadPanorama() {
      setPanoramaLoading(true);

      try {
        const nextPanorama = await getProgressPanorama(selectedDate, 30);
        if (cancelled) return;

        setPanoramaData(nextPanorama);
        setPanoramaError(null);
      } catch (error) {
        if (cancelled) return;

        setPanoramaError(error instanceof Error ? error.message : 'Falha ao carregar panorama.');
      } finally {
        if (!cancelled) {
          setPanoramaLoading(false);
        }
      }
    }

    void loadPanorama();

    return () => {
      cancelled = true;
    };
  }, [panoramaOpen, selectedDate]);

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
      return;
    }

    setViewMonth((prev) => prev - 1);
  }

  function nextMonth() {
    if (!canGoToNextMonth) return;

    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
      return;
    }

    setViewMonth((prev) => prev + 1);
  }

  function handleDayPress(day: number) {
    const month = String(viewMonth + 1).padStart(2, '0');
    const dayPad = String(day).padStart(2, '0');
    const date = `${viewYear}-${month}-${dayPad}`;

    if (date > today) return;
    loadDay(date);
  }

  const calories = totals ? Math.round(extractNum(totals.calories)) : 0;
  const protein = totals ? Math.round(extractNum(totals.protein)) : 0;
  const carbs = totals ? Math.round(extractNum(totals.carbs)) : 0;
  const fat = totals ? Math.round(extractNum(totals.fat)) : 0;
  const sortedMeals = [...meals].sort((a, b) => (b.time ?? '').localeCompare(a.time ?? ''));
  const waterEvents = [...(waterStatus?.events ?? [])].sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bTime - aTime;
  });
  const hasMealEntries = sortedMeals.length > 0;
  const hasWaterEntries = waterEvents.length > 0;
  const hasAnyEntries = hasMealEntries || hasWaterEntries;

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={Brand.bg} />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.title}>Progresso</Text>
        <Text style={s.subtitle}>
          Consistência, refeições e hidratação organizadas em um painel diário.
        </Text>

        <HistoryCalendarCard
          calendarRows={calendarRows}
          selectedDate={selectedDate}
          today={today}
          viewYear={viewYear}
          viewMonth={viewMonth}
          canGoToNextMonth={canGoToNextMonth}
          datesWithData={datesWithData}
          waterDatesWithData={waterDatesWithData}
          panoramaOpen={panoramaOpen}
          onPrevMonth={prevMonth}
          onNextMonth={nextMonth}
          onSelectDay={handleDayPress}
          onTogglePanorama={() => setPanoramaOpen((current) => !current)}
        />

        {panoramaOpen ? (
          <HistoryPanoramaCard
            dataset={panoramaData}
            loading={panoramaLoading}
            error={panoramaError}
            period={panoramaPeriod}
            metric={panoramaMetric}
            onSelectPeriod={setPanoramaPeriod}
            onSelectMetric={setPanoramaMetric}
          />
        ) : null}

        {loading || hasAnyEntries ? (
          <HistoryDayHero
            selectedDate={selectedDate}
            loading={loading}
            calories={calories}
            protein={protein}
            carbs={carbs}
            fat={fat}
            mealCount={sortedMeals.length}
            waterEvents={waterEvents}
            waterStatus={waterStatus}
            hasMealEntries={hasMealEntries}
            hasWaterEntries={hasWaterEntries}
          />
        ) : (
          <HistoryEmptyStateCard selectedDate={selectedDate} />
        )}

        {!loading ? (
          <>
            {hasMealEntries ? (
              <HistoryMealsSection
                meals={sortedMeals}
                selectedDate={selectedDate}
                onEdit={handleEdit}
                onDelete={handleDeleteMeal}
                onMoveDate={setMovingMeal}
              />
            ) : null}
            {hasWaterEntries ? <HistoryWaterSection waterEvents={waterEvents} /> : null}
          </>
        ) : null}
      </ScrollView>

      <CalendarPickerModal
        visible={!!movingMeal}
        currentDate={selectedDate}
        maxDate={today}
        title={`Mover: ${movingMeal?.foods ?? ''}`}
        onSelect={(date) => {
          if (movingMeal) doMoveMeal(movingMeal.id, date);
        }}
        onClose={() => setMovingMeal(null)}
      />

      <RegisterMealModal
        visible={editVisible}
        editMeal={editingMeal}
        defaultDate={selectedDate}
        onSave={() => {}}
        onEditSave={handleEditSave}
        onClose={() => {
          setEditingMeal(null);
          setEditVisible(false);
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Brand.bg,
  },
  scroll: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 160,
    gap: 16,
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
});
