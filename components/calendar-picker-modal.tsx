/**
 * Modal com calendário para selecionar uma data.
 * Reutiliza o visual do calendário do Histórico.
 */

import { useState } from 'react';
import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View
} from 'react-native';

import { AppButton } from '@/components/app-button';
import { Brand } from '@/constants/theme';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function getCalendarRows(year: number, month: number): (number | null)[][] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
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

type Props = {
  visible: boolean;
  /** Data atual selecionada no formato YYYY-MM-DD (opcional, para highlight) */
  currentDate?: string;
  /** Título do modal */
  title?: string;
  onSelect: (date: string) => void;
  onClose: () => void;
};

export function CalendarPickerModal({
  visible,
  currentDate,
  title = 'Selecionar data',
  onSelect,
  onClose,
}: Props) {
  const today = todayStr();
  const initDate = currentDate || today;
  const [viewYear, setViewYear] = useState(() => parseInt(initDate.split('-')[0]));
  const [viewMonth, setViewMonth] = useState(() => parseInt(initDate.split('-')[1]) - 1);
  const [selected, setSelected] = useState(initDate);

  const calendarRows = getCalendarRows(viewYear, viewMonth);

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
    setSelected(`${viewYear}-${mm}-${dd}`);
  }

  function handleConfirm() {
    onSelect(selected);
    onClose();
  }

  // Format selected for display
  const selParts = selected.split('-');
  const selLabel = `${parseInt(selParts[2])} de ${MONTHS[parseInt(selParts[1]) - 1]} de ${selParts[0]}`;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}>
      <View style={s.overlay}>
        <Pressable style={s.backdrop} onPress={onClose} />

        <View style={s.card}>
          <Text style={s.title}>{title}</Text>

          {/* Calendar */}
          <View style={s.calendar}>
            {/* Month nav */}
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

            {/* Weekday headers */}
            <View style={s.weekRow}>
              {WEEKDAYS.map((w) => (
                <Text key={w} style={s.weekDay}>{w}</Text>
              ))}
            </View>

            {/* Days */}
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
                    const isSelected = dateStr === selected;
                    const isToday = dateStr === today;

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
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>
          </View>

          {/* Selected date display */}
          <Text style={s.selectedLabel}>{selLabel}</Text>

          {/* Actions */}
          <View style={s.actions}>
            <View style={{ flex: 2 }}>
              <AppButton title="Confirmar" onPress={handleConfirm} />
            </View>
            <View style={{ flex: 1 }}>
              <AppButton title="Cancelar" onPress={onClose} variant="secondary" />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Estilos ─────────────────────────────────────────────

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

  // Calendar
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

  // Selected display
  selectedLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Brand.textSecondary,
    textAlign: 'center',
  },

  // Actions
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
});
