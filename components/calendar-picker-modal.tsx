/**
 * Modal com calendario para selecionar uma data.
 * Reutiliza o visual do calendario do historico.
 */

import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { Brand } from '@/constants/theme';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

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

function todayStr(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function clampDateToMax(date: string, maxDate?: string): string {
  if (!maxDate) return date;
  return date > maxDate ? maxDate : date;
}

type Props = {
  visible: boolean;
  currentDate?: string;
  maxDate?: string;
  title?: string;
  onSelect: (date: string) => void;
  onClose: () => void;
};

export function CalendarPickerModal({
  visible,
  currentDate,
  maxDate,
  title = 'Selecionar data',
  onSelect,
  onClose,
}: Props) {
  const today = todayStr();
  const initialDate = clampDateToMax(currentDate || today, maxDate);
  const [viewYear, setViewYear] = useState(() => parseInt(initialDate.slice(0, 4), 10));
  const [viewMonth, setViewMonth] = useState(() => parseInt(initialDate.slice(5, 7), 10) - 1);
  const [selected, setSelected] = useState(initialDate);

  useEffect(() => {
    if (!visible) return;

    const nextDate = clampDateToMax(currentDate || todayStr(), maxDate);
    setSelected(nextDate);
    setViewYear(parseInt(nextDate.slice(0, 4), 10));
    setViewMonth(parseInt(nextDate.slice(5, 7), 10) - 1);
  }, [visible, currentDate, maxDate]);

  const calendarRows = getCalendarRows(viewYear, viewMonth);
  const maxMonthKey = maxDate ? maxDate.slice(0, 7) : null;
  const currentMonthKey = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
  const canGoNextMonth = !maxMonthKey || currentMonthKey < maxMonthKey;

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
      return;
    }

    setViewMonth((prev) => prev - 1);
  }

  function nextMonth() {
    if (!canGoNextMonth) return;

    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
      return;
    }

    setViewMonth((prev) => prev + 1);
  }

  function handleDayPress(day: number) {
    const mm = String(viewMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const nextDate = `${viewYear}-${mm}-${dd}`;

    if (maxDate && nextDate > maxDate) return;
    setSelected(nextDate);
  }

  function handleConfirm() {
    onSelect(selected);
    onClose();
  }

  const selYear = parseInt(selected.slice(0, 4), 10);
  const selMonth = parseInt(selected.slice(5, 7), 10);
  const selDay = parseInt(selected.slice(8, 10), 10);
  const selLabel = `${selDay} de ${MONTHS[selMonth - 1]} de ${selYear}`;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={s.overlay}>
        <Pressable style={s.backdrop} onPress={onClose} />

        <View style={s.card}>
          <Text style={s.title}>{title}</Text>

          <View style={s.calendar}>
            <View style={s.calNav}>
              <Pressable onPress={prevMonth} style={s.calNavBtn}>
                <Text style={s.calNavIcon}>{'<'}</Text>
              </Pressable>
              <Text style={s.calMonthLabel}>
                {MONTHS[viewMonth]} {viewYear}
              </Text>
              <Pressable
                onPress={nextMonth}
                style={[s.calNavBtn, !canGoNextMonth && s.calNavBtnDisabled]}
                disabled={!canGoNextMonth}>
                <Text style={s.calNavIcon}>{'>'}</Text>
              </Pressable>
            </View>

            <View style={s.weekRow}>
              {WEEKDAYS.map((weekday) => (
                <Text key={weekday} style={s.weekDay}>
                  {weekday}
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

                    const mm = String(viewMonth + 1).padStart(2, '0');
                    const dd = String(day).padStart(2, '0');
                    const dateStr = `${viewYear}-${mm}-${dd}`;
                    const isSelected = dateStr === selected;
                    const isToday = dateStr === today;
                    const isDisabled = !!maxDate && dateStr > maxDate;

                    return (
                      <Pressable
                        key={dateStr}
                        style={[
                          s.dayCell,
                          isSelected && s.dayCellSelected,
                          isToday && !isSelected && s.dayCellToday,
                          isDisabled && s.dayCellDisabled,
                        ]}
                        onPress={() => handleDayPress(day)}
                        disabled={isDisabled}>
                        <Text
                          style={[
                            s.dayText,
                            isSelected && s.dayTextSelected,
                            isToday && !isSelected && s.dayTextToday,
                            isDisabled && s.dayTextDisabled,
                          ]}>
                          {day}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>
          </View>

          <Text style={s.selectedLabel}>{selLabel}</Text>

          <View style={s.actions}>
            <View style={s.actionItemWide}>
              <AppButton title="Confirmar" onPress={handleConfirm} />
            </View>
            <View style={s.actionItem}>
              <AppButton title="Cancelar" onPress={onClose} variant="secondary" />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const CELL_SIZE = 40;

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  card: {
    width: '100%',
    backgroundColor: Brand.bg,
    borderRadius: 24,
    padding: 24,
    gap: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Brand.text,
    textAlign: 'center',
  },
  calendar: {
    backgroundColor: Brand.card,
    borderRadius: 16,
    padding: 14,
    gap: 10,
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
  calNavBtnDisabled: {
    opacity: 0.35,
  },
  calNavIcon: {
    fontSize: 22,
    fontWeight: '600',
    color: Brand.text,
    lineHeight: 24,
  },
  calMonthLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Brand.text,
  },
  weekRow: {
    flexDirection: 'row',
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 10,
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
  dayCellDisabled: {
    opacity: 0.38,
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
  dayTextDisabled: {
    color: Brand.textSecondary,
  },
  selectedLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Brand.textSecondary,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionItemWide: {
    flex: 2,
    minWidth: 160,
  },
  actionItem: {
    flex: 1,
    minWidth: 120,
  },
});
