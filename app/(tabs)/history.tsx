import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CalendarPickerModal } from '@/components/calendar-picker-modal';
import { MealCard } from '@/components/meal-card';
import { RegisterMealModal } from '@/components/register-meal-modal';
import { Brand, Radii, Shadows, Typography } from '@/constants/theme';
import { deleteMeal, getDaySummary, getMealsByRange, updateMeal } from '@/services/meals';
import { getWaterHistory, getWaterStatus, type WaterEvent, type WaterStatus } from '@/services/water';
import type { Meal, MealType, NutritionData } from '@/types/nutrition';
import { extractNum, monthRange, MONTHS, todayStr, WEEKDAYS } from '@/utils/helpers';

function getCalendarRows(year: number, month: number): (number | null)[][] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];

  for (let i = 0; i < firstDay; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(day);
  while (cells.length % 7 !== 0) cells.push(null);

  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }

  return rows;
}

function dayHeading(date: string): string {
  const [year, month, day] = date.split('-').map((item) => parseInt(item, 10));
  return `${day} de ${MONTHS[month - 1]} de ${year}`;
}

function formatWaterLiters(valueMl: number): string {
  return `${(valueMl / 1000).toFixed(1)}L`;
}

function formatWaterEventTime(event: WaterEvent) {
  if (!event.createdAt) return 'Horario nao informado';

  const parsed = new Date(event.createdAt);
  if (Number.isNaN(parsed.getTime())) return 'Horario nao informado';

  return parsed.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

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

  const calendarRows = getCalendarRows(viewYear, viewMonth);
  const viewedMonthKey = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
  const canGoToNextMonth = viewedMonthKey < currentMonthKey;

  useEffect(() => {
    const { startDate, endDate } = monthRange(viewYear, viewMonth);

    Promise.all([getMealsByRange(startDate, endDate), getWaterHistory(startDate, endDate)])
      .then(([rangeMeals, rangeWater]) => {
        setDatesWithData(
          new Set(rangeMeals.filter((item) => item.date <= today).map((item) => item.date)),
        );
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
      const [summary, water] = await Promise.all([
        getDaySummary(safeDate),
        getWaterStatus(safeDate),
      ]);

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

      setDatesWithData(
        new Set(rangeMeals.filter((item) => item.date <= today).map((item) => item.date)),
      );
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
  const totalEntries = sortedMeals.length + waterEvents.length;
  const hydrationProgress =
    waterStatus && waterStatus.goalMl > 0
      ? Math.max(0, Math.min(waterStatus.consumedMl / waterStatus.goalMl, 1))
      : 0;
  const hydrationHeadline = !waterStatus
    ? 'Sem agua registrada'
    : waterStatus.goalMl > 0
      ? `${formatWaterLiters(waterStatus.consumedMl)} / ${formatWaterLiters(waterStatus.goalMl)}`
      : `${formatWaterLiters(waterStatus.consumedMl)} registrados`;
  const hydrationHint = !waterStatus || waterEvents.length === 0
    ? 'Nenhum ajuste de agua nesta data.'
    : waterStatus.goalMl > 0
      ? waterStatus.goalReached
        ? 'Meta de agua concluida.'
        : `${Math.round(waterStatus.remainingMl)} ml para fechar a meta.`
      : `${waterEvents.length} ${waterEvents.length === 1 ? 'ajuste' : 'ajustes'} de agua registrados.`;
  const dayHeroHint = totalEntries > 0
    ? 'Um panorama rapido do que entrou no seu dia.'
    : 'Quando voce registrar pratos e agua, o resumo aparece aqui.';

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={Brand.bg} />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.title}>Progresso</Text>
        <Text style={s.subtitle}>Escolha um dia no calendario para revisar refeicoes e agua com mais clareza.</Text>

        <View style={s.calendarCard}>
          <View style={s.calendarIntro}>
            <Text style={s.calendarEyebrow}>Seu historico</Text>
            <Text style={s.calendarTitle}>Historico do dia</Text>
            <Text style={s.calendarHint}>Selecione uma data para rever o que entrou no seu dia.</Text>
          </View>

          <View style={s.calendarDivider} />

          <View style={s.calNav}>
            <Pressable onPress={prevMonth} style={({ pressed }) => [s.calNavBtn, pressed && s.calNavBtnPressed]}>
              <Text style={s.calNavIcon}>{'<'}</Text>
            </Pressable>

            <Text style={s.calMonthLabel}>
              {MONTHS[viewMonth]} {viewYear}
            </Text>

            <Pressable
              onPress={nextMonth}
              disabled={!canGoToNextMonth}
              style={({ pressed }) => [
                s.calNavBtn,
                !canGoToNextMonth && s.calNavBtnDisabled,
                pressed && canGoToNextMonth && s.calNavBtnPressed,
              ]}>
              <Text style={s.calNavIcon}>{'>'}</Text>
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
                  const isFuture = date > today;
                  const hasData = !isFuture && datesWithData.has(date);
                  const hasWater = !isFuture && waterDatesWithData.has(date);

                  return (
                    <Pressable
                      key={date}
                      disabled={isFuture}
                      onPress={() => handleDayPress(day)}
                      style={({ pressed }) => [
                        s.dayCell,
                        isSelected && s.dayCellSelected,
                        isToday && !isSelected && s.dayCellToday,
                        isFuture && s.dayCellDisabled,
                        pressed && !isSelected && !isFuture && s.dayCellPressed,
                      ]}>
                      <Text
                        style={[
                          s.dayText,
                          isSelected && s.dayTextSelected,
                          isToday && !isSelected && s.dayTextToday,
                          isFuture && s.dayTextDisabled,
                        ]}>
                        {day}
                      </Text>
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
        </View>

        <View style={s.dayHero}>
          <View pointerEvents="none" style={s.dayHeroGlowTop} />
          <View pointerEvents="none" style={s.dayHeroGlowBottom} />

          <View style={s.dayHeroHeader}>
            <View style={s.dayHeroCopy}>
              <Text style={s.dayHeroEyebrow}>Panorama do dia</Text>
              <Text style={s.dayHeroTitle}>{dayHeading(selectedDate)}</Text>
              <Text style={s.dayHeroHint}>{dayHeroHint}</Text>
            </View>
            <View style={s.dayHeroBadge}>
              <Text style={s.dayHeroBadgeValue}>{totalEntries}</Text>
              <Text style={s.dayHeroBadgeLabel}>{totalEntries === 1 ? 'registro' : 'registros'}</Text>
            </View>
          </View>

          {loading ? (
            <Text style={s.hint}>Carregando dados do dia...</Text>
          ) : (
            <>
              <View style={s.dayHeroTopRow}>
                <View style={s.calorieCard}>
                  <Text style={s.calorieLabel}>Calorias totais</Text>
                  <View style={s.kcalRow}>
                    <Text style={s.kcalValue}>{calories}</Text>
                    <Text style={s.kcalUnit}>kcal</Text>
                  </View>
                </View>

                <View style={s.hydrationCard}>
                  <View style={s.hydrationCardIcon}>
                    <Ionicons name="water-outline" size={18} color="#0B6B94" />
                  </View>
                  <Text style={s.hydrationCardLabel}>Agua</Text>
                  <Text style={s.hydrationCardValue}>{hydrationHeadline}</Text>
                </View>
              </View>

              {waterStatus?.goalMl ? (
                <View style={s.hydrationTrack}>
                  <View style={[s.hydrationFill, { width: `${Math.round(hydrationProgress * 100)}%` }]} />
                </View>
              ) : null}

              <Text style={s.hydrationHint}>{hydrationHint}</Text>

              <View style={s.statsRow}>
                <View style={[s.statCard, s.statCardMeals]}>
                  <Text style={s.statLabel}>Pratos</Text>
                  <Text style={s.statValue}>{sortedMeals.length}</Text>
                  <Text style={s.statHint}>{sortedMeals.length === 1 ? 'registro no dia' : 'registros no dia'}</Text>
                </View>

                <View style={[s.statCard, s.statCardWater]}>
                  <Text style={s.statLabel}>Agua</Text>
                  <Text style={s.statValue}>{waterStatus ? formatWaterLiters(waterStatus.consumedMl) : '0.0L'}</Text>
                  <Text style={s.statHint}>consumidos no dia</Text>
                </View>

                <View style={[s.statCard, s.statCardEvents]}>
                  <Text style={s.statLabel}>Ajustes</Text>
                  <Text style={s.statValue}>{waterEvents.length}</Text>
                  <Text style={s.statHint}>{waterEvents.length === 1 ? 'movimento' : 'movimentos'}</Text>
                </View>
              </View>

              <View style={s.macroRow}>
                <MacroChip label="Proteina" value={`${protein}g`} color={Brand.macroProtein} bg={Brand.macroProteinBg} />
                <MacroChip label="Carboidrato" value={`${carbs}g`} color={Brand.macroCarb} bg={Brand.macroCarbBg} />
                <MacroChip label="Gordura" value={`${fat}g`} color={Brand.macroFat} bg={Brand.macroFatBg} />
              </View>
            </>
          )}
        </View>

        {!loading ? (
          <>
            <View style={s.sectionCard}>
              <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>Pratos do dia</Text>
                <Text style={s.sectionCount}>{sortedMeals.length} {sortedMeals.length === 1 ? 'item' : 'itens'}</Text>
              </View>

              {sortedMeals.length > 0 ? (
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
              ) : (
                <View style={s.emptyState}>
                  <Text style={s.emptyTitle}>Nenhum prato registrado neste dia</Text>
                  <Text style={s.emptyHint}>Escolha outra data no calendario ou registre uma refeicao no Inicio.</Text>
                </View>
              )}
            </View>

            <View style={s.sectionCard}>
              <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>Agua do dia</Text>
                <Text style={s.sectionCount}>{waterEvents.length} {waterEvents.length === 1 ? 'ajuste' : 'ajustes'}</Text>
              </View>

              {waterEvents.length > 0 ? (
                <View style={s.waterList}>
                  {waterEvents.map((event, index) => {
                    const positive = event.deltaMl >= 0;
                    const deltaLabel = `${positive ? '+' : ''}${Math.round(event.deltaMl)} ml`;

                    return (
                      <View key={`${event.id ?? 'water'}-${event.createdAt ?? index}-${index}`} style={s.waterItem}>
                        <View style={[s.waterItemIcon, positive ? s.waterItemIconPositive : s.waterItemIconNegative]}>
                          <Ionicons
                            name={positive ? 'water-outline' : 'remove-outline'}
                            size={18}
                            color={positive ? '#0B6B94' : Brand.danger}
                          />
                        </View>

                        <View style={s.waterItemCopy}>
                          <Text style={s.waterItemValue}>{deltaLabel}</Text>
                          <Text style={s.waterItemHint}>{formatWaterEventTime(event)}</Text>
                        </View>

                        <View style={[s.waterTag, positive ? s.waterTagPositive : s.waterTagNegative]}>
                          <Text style={[s.waterTagText, positive ? s.waterTagTextPositive : s.waterTagTextNegative]}>
                            {positive ? 'Entrada' : 'Ajuste'}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View style={s.emptyState}>
                  <Text style={s.emptyTitle}>Nenhum ajuste de agua neste dia</Text>
                  <Text style={s.emptyHint}>Quando voce registrar a hidratacao, os movimentos aparecem aqui em ordem.</Text>
                </View>
              )}
            </View>
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
    padding: 18,
    gap: 14,
    ...Shadows.card,
  },
  calendarIntro: {
    gap: 4,
  },
  calendarEyebrow: {
    ...Typography.caption,
    color: Brand.greenDark,
    textTransform: 'uppercase',
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  calendarTitle: {
    ...Typography.subtitle,
    color: Brand.text,
    fontWeight: '800',
  },
  calendarHint: {
    ...Typography.helper,
    color: Brand.textSecondary,
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
  calNavBtnDisabled: {
    opacity: 0.35,
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
  dayCellDisabled: {
    opacity: 0.34,
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
  dayTextDisabled: {
    color: Brand.textSecondary,
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
  dayHero: {
    backgroundColor: '#FCFDFC',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#DCEADD',
    padding: 18,
    gap: 14,
    overflow: 'hidden',
    position: 'relative',
    ...Shadows.soft,
  },
  dayHeroGlowTop: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(198, 239, 214, 0.4)',
    top: -86,
    right: -36,
  },
  dayHeroGlowBottom: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(56, 189, 248, 0.14)',
    bottom: -50,
    left: -24,
  },
  dayHeroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  dayHeroCopy: {
    flex: 1,
    gap: 4,
  },
  dayHeroEyebrow: {
    ...Typography.caption,
    color: Brand.greenDark,
    textTransform: 'uppercase',
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  dayHeroTitle: {
    ...Typography.title,
    color: Brand.text,
    fontSize: 24,
    lineHeight: 28,
  },
  dayHeroHint: {
    ...Typography.helper,
    color: Brand.textSecondary,
  },
  dayHeroBadge: {
    minWidth: 86,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#D9EBDD',
    backgroundColor: 'rgba(255,255,255,0.88)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  dayHeroBadgeValue: {
    ...Typography.subtitle,
    color: Brand.greenDark,
    fontWeight: '800',
  },
  dayHeroBadgeLabel: {
    ...Typography.caption,
    color: Brand.textSecondary,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  dayHeroTopRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  calorieCard: {
    flexGrow: 1,
    minWidth: 180,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2ECE5',
    backgroundColor: 'rgba(255,255,255,0.86)',
    padding: 14,
    gap: 6,
  },
  calorieLabel: {
    ...Typography.caption,
    color: Brand.textSecondary,
    textTransform: 'uppercase',
    fontWeight: '700',
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
  hydrationCard: {
    flexGrow: 1,
    minWidth: 150,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#D6ECFA',
    backgroundColor: '#F6FBFF',
    padding: 14,
    gap: 6,
  },
  hydrationCardIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF8FF',
  },
  hydrationCardLabel: {
    ...Typography.caption,
    color: '#4C7892',
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  hydrationCardValue: {
    ...Typography.subtitle,
    color: '#0D5F8E',
    fontWeight: '800',
  },
  hydrationTrack: {
    height: 9,
    borderRadius: Radii.pill,
    backgroundColor: '#D8EEF8',
    overflow: 'hidden',
  },
  hydrationFill: {
    height: '100%',
    borderRadius: Radii.pill,
    backgroundColor: '#1AA6E8',
  },
  hydrationHint: {
    ...Typography.body,
    color: '#134B6A',
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    flexGrow: 1,
    minWidth: '30%',
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
    gap: 4,
  },
  statCardMeals: {
    backgroundColor: '#F4FBF5',
    borderColor: '#D7EBDD',
  },
  statCardWater: {
    backgroundColor: '#F5FBFF',
    borderColor: '#D6ECFA',
  },
  statCardEvents: {
    backgroundColor: '#FFF8ED',
    borderColor: '#F1E2BE',
  },
  statLabel: {
    ...Typography.caption,
    color: Brand.textSecondary,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  statValue: {
    ...Typography.subtitle,
    color: Brand.text,
    fontWeight: '800',
  },
  statHint: {
    ...Typography.caption,
    color: Brand.textSecondary,
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
    color: Brand.text,
    fontWeight: '700',
  },
  macroValue: {
    ...Typography.caption,
    fontWeight: '800',
  },
  sectionCard: {
    backgroundColor: Brand.card,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: 18,
    gap: 12,
    ...Shadows.card,
  },
  sectionHeader: {
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
  sectionCount: {
    ...Typography.caption,
    color: Brand.textSecondary,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  mealsList: {
    gap: 8,
  },
  waterList: {
    gap: 8,
  },
  waterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Brand.border,
    backgroundColor: Brand.surfaceAlt,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  waterItemIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waterItemIconPositive: {
    backgroundColor: '#EAF8FF',
  },
  waterItemIconNegative: {
    backgroundColor: '#FFF0F0',
  },
  waterItemCopy: {
    flex: 1,
    gap: 2,
  },
  waterItemValue: {
    ...Typography.body,
    color: Brand.text,
    fontWeight: '700',
  },
  waterItemHint: {
    ...Typography.caption,
    color: Brand.textSecondary,
  },
  waterTag: {
    borderRadius: Radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  waterTagPositive: {
    backgroundColor: '#DFF4FF',
  },
  waterTagNegative: {
    backgroundColor: '#FFE7E9',
  },
  waterTagText: {
    ...Typography.caption,
    fontWeight: '800',
  },
  waterTagTextPositive: {
    color: '#0B6B94',
  },
  waterTagTextNegative: {
    color: Brand.danger,
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
});
