/**
 * Tela Histórico
 *
 * Calendário para selecionar um dia e ver as refeições + totais.
 * Usa um mini-calendário feito à mão (sem lib externa).
 */

import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CalendarPickerModal } from '@/components/calendar-picker-modal';
import { MealCard } from '@/components/meal-card';
import { RegisterMealModal } from '@/components/register-meal-modal';
import { Brand } from '@/constants/theme';
import { injectCachedImages, removeCachedMealImage } from '@/services/meal-image-cache';
import { deleteMeal, getDaySummary, getMealsByRange, updateMeal } from '@/services/meals';
import type { Meal, MealType, NutritionData } from '@/types/nutrition';
import { extractNum, monthRange, MONTHS, todayStr, WEEKDAYS } from '@/utils/helpers';

// ─── helpers ─────────────────────────────────────────────

function getCalendarRows(year: number, month: number): (number | null)[][] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  // Pad last row to 7
  while (cells.length % 7 !== 0) cells.push(null);
  // Split into rows of 7
  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }
  return rows;
}

// ─── componente ──────────────────────────────────────────

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const today = todayStr();

  const [selectedDate, setSelectedDate] = useState(today);
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());

  const [meals, setMeals] = useState<Meal[]>([]);
  const [totals, setTotals] = useState<NutritionData | null>(null);
  const [loading, setLoading] = useState(false);

  const calendarRows = getCalendarRows(viewYear, viewMonth);

  // ── Edição de refeição ──
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [editVisible, setEditVisible] = useState(false);

  // ── Datas que possuem refeições (para marcar no calendário) ──
  const [datesWithData, setDatesWithData] = useState<Set<string>>(new Set());

  useEffect(() => {
    const { startDate, endDate } = monthRange(viewYear, viewMonth);
    getMealsByRange(startDate, endDate)
      .then((rangeMeals) => {
        const dates = new Set(rangeMeals.map((m) => m.date));
        setDatesWithData(dates);
      })
      .catch(() => setDatesWithData(new Set()));
  }, [viewYear, viewMonth]);

  // ── Carrega refeições de uma data ──
  const loadDay = useCallback(async (date: string) => {
    setSelectedDate(date);
    setLoading(true);
    try {
      const summary = await getDaySummary(date);
      const mealsData = summary.meals ?? [];
      await injectCachedImages(mealsData);
      setMeals(mealsData);
      setTotals(summary.totals ?? null);
      // atualiza dots do mês
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

  // ── Mover refeição para outro dia ──
  const [movingMeal, setMovingMeal] = useState<Meal | null>(null);

  function handleMoveMeal(meal: Meal) {
    setMovingMeal(meal);
  }

  async function doMoveMeal(mealId: string, newDate: string) {
    try {
      await updateMeal(mealId, { date: newDate });
      await loadDay(selectedDate);
      const { startDate, endDate } = monthRange(viewYear, viewMonth);
      getMealsByRange(startDate, endDate)
        .then((rangeMeals) => setDatesWithData(new Set(rangeMeals.map((m) => m.date))))
        .catch(() => {});
    } catch {
      Alert.alert('Erro', 'N\u00e3o foi poss\u00edvel mover a refei\u00e7\u00e3o.');
    }
  }

  // ── Editar refeição ──
  function handleEdit(meal: Meal) {
    setEditingMeal(meal);
    setEditVisible(true);
  }

  async function handleEditSave(id: string, params: {
    foods: string;
    mealType: MealType;
    time?: string;
    nutrition: NutritionData;
    imageBase64?: string | null;
  }) {
    try {
      const { imageBase64, ...mealParams } = params;
      await updateMeal(id, mealParams);
      // Atualiza imagem no cache local
      if (imageBase64) {
        const { cacheMealImage } = await import('@/services/meal-image-cache');
        await cacheMealImage(id, imageBase64);
      }
      setEditingMeal(null);
      setEditVisible(false);
      await loadDay(selectedDate);
    } catch {
      Alert.alert('Erro', 'Não foi possível editar a refeição.');
    }
  }

  // Recarrega ao ganhar foco (quando volta de outra aba)
  useFocusEffect(
    useCallback(() => {
      loadDay(selectedDate);
      const { startDate, endDate } = monthRange(viewYear, viewMonth);
      getMealsByRange(startDate, endDate)
        .then((rangeMeals) => {
          setDatesWithData(new Set(rangeMeals.map((m) => m.date)));
        })
        .catch(() => {});
    }, [selectedDate, viewYear, viewMonth]),
  );

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  }

  function handleDayPress(day: number) {
    const mm = String(viewMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const date = `${viewYear}-${mm}-${dd}`;
    loadDay(date);
  }

  // ── Totais ──
  const cal = totals ? Math.round(extractNum(totals.calories)) : 0;
  const prot = totals ? Math.round(extractNum(totals.protein)) : 0;
  const carb = totals ? Math.round(extractNum(totals.carbs)) : 0;
  const fat = totals ? Math.round(extractNum(totals.fat)) : 0;

  // ── Formata data selecionada ──
  const selParts = selectedDate.split('-');
  const selLabel = `${parseInt(selParts[2])} de ${MONTHS[parseInt(selParts[1]) - 1]}`;

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={Brand.bg} />

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}>

        {/* Header */}
        <Text style={s.title}>Histórico</Text>
        <Text style={s.subtitle}>Selecione um dia para ver suas refeições</Text>

        {/* ── Calendário ── */}
        <View style={s.calendar}>
          {/* Navegação mês */}
          <View style={s.calNav}>
            <Pressable onPress={prevMonth} style={s.calNavBtn}>
              <Text style={s.calNavIcon}>‹</Text>
            </Pressable>
            <Text style={s.calMonthLabel}>
              {MONTHS[viewMonth]} {viewYear}
            </Text>
            <Pressable onPress={nextMonth} style={s.calNavBtn}>
              <Text style={s.calNavIcon}>›</Text>
            </Pressable>
          </View>

          {/* Dias da semana */}
          <View style={s.weekRow}>
            {WEEKDAYS.map((w) => (
              <Text key={w} style={s.weekDay}>{w}</Text>
            ))}
          </View>

          {/* Dias do mês */}
          <View style={s.daysGrid}>
            {calendarRows.map((row, rowIdx) => (
              <View key={`row-${rowIdx}`} style={s.weekRow}>
                {row.map((day, colIdx) => {
                  if (day === null) {
                    return <View key={`empty-${rowIdx}-${colIdx}`} style={s.dayCell} />;
                  }
                  const mm = String(viewMonth + 1).padStart(2, '0');
                  const dd = String(day).padStart(2, '0');
                  const dateStr = `${viewYear}-${mm}-${dd}`;
                  const isSelected = dateStr === selectedDate;
                  const isToday = dateStr === today;
                  const hasData = datesWithData.has(dateStr);

                  return (
                    <Pressable
                      key={dateStr}
                      style={[
                        s.dayCell,
                        isSelected && s.dayCellSelected,
                        isToday && !isSelected && s.dayCellToday,
                      ]}
                      onPress={() => handleDayPress(day)}>
                      <Text
                        style={[
                          s.dayText,
                          isSelected && s.dayTextSelected,
                          isToday && !isSelected && s.dayTextToday,
                        ]}>
                        {day}
                      </Text>
                      {hasData && !isSelected && <View style={s.dayDot} />}
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
        </View>

        {/* ── Resumo do dia selecionado ── */}
        <View style={s.summaryCard}>
          <Text style={s.summaryDate}>{selLabel}</Text>

          {loading ? (
            <Text style={s.hint}>Carregando...</Text>
          ) : meals.length === 0 ? (
            <Text style={s.hint}>Nenhuma refeição neste dia</Text>
          ) : (
            <>
              {/* Totais */}
              <View style={s.totalsRow}>
                <View style={s.totalMain}>
                  <Text style={s.totalCalValue}>{cal}</Text>
                  <Text style={s.totalCalUnit}>kcal</Text>
                </View>
                <View style={s.totalMacros}>
                  <MacroPill label="prot" value={`${prot}g`} color="#5DADE2" bg="#EBF5FB" />
                  <MacroPill label="carb" value={`${carb}g`} color={Brand.orange} bg="#FEF5E7" />
                  <MacroPill label="gord" value={`${fat}g`} color="#E74C3C" bg="#FDEDEC" />
                </View>
              </View>

              {/* Lista de refeições */}
              <View style={s.mealsList}>
                {[...meals].sort((a, b) => (b.time ?? '').localeCompare(a.time ?? '')).map((meal) => (
                  <MealCard
                    key={meal.id}
                    meal={meal}
                    onEdit={handleEdit}
                    onDelete={async () => {
                      try {
                        await deleteMeal(meal.id);
                        await removeCachedMealImage(meal.id);
                        await loadDay(selectedDate);
                        const { startDate, endDate } = monthRange(viewYear, viewMonth);
                        getMealsByRange(startDate, endDate)
                          .then((rangeMeals) => setDatesWithData(new Set(rangeMeals.map((m) => m.date))))
                          .catch(() => {});
                      } catch {}
                    }}
                    onMoveDate={() => handleMoveMeal(meal)}
                  />
                ))}
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* Modal de calendário para mover refeição */}
      <CalendarPickerModal
        visible={!!movingMeal}
        currentDate={selectedDate}
        title={`Mover: ${movingMeal?.foods ?? ''}`}
        onSelect={(date) => {
          if (movingMeal) {
            doMoveMeal(movingMeal.id, date);
          }
        }}
        onClose={() => setMovingMeal(null)}
      />

      {/* Modal de edição de refeição */}
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

// ─── Sub-componentes ─────────────────────────────────────

function MacroPill({ label, value, color, bg }: {
  label: string; value: string; color: string; bg: string;
}) {
  return (
    <View style={[s.macroPill, { backgroundColor: bg }]}>
      <Text style={[s.macroPillLabel, { color }]}>{label}</Text>
      <Text style={[s.macroPillValue, { color }]}>{value}</Text>
    </View>
  );
}

// ─── Estilos ─────────────────────────────────────────────

const CELL_SIZE = 40;

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Brand.bg,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    paddingTop: 20,
  },

  // Header
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Brand.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: Brand.textSecondary,
    marginTop: 4,
    marginBottom: 20,
  },

  // Calendar
  calendar: {
    backgroundColor: Brand.card,
    borderRadius: 20,
    padding: 18,
    gap: 12,
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
    backgroundColor: Brand.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calNavIcon: {
    fontSize: 22,
    fontWeight: '600',
    color: Brand.text,
    lineHeight: 24,
  },
  calMonthLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Brand.text,
  },
  weekRow: {
    flexDirection: 'row',
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
    color: Brand.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    paddingVertical: 4,
  },
  daysGrid: {
    gap: 2,
  },
  dayCell: {
    flex: 1,
    height: CELL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellSelected: {
    backgroundColor: Brand.green,
    borderRadius: 14,
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderColor: Brand.green,
    borderRadius: 14,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    color: Brand.text,
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dayTextToday: {
    color: Brand.greenDark,
    fontWeight: '700',
  },
  dayDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Brand.green,
    position: 'absolute',
    bottom: 4,
  },

  // Summary
  summaryCard: {
    marginTop: 20,
    backgroundColor: Brand.card,
    borderRadius: 20,
    padding: 22,
    gap: 16,
  },
  summaryDate: {
    fontSize: 16,
    fontWeight: '700',
    color: Brand.text,
  },
  hint: {
    fontSize: 13,
    color: Brand.textSecondary,
    textAlign: 'center',
    paddingVertical: 12,
  },

  // Totals
  totalsRow: {
    gap: 12,
  },
  totalMain: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  totalCalValue: {
    fontSize: 36,
    fontWeight: '700',
    color: Brand.greenDark,
    letterSpacing: -1,
  },
  totalCalUnit: {
    fontSize: 14,
    fontWeight: '600',
    color: Brand.textSecondary,
  },
  totalMacros: {
    flexDirection: 'row',
    gap: 8,
  },
  macroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  macroPillLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  macroPillValue: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Meals
  mealsList: {
    gap: 8,
  },
});
