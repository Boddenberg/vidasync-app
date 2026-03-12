import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CalendarPickerModal } from '@/components/calendar-picker-modal';
import { MealCard } from '@/components/meal-card';
import { RegisterMealModal } from '@/components/register-meal-modal';
import { Brand, Radii, Shadows, Typography } from '@/constants/theme';
import { deleteMeal, getDaySummary, getMealsByRange, updateMeal } from '@/services/meals';
import type { Meal, MealType, NutritionData } from '@/types/nutrition';
import { extractNum, monthRange, MONTHS, todayStr, WEEKDAYS } from '@/utils/helpers';

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

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const today = todayStr();

  const [selectedDate, setSelectedDate] = useState(today);
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());

  const [meals, setMeals] = useState<Meal[]>([]);
  const [totals, setTotals] = useState<NutritionData | null>(null);
  const [loading, setLoading] = useState(false);

  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [editVisible, setEditVisible] = useState(false);
  const [movingMeal, setMovingMeal] = useState<Meal | null>(null);
  const [datesWithData, setDatesWithData] = useState<Set<string>>(new Set());

  const calendarRows = getCalendarRows(viewYear, viewMonth);

  useEffect(() => {
    const { startDate, endDate } = monthRange(viewYear, viewMonth);
    getMealsByRange(startDate, endDate)
      .then((rangeMeals) => {
        setDatesWithData(new Set(rangeMeals.map((item) => item.date)));
      })
      .catch(() => setDatesWithData(new Set()));
  }, [viewMonth, viewYear]);

  const loadDay = useCallback(async (date: string) => {
    setSelectedDate(date);
    setLoading(true);
    try {
      const summary = await getDaySummary(date);
      setMeals(summary.meals ?? []);
      setTotals(summary.totals ?? null);

      setDatesWithData((prev) => {
        const next = new Set(prev);
        if ((summary.meals ?? []).length > 0) next.add(date);
        else next.delete(date);
        return next;
      });
    } catch {
      setMeals([]);
      setTotals(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshMonthMarks = useCallback(async () => {
    const { startDate, endDate } = monthRange(viewYear, viewMonth);
    try {
      const rangeMeals = await getMealsByRange(startDate, endDate);
      setDatesWithData(new Set(rangeMeals.map((item) => item.date)));
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
      Alert.alert('Erro', 'Nao foi possivel mover a refeicao.');
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
      Alert.alert('Erro', 'Nao foi possivel editar a refeicao.');
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

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={Brand.bg} />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.title}>Historico</Text>
        <Text style={s.subtitle}>Acompanhe seu progresso alimentar por dia.</Text>

        <View style={s.calendarCard}>
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
                      {hasData && !isSelected ? <View style={s.dayDot} /> : null}
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
        </View>

        <View style={s.dayDetailsCard}>
          <View style={s.dayDetailsTop}>
            <Text style={s.dayLabel}>{dayHeading(selectedDate)}</Text>
            <Text style={s.dayCount}>
              {meals.length} {meals.length === 1 ? 'refeicao' : 'refeicoes'}
            </Text>
          </View>

          {loading ? <Text style={s.hint}>Carregando dados do dia...</Text> : null}

          {!loading && meals.length === 0 ? (
            <View style={s.emptyState}>
              <Text style={s.emptyTitle}>Nenhuma refeicao neste dia</Text>
              <Text style={s.emptyHint}>Escolha outra data no calendario ou registre uma nova refeicao no Inicio.</Text>
            </View>
          ) : null}

          {!loading && meals.length > 0 ? (
            <>
              <View style={s.totalsCard}>
                <View style={s.kcalRow}>
                  <Text style={s.kcalValue}>{calories}</Text>
                  <Text style={s.kcalUnit}>kcal</Text>
                </View>
                <View style={s.macroRow}>
                  <MacroChip label="Proteina" value={`${protein}g`} color={Brand.macroProtein} bg={Brand.macroProteinBg} />
                  <MacroChip label="Carboidrato" value={`${carbs}g`} color={Brand.macroCarb} bg={Brand.macroCarbBg} />
                  <MacroChip label="Gordura" value={`${fat}g`} color={Brand.macroFat} bg={Brand.macroFatBg} />
                </View>
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
  calendarCard: {
    backgroundColor: Brand.card,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: 16,
    gap: 12,
    ...Shadows.card,
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
  dayCount: {
    ...Typography.caption,
    color: Brand.textSecondary,
    textTransform: 'uppercase',
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
