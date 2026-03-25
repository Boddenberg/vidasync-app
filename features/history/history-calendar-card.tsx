import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Brand, Radii, Shadows, Typography } from '@/constants/theme';
import { MONTHS, WEEKDAYS } from '@/utils/helpers';

type Props = {
  calendarRows: (number | null)[][];
  selectedDate: string;
  today: string;
  viewYear: number;
  viewMonth: number;
  canGoToNextMonth: boolean;
  datesWithData: Set<string>;
  waterDatesWithData: Set<string>;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectDay: (day: number) => void;
};

const CELL_SIZE = 44;

export function HistoryCalendarCard({
  calendarRows,
  selectedDate,
  today,
  viewYear,
  viewMonth,
  canGoToNextMonth,
  datesWithData,
  waterDatesWithData,
  onPrevMonth,
  onNextMonth,
  onSelectDay,
}: Props) {
  return (
    <View style={s.calendarCard}>
      <View style={s.calendarHeaderRow}>
        <View style={s.calendarIntro}>
          <Text style={s.calendarEyebrow}>Calendário</Text>
          <Text style={s.calendarTitle}>Seus registros</Text>
          <Text style={s.calendarHint}>Escolha um dia para revisar refeições, água e consistência.</Text>
        </View>
      </View>

      <View style={s.calNav}>
        <Pressable onPress={onPrevMonth} style={({ pressed }) => [s.calNavBtn, pressed && s.calNavBtnPressed]}>
          <Text style={s.calNavIcon}>{'<'}</Text>
        </Pressable>

        <Text style={s.calMonthLabel}>
          {MONTHS[viewMonth]} {viewYear}
        </Text>

        <Pressable
          onPress={onNextMonth}
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
                  onPress={() => onSelectDay(day)}
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

      <View style={s.legendRow}>
        <View style={s.legendItem}>
          <View style={s.dayDot} />
          <Text style={s.legendText}>Refeições</Text>
        </View>
        <View style={s.legendItem}>
          <View style={s.dayWaterDot} />
          <Text style={s.legendText}>Água</Text>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  calendarCard: {
    backgroundColor: Brand.card,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: 20,
    gap: 16,
    ...Shadows.card,
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  calendarIntro: {
    flex: 1,
    gap: 4,
  },
  calendarEyebrow: {
    ...Typography.caption,
    color: Brand.greenDark,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  calendarTitle: {
    ...Typography.title,
    color: Brand.text,
    fontWeight: '800',
  },
  calendarHint: {
    ...Typography.body,
    color: Brand.textSecondary,
  },
  calNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calNavBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Brand.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calNavBtnDisabled: {
    opacity: 0.4,
  },
  calNavBtnPressed: {
    opacity: 0.85,
  },
  calNavIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: Brand.greenDark,
  },
  calMonthLabel: {
    ...Typography.subtitle,
    color: Brand.text,
    fontWeight: '800',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weekDay: {
    width: CELL_SIZE,
    textAlign: 'center',
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '700',
  },
  daysGrid: {
    gap: 8,
  },
  dayCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dayCellSelected: {
    backgroundColor: Brand.greenDark,
  },
  dayCellToday: {
    backgroundColor: Brand.surfaceSoft,
  },
  dayCellDisabled: {
    opacity: 0.36,
  },
  dayCellPressed: {
    backgroundColor: Brand.surfaceAlt,
  },
  dayText: {
    ...Typography.body,
    color: Brand.text,
    fontWeight: '700',
  },
  dayTextSelected: {
    color: '#FFFFFF',
  },
  dayTextToday: {
    color: Brand.greenDark,
  },
  dayTextDisabled: {
    color: Brand.textSecondary,
  },
  dayMarkers: {
    position: 'absolute',
    bottom: 5,
    flexDirection: 'row',
    gap: 4,
  },
  dayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Brand.positive,
  },
  dayWaterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Brand.hydration,
  },
  legendRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendText: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '700',
  },
});
