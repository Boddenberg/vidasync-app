import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CalendarPickerModal } from '@/components/calendar-picker-modal';
import { MealCard } from '@/components/meal-card';
import { NutritionGoalsModal } from '@/components/nutrition-goals-modal';
import { RegisterMealModal } from '@/components/register-meal-modal';
import { Brand, Radii, Shadows, Typography } from '@/constants/theme';
import { deleteMeal, getDaySummary, getMealsByRange, updateMeal } from '@/services/meals';
import {
  getNutritionGoals,
  saveNutritionGoals,
  type NutritionGoalsStatus,
} from '@/services/nutrition-goals';
import { getWaterHistory, getWaterStatus, type WaterHistory, type WaterStatus } from '@/services/water';
import type { Meal, MealType, NutritionData } from '@/types/nutrition';
import { extractNum, monthRange, MONTHS, todayStr, toDateStr, WEEKDAYS } from '@/utils/helpers';

type PeriodWindow = 7 | 15 | 30;

type PeriodSnapshot = {
  avgCalories: number;
  avgProtein: number;
  avgConsumedMl: number;
  mealDays: number;
  waterDays: number;
  coveredDays: number;
};

type GoalProgress = {
  label: string;
  consumed: number;
  goal: number;
  progress: number;
  remaining: number;
  color: string;
  bg: string;
  unit: string;
};

function getCalendarRows(year: number, month: number): (number | null)[][] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];

  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(day);
  while (cells.length % 7 !== 0) cells.push(null);

  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

function dayHeading(date: string): string {
  const [year, month, day] = date.split('-').map((item) => parseInt(item, 10));
  return `${day} de ${MONTHS[month - 1]} de ${year}`;
}

function shortDayHeading(date: string): string {
  const [year, month, day] = date.split('-').map((item) => parseInt(item, 10));
  return new Date(year, month - 1, day, 12).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'short',
  });
}

function buildPeriodSnapshot(meals: Meal[], history: WaterHistory | null): PeriodSnapshot | null {
  const mealTotalsByDate = new Map<string, { calories: number; protein: number }>();

  meals.forEach((meal) => {
    const current = mealTotalsByDate.get(meal.date) ?? { calories: 0, protein: 0 };
    current.calories += extractNum(meal.nutrition?.calories ?? '0');
    current.protein += extractNum(meal.nutrition?.protein ?? '0');
    mealTotalsByDate.set(meal.date, current);
  });

  const mealDays = mealTotalsByDate.size;
  const mealTotals = Array.from(mealTotalsByDate.values());
  const sumCalories = mealTotals.reduce((acc, day) => acc + day.calories, 0);
  const sumProtein = mealTotals.reduce((acc, day) => acc + day.protein, 0);

  const trackedWaterDays = history?.days.filter((day) => day.goalMl > 0 || day.consumedMl > 0) ?? [];
  const waterDays = trackedWaterDays.length;
  const sumConsumedMl = trackedWaterDays.reduce((sum, day) => sum + day.consumedMl, 0);

  if (mealDays === 0 && waterDays === 0) return null;

  const coveredDates = new Set<string>();
  mealTotalsByDate.forEach((_, date) => coveredDates.add(date));
  trackedWaterDays.forEach((day) => coveredDates.add(day.date));

  return {
    avgCalories: mealDays > 0 ? Math.round(sumCalories / mealDays) : 0,
    avgProtein: mealDays > 0 ? Math.round(sumProtein / mealDays) : 0,
    avgConsumedMl: waterDays > 0 ? Math.round(sumConsumedMl / waterDays) : 0,
    mealDays,
    waterDays,
    coveredDays: coveredDates.size,
  };
}

function buildGoalProgress(
  label: string,
  consumed: number,
  goal: number | null,
  color: string,
  bg: string,
  unit: string,
): GoalProgress | null {
  if (goal === null || goal <= 0) return null;

  return {
    label,
    consumed,
    goal,
    progress: Math.max(0, Math.min(consumed / goal, 1)),
    remaining: Math.max(0, goal - consumed),
    color,
    bg,
    unit,
  };
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const today = todayStr();

  const [selectedDate, setSelectedDate] = useState(today);
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());

  const [meals, setMeals] = useState<Meal[]>([]);
  const [totals, setTotals] = useState<NutritionData | null>(null);
  const [waterStatus, setWaterStatus] = useState<WaterStatus | null>(null);
  const [nutritionGoals, setNutritionGoals] = useState<NutritionGoalsStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [editVisible, setEditVisible] = useState(false);
  const [goalsVisible, setGoalsVisible] = useState(false);
  const [goalsSaving, setGoalsSaving] = useState(false);
  const [movingMeal, setMovingMeal] = useState<Meal | null>(null);
  const [datesWithData, setDatesWithData] = useState<Set<string>>(new Set());
  const [waterDatesWithData, setWaterDatesWithData] = useState<Set<string>>(new Set());
  const [periodWindow, setPeriodWindow] = useState<PeriodWindow>(7);
  const [periodSnapshot, setPeriodSnapshot] = useState<PeriodSnapshot | null>(null);
  const [periodLoading, setPeriodLoading] = useState(false);

  const calendarRows = getCalendarRows(viewYear, viewMonth);

  useEffect(() => {
    const { startDate, endDate } = monthRange(viewYear, viewMonth);
    Promise.all([getMealsByRange(startDate, endDate), getWaterHistory(startDate, endDate)])
      .then(([rangeMeals, rangeWater]) => {
        setDatesWithData(new Set(rangeMeals.map((item) => item.date)));
        setWaterDatesWithData(
          new Set(
            rangeWater.days
              .filter((item) => item.goalMl > 0 || item.consumedMl > 0)
              .map((item) => item.date),
          ),
        );
      })
      .catch(() => {
        setDatesWithData(new Set());
        setWaterDatesWithData(new Set());
      });
  }, [viewMonth, viewYear]);

  useEffect(() => {
    let active = true;

    async function loadPeriodSnapshot() {
      setPeriodLoading(true);
      try {
        const end = new Date(`${selectedDate}T12:00:00`);
        const start = new Date(end);
        start.setDate(end.getDate() - (periodWindow - 1));

        const startDate = toDateStr(start);
        const [rangeMeals, rangeWater] = await Promise.all([
          getMealsByRange(startDate, selectedDate),
          getWaterHistory(startDate, selectedDate),
        ]);

        if (!active) return;
        setPeriodSnapshot(buildPeriodSnapshot(rangeMeals, rangeWater));
      } catch {
        if (!active) return;
        setPeriodSnapshot(null);
      } finally {
        if (active) {
          setPeriodLoading(false);
        }
      }
    }

    loadPeriodSnapshot();

    return () => {
      active = false;
    };
  }, [periodWindow, selectedDate]);

  const loadDay = useCallback(async (date: string) => {
    setSelectedDate(date);
    setLoading(true);
    try {
      const [summary, water, goals] = await Promise.all([
        getDaySummary(date),
        getWaterStatus(date),
        getNutritionGoals(date),
      ]);
      setMeals(summary.meals ?? []);
      setTotals(summary.totals ?? null);
      setWaterStatus(water);
      setNutritionGoals(goals);

      setDatesWithData((prev) => {
        const next = new Set(prev);
        if ((summary.meals ?? []).length > 0) next.add(date);
        else next.delete(date);
        return next;
      });
    } catch {
      setMeals([]);
      setTotals(null);
      setWaterStatus(null);
      setNutritionGoals(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshMonthMarks = useCallback(async () => {
    const { startDate, endDate } = monthRange(viewYear, viewMonth);
    try {
      const [rangeMeals, rangeWater] = await Promise.all([
        getMealsByRange(startDate, endDate),
        getWaterHistory(startDate, endDate),
      ]);
      setDatesWithData(new Set(rangeMeals.map((item) => item.date)));
      setWaterDatesWithData(
        new Set(
          rangeWater.days
            .filter((item) => item.goalMl > 0 || item.consumedMl > 0)
            .map((item) => item.date),
        ),
      );
    } catch {
      // no-op
    }
  }, [viewMonth, viewYear]);

  async function doMoveMeal(mealId: string, newDate: string) {
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
      setGoalsVisible(false);
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar as metas deste dia.');
    } finally {
      setGoalsSaving(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadDay(selectedDate);
      refreshMonthMarks();
    }, [loadDay, refreshMonthMarks, selectedDate]),
  );

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
      return;
    }
    setViewMonth((prev) => prev - 1);
  }

  function nextMonth() {
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
    loadDay(date);
  }

  const calories = totals ? Math.round(extractNum(totals.calories)) : 0;
  const protein = totals ? Math.round(extractNum(totals.protein)) : 0;
  const carbs = totals ? Math.round(extractNum(totals.carbs)) : 0;
  const fat = totals ? Math.round(extractNum(totals.fat)) : 0;
  const sortedMeals = [...meals].sort((a, b) => (b.time ?? '').localeCompare(a.time ?? ''));
  const goalProgressItems = [
    buildGoalProgress('Calorias', calories, nutritionGoals?.goals.calories ?? null, Brand.greenDark, '#E7F6EC', ' kcal'),
    buildGoalProgress('Proteína', protein, nutritionGoals?.goals.protein ?? null, Brand.macroProtein, Brand.macroProteinBg, 'g'),
    buildGoalProgress('Carboidrato', carbs, nutritionGoals?.goals.carbs ?? null, Brand.macroCarb, Brand.macroCarbBg, 'g'),
    buildGoalProgress('Gordura', fat, nutritionGoals?.goals.fat ?? null, Brand.macroFat, Brand.macroFatBg, 'g'),
  ].filter((item): item is GoalProgress => item !== null);

  const periodCoverageLabel = `${periodWindow} dias`;

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={Brand.bg} />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.title}>Progresso</Text>
        <Text style={s.subtitle}>Escolha um dia no calendário para ver refeições, água e metas com mais clareza.</Text>

        <View style={s.calendarCard}>
          <View style={s.periodHeader}>
            <View style={{ flex: 1 }}>
              <Text style={s.weeklyTitle}>Calendário e panorama</Text>
              <Text style={s.weeklyHint}>Médias do período até {shortDayHeading(selectedDate)}.</Text>
            </View>
            <Text style={s.weeklyLabel}>{periodCoverageLabel}</Text>
          </View>

          <View style={s.periodSelector}>
            {([7, 15, 30] as PeriodWindow[]).map((days) => (
              <Pressable
                key={days}
                onPress={() => setPeriodWindow(days)}
                style={({ pressed }) => [
                  s.periodChip,
                  periodWindow === days && s.periodChipActive,
                  pressed && s.periodChipPressed,
                ]}>
                <Text style={[s.periodChipText, periodWindow === days && s.periodChipTextActive]}>{days} dias</Text>
              </Pressable>
            ))}
          </View>

          {periodLoading ? (
            <Text style={s.weeklyHint}>Carregando panorama do período...</Text>
          ) : periodSnapshot ? (
            <>
              <View style={s.periodMetricsRow}>
                <View style={[s.periodMetricCard, s.periodMetricCalories]}>
                  <Text style={s.periodMetricLabel}>Calorias médias</Text>
                  <Text style={s.periodMetricValue}>{periodSnapshot.avgCalories} kcal</Text>
                </View>
                <View style={[s.periodMetricCard, s.periodMetricProtein]}>
                  <Text style={s.periodMetricLabel}>Proteína média</Text>
                  <Text style={s.periodMetricValue}>{periodSnapshot.avgProtein}g</Text>
                </View>
                <View style={[s.periodMetricCard, s.periodMetricWater]}>
                  <Text style={s.periodMetricLabel}>Água média</Text>
                  <Text style={s.periodMetricValue}>{(periodSnapshot.avgConsumedMl / 1000).toFixed(1)}L</Text>
                </View>
              </View>
              <Text style={s.periodSummary}>
                {periodSnapshot.coveredDays} de {periodWindow} dias com registros. Refeições em {periodSnapshot.mealDays} dias e água em {periodSnapshot.waterDays} dias.
              </Text>
            </>
          ) : (
            <Text style={s.weeklyHint}>Sem dados suficientes neste período. Selecione outro intervalo ou registre novas informações.</Text>
          )}

          <View style={s.calendarDivider} />

          <View style={s.calNav}>
            <Pressable onPress={prevMonth} style={({ pressed }) => [s.calNavBtn, pressed && s.calNavBtnPressed]}>
              <Text style={s.calNavIcon}>‹</Text>
            </Pressable>

            <Text style={s.calMonthLabel}>
              {MONTHS[viewMonth]} {viewYear}
            </Text>

            <Pressable onPress={nextMonth} style={({ pressed }) => [s.calNavBtn, pressed && s.calNavBtnPressed]}>
              <Text style={s.calNavIcon}>›</Text>
            </Pressable>
          </View>

          <View style={s.weekRow}>
            {WEEKDAYS.map((item) => (
              <Text key={item} style={s.weekDay}>
                {item}
              </Text>
            ))}
          </View>

          <View style={s.daysGrid}>
            {calendarRows.map((row, rowIndex) => (
              <View key={`row-${rowIndex}`} style={s.weekRow}>
                {row.map((day, colIndex) => {
                  if (day === null) {
                    return <View key={`empty-${rowIndex}-${colIndex}`} style={s.dayCell} />;
                  }

                  const month = String(viewMonth + 1).padStart(2, '0');
                  const dayPad = String(day).padStart(2, '0');
                  const date = `${viewYear}-${month}-${dayPad}`;
                  const isSelected = date === selectedDate;
                  const isToday = date === today;
                  const hasData = datesWithData.has(date);
                  const hasWater = waterDatesWithData.has(date);

                  return (
                    <Pressable
                      key={date}
                      onPress={() => handleDayPress(day)}
                      style={({ pressed }) => [
                        s.dayCell,
                        isSelected && s.dayCellSelected,
                        isToday && !isSelected && s.dayCellToday,
                        pressed && !isSelected && s.dayCellPressed,
                      ]}>
                      <Text style={[s.dayText, isSelected && s.dayTextSelected, isToday && !isSelected && s.dayTextToday]}>{day}</Text>
                      {!isSelected && (hasData || hasWater) ? (
                        <View style={s.dayMarkers}>
                          {hasData ? <View style={s.dayDot} /> : null}
                          {hasWater ? <View style={s.dayWaterDot} /> : null}
                        </View>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>

          <View style={s.legendRow}>
            <View style={s.legendItem}>
              <View style={s.legendDotMeal} />
              <Text style={s.legendText}>Refeições</Text>
            </View>
            <View style={s.legendItem}>
              <View style={s.legendDotWater} />
              <Text style={s.legendText}>Água</Text>
            </View>
          </View>
        </View>

        <View style={s.dayDetailsCard}>
          <View style={s.dayDetailsTop}>
            <Text style={s.dayLabel}>{dayHeading(selectedDate)}</Text>
            <Pressable onPress={() => setGoalsVisible(true)}>
              <Text style={s.editGoalsLink}>{goalProgressItems.length > 0 ? 'Editar metas' : 'Criar metas'}</Text>
            </Pressable>
          </View>

          {loading ? <Text style={s.hint}>Carregando dados do dia...</Text> : null}

          {!loading ? (
            <>
              <View style={s.overviewRow}>
                <View style={s.overviewCard}>
                  <Text style={s.overviewLabel}>Hidratação</Text>
                  <Text style={s.overviewValue}>
                    {waterStatus ? `${(waterStatus.consumedMl / 1000).toFixed(1)} / ${(waterStatus.goalMl / 1000).toFixed(1)}L` : 'Sem meta'}
                  </Text>
                  <Text style={s.overviewHint}>
                    {waterStatus
                      ? waterStatus.goalInherited
                        ? 'Meta herdada nesta data'
                        : waterStatus.goalReached
                          ? 'Meta batida'
                          : `${Math.round(waterStatus.remainingMl)}ml restantes`
                      : 'Cadastre a meta pela home'}
                  </Text>
                </View>
                <View style={s.overviewCard}>
                  <Text style={s.overviewLabel}>Metas do dia</Text>
                  <Text style={s.overviewValue}>
                    {goalProgressItems.length > 0 ? `${goalProgressItems.length} comparativos` : 'Sem metas'}
                  </Text>
                  <Text style={s.overviewHint}>
                    {nutritionGoals
                      ? nutritionGoals.goalInherited
                        ? 'Valores herdados da última configuração'
                        : 'Valores próprios desta data'
                      : 'Defina calorias e macros para comparar'}
                  </Text>
                </View>
              </View>

              <View style={s.totalsCard}>
                <View style={s.kcalRow}>
                  <Text style={s.kcalValue}>{calories}</Text>
                  <Text style={s.kcalUnit}>kcal</Text>
                </View>
                <View style={s.macroRow}>
                  <MacroChip label="Proteína" value={`${protein}g`} color={Brand.macroProtein} bg={Brand.macroProteinBg} />
                  <MacroChip label="Carboidrato" value={`${carbs}g`} color={Brand.macroCarb} bg={Brand.macroCarbBg} />
                  <MacroChip label="Gordura" value={`${fat}g`} color={Brand.macroFat} bg={Brand.macroFatBg} />
                </View>
                {goalProgressItems.length > 0 ? (
                  <View style={s.goalList}>
                    {goalProgressItems.map((item) => (
                      <View key={item.label} style={s.goalItem}>
                        <View style={s.weeklyHeaderRow}>
                          <Text style={s.goalItemLabel}>{item.label}</Text>
                          <Text style={s.goalItemValue}>{item.consumed}{item.unit} / {item.goal}{item.unit}</Text>
                        </View>
                        <View style={[s.goalTrack, { backgroundColor: item.bg }]}>
                          <View style={[s.goalFill, { backgroundColor: item.color, width: `${Math.round(item.progress * 100)}%` }]} />
                        </View>
                        <Text style={s.goalItemHint}>
                          {item.consumed >= item.goal ? 'Meta concluída.' : `${Math.round(item.remaining)}${item.unit} restantes.`}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={s.emptyHint}>Nenhuma meta cadastrada para esta data.</Text>
                )}
              </View>

              {sortedMeals.length > 0 ? (
                <View style={s.mealsSection}>
                  <View style={s.weeklyHeaderRow}>
                    <Text style={s.weeklyTitle}>Pratos do dia</Text>
                    <Text style={s.weeklyLabel}>{sortedMeals.length} itens</Text>
                  </View>
                  <View style={s.mealsList}>
                    {sortedMeals.map((meal) => (
                      <MealCard
                        key={meal.id}
                        meal={meal}
                        onEdit={handleEdit}
                        onDelete={async () => {
                          try {
                            await deleteMeal(meal.id);
                            await loadDay(selectedDate);
                            await refreshMonthMarks();
                          } catch {
                            // no-op
                          }
                        }}
                        onMoveDate={() => setMovingMeal(meal)}
                      />
                    ))}
                  </View>
                </View>
              ) : (
                <View style={s.emptyState}>
                  <Text style={s.emptyTitle}>Nenhuma refeição neste dia</Text>
                  <Text style={s.emptyHint}>Escolha outra data no calendário ou registre uma nova refeição no Início.</Text>
                </View>
              )}
            </>
          ) : null}
        </View>
      </ScrollView>

      <CalendarPickerModal
        visible={!!movingMeal}
        currentDate={selectedDate}
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

      <NutritionGoalsModal
        visible={goalsVisible}
        dateLabel={dayHeading(selectedDate)}
        currentGoals={nutritionGoals?.goals ?? null}
        goalInherited={nutritionGoals?.goalInherited}
        saving={goalsSaving}
        onSave={handleSaveGoals}
        onClose={() => setGoalsVisible(false)}
      />
    </View>
  );
}

function MacroChip({
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
    <View style={[s.macroChip, { backgroundColor: bg }]}>
      <Text style={[s.macroLabel, { color }]}>{label}</Text>
      <Text style={[s.macroValue, { color }]}>{value}</Text>
    </View>
  );
}

const CELL_SIZE = 42;

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Brand.bg,
  },
  scroll: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 160,
    gap: 14,
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
  weeklyCard: {
    backgroundColor: Brand.card,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: 16,
    gap: 12,
    ...Shadows.card,
  },
  waterCard: {
    backgroundColor: Brand.card,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: 16,
    gap: 12,
    ...Shadows.card,
  },
  weeklyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  weeklyTitle: {
    ...Typography.subtitle,
    color: Brand.text,
    fontWeight: '800',
  },
  weeklyLabel: {
    ...Typography.caption,
    color: Brand.textSecondary,
    textTransform: 'uppercase',
  },
  weeklyHint: {
    ...Typography.caption,
    color: Brand.textSecondary,
    lineHeight: 18,
  },
  weeklyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  weeklyProgressWrap: {
    marginTop: 2,
    gap: 6,
  },
  weeklyProgressTrack: {
    width: '100%',
    height: 9,
    borderRadius: Radii.pill,
    backgroundColor: '#DDEADD',
    overflow: 'hidden',
  },
  weeklyProgressFill: {
    height: '100%',
    borderRadius: Radii.pill,
    backgroundColor: Brand.green,
  },
  waterProgressTrack: {
    width: '100%',
    height: 9,
    borderRadius: Radii.pill,
    backgroundColor: '#D8EDFA',
    overflow: 'hidden',
  },
  waterProgressFill: {
    height: '100%',
    borderRadius: Radii.pill,
    backgroundColor: Brand.hydration,
  },
  weeklyProgressHint: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '700',
  },
  weeklyMetric: {
    flexGrow: 1,
    minWidth: '31%',
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Brand.border,
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
  periodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  periodSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  periodChip: {
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: '#D9E6DD',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  periodChipActive: {
    backgroundColor: '#EAF7EE',
    borderColor: '#B8DCC2',
  },
  periodChipPressed: {
    opacity: 0.82,
  },
  periodChipText: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '700',
  },
  periodChipTextActive: {
    color: Brand.greenDark,
  },
  periodMetricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  periodMetricCard: {
    flexGrow: 1,
    minWidth: '31%',
    borderRadius: Radii.md,
    borderWidth: 1,
    padding: 12,
    gap: 4,
  },
  periodMetricCalories: {
    backgroundColor: '#F3FAF5',
    borderColor: '#D7EBDD',
  },
  periodMetricProtein: {
    backgroundColor: Brand.macroProteinBg,
    borderColor: '#D5E3FF',
  },
  periodMetricWater: {
    backgroundColor: Brand.hydrationBg,
    borderColor: '#CFEAF9',
  },
  periodMetricLabel: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '700',
  },
  periodMetricValue: {
    ...Typography.body,
    color: Brand.text,
    fontWeight: '800',
  },
  periodSummary: {
    ...Typography.caption,
    color: Brand.textSecondary,
    lineHeight: 18,
    fontWeight: '700',
  },
  calendarCard: {
    backgroundColor: Brand.card,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: 16,
    gap: 14,
    ...Shadows.card,
  },
  calendarDivider: {
    height: 1,
    backgroundColor: '#E7EEE8',
  },
  calNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Brand.border,
    backgroundColor: Brand.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calNavBtnPressed: {
    opacity: 0.8,
  },
  calNavIcon: {
    ...Typography.subtitle,
    color: Brand.text,
    fontSize: 22,
    marginTop: -1,
  },
  calMonthLabel: {
    ...Typography.subtitle,
    color: Brand.text,
    fontWeight: '800',
  },
  weekRow: {
    flexDirection: 'row',
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    ...Typography.caption,
    textTransform: 'uppercase',
    color: Brand.textSecondary,
  },
  daysGrid: {
    gap: 3,
  },
  dayCell: {
    flex: 1,
    height: CELL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellSelected: {
    borderRadius: 14,
    backgroundColor: Brand.green,
  },
  dayCellToday: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Brand.green,
  },
  dayCellPressed: {
    opacity: 0.8,
  },
  dayText: {
    ...Typography.body,
    color: Brand.text,
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  dayTextToday: {
    color: Brand.greenDark,
    fontWeight: '800',
  },
  dayDot: {
    width: 5,
    height: 5,
    borderRadius: Radii.pill,
    backgroundColor: Brand.green,
    position: 'absolute',
    bottom: 5,
  },
  dayMarkers: {
    position: 'absolute',
    bottom: 5,
    flexDirection: 'row',
    gap: 4,
  },
  dayWaterDot: {
    width: 5,
    height: 5,
    borderRadius: Radii.pill,
    backgroundColor: Brand.hydration,
  },
  legendRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    paddingTop: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDotMeal: {
    width: 7,
    height: 7,
    borderRadius: Radii.pill,
    backgroundColor: Brand.green,
  },
  legendDotWater: {
    width: 7,
    height: 7,
    borderRadius: Radii.pill,
    backgroundColor: Brand.hydration,
  },
  legendText: {
    ...Typography.caption,
    color: Brand.textSecondary,
  },
  dayDetailsCard: {
    backgroundColor: Brand.card,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: 18,
    gap: 12,
    ...Shadows.card,
  },
  dayDetailsTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  dayLabel: {
    ...Typography.subtitle,
    color: Brand.text,
    fontWeight: '800',
    flex: 1,
  },
  editGoalsLink: {
    ...Typography.caption,
    color: Brand.greenDark,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  dayCount: {
    ...Typography.caption,
    color: Brand.textSecondary,
    textTransform: 'uppercase',
  },
  overviewRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  overviewCard: {
    flex: 1,
    minWidth: '47%',
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Brand.border,
    backgroundColor: Brand.surfaceAlt,
    padding: 12,
    gap: 4,
  },
  overviewLabel: {
    ...Typography.caption,
    color: Brand.textSecondary,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  overviewValue: {
    ...Typography.body,
    color: Brand.text,
    fontWeight: '800',
  },
  overviewHint: {
    ...Typography.caption,
    color: Brand.textSecondary,
  },
  hint: {
    ...Typography.body,
    color: Brand.textSecondary,
    textAlign: 'center',
    paddingVertical: 12,
  },
  emptyState: {
    backgroundColor: Brand.surfaceAlt,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: 16,
    gap: 6,
    alignItems: 'center',
  },
  emptyTitle: {
    ...Typography.body,
    color: Brand.text,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyHint: {
    ...Typography.caption,
    color: Brand.textSecondary,
    textAlign: 'center',
    lineHeight: 17,
  },
  totalsCard: {
    backgroundColor: Brand.surfaceSoft,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: 14,
    gap: 10,
  },
  kcalRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
  },
  kcalValue: {
    ...Typography.title,
    color: Brand.text,
    fontSize: 34,
    lineHeight: 40,
  },
  kcalUnit: {
    ...Typography.body,
    color: Brand.textSecondary,
    fontWeight: '600',
  },
  macroRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  macroChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: Radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  goalList: {
    gap: 10,
  },
  goalItem: {
    gap: 6,
  },
  goalItemLabel: {
    ...Typography.caption,
    color: Brand.text,
    fontWeight: '700',
  },
  goalItemValue: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '700',
  },
  goalTrack: {
    height: 8,
    borderRadius: Radii.pill,
    overflow: 'hidden',
  },
  goalFill: {
    height: '100%',
    borderRadius: Radii.pill,
  },
  goalItemHint: {
    ...Typography.caption,
    color: Brand.textSecondary,
  },
  mealsSection: {
    gap: 10,
  },
  macroLabel: {
    ...Typography.caption,
    textTransform: 'uppercase',
    fontSize: 10,
    fontWeight: '800',
  },
  macroValue: {
    ...Typography.caption,
    fontWeight: '800',
  },
  mealsList: {
    gap: 8,
  },
});
