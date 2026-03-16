/**
 * Seletor de data.
 *
 * Mantem a opcao "Hoje" e corrige selecoes futuras no proprio front.
 */

import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Brand } from '@/constants/theme';

type Props = {
  value: string;
  useToday: boolean;
  onChangeDate: (date: string) => void;
  onToggleToday: (useToday: boolean) => void;
};

const MONTHS_LABELS = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

const ITEM_H = 38;
const DAYS = Array.from({ length: 31 }, (_, index) => String(index + 1).padStart(2, '0'));
const MONTHS = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, '0'));
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 3 }, (_, index) => String(currentYear - 2 + index));

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function splitDate(date: string) {
  return {
    year: date.slice(0, 4),
    month: date.slice(5, 7),
    day: date.slice(8, 10),
  };
}

function getDaysInMonth(year: string, month: string) {
  return new Date(parseInt(year, 10), parseInt(month, 10), 0).getDate();
}

function normalizeDateSelection(year: string, month: string, day: string, maxDate: string) {
  const safeYear = YEARS.includes(year) ? year : maxDate.slice(0, 4);
  const safeMonth = MONTHS.includes(month) ? month : maxDate.slice(5, 7);
  const maxDayInMonth = getDaysInMonth(safeYear, safeMonth);
  const requestedDay = Math.max(1, parseInt(day, 10) || 1);
  const safeDay = pad(Math.min(requestedDay, maxDayInMonth));
  const candidate = `${safeYear}-${safeMonth}-${safeDay}`;
  const clampedDate = candidate > maxDate ? maxDate : candidate;

  return {
    ...splitDate(clampedDate),
    date: clampedDate,
  };
}

export function DatePicker({ value, useToday, onChangeDate, onToggleToday }: Props) {
  const maxDate = todayStr();
  const initialDate = normalizeDateSelection(
    value ? value.slice(0, 4) : maxDate.slice(0, 4),
    value ? value.slice(5, 7) : maxDate.slice(5, 7),
    value ? value.slice(8, 10) : maxDate.slice(8, 10),
    maxDate,
  );

  const [day, setDay] = useState(initialDate.day);
  const [month, setMonth] = useState(initialDate.month);
  const [year, setYear] = useState(initialDate.year);

  useEffect(() => {
    if (!value) return;

    const normalized = normalizeDateSelection(
      value.slice(0, 4),
      value.slice(5, 7),
      value.slice(8, 10),
      maxDate,
    );

    if (normalized.year !== year) setYear(normalized.year);
    if (normalized.month !== month) setMonth(normalized.month);
    if (normalized.day !== day) setDay(normalized.day);
  }, [value, year, month, day, maxDate]);

  useEffect(() => {
    if (useToday) return;

    const normalized = normalizeDateSelection(year, month, day, maxDate);

    if (normalized.year !== year) setYear(normalized.year);
    if (normalized.month !== month) setMonth(normalized.month);
    if (normalized.day !== day) setDay(normalized.day);

    onChangeDate(normalized.date);
  }, [day, month, year, useToday, onChangeDate, maxDate]);

  function handleToggleToday() {
    if (!useToday) {
      onToggleToday(true);
      onChangeDate(maxDate);
      return;
    }

    const normalized = normalizeDateSelection(year, month, day, maxDate);
    setYear(normalized.year);
    setMonth(normalized.month);
    setDay(normalized.day);
    onToggleToday(false);
    onChangeDate(normalized.date);
  }

  const todayDate = new Date();
  const todayLabel = `${pad(todayDate.getDate())}/${pad(todayDate.getMonth() + 1)}/${todayDate.getFullYear()}`;

  return (
    <View style={s.root}>
      <Pressable style={s.nowRow} onPress={handleToggleToday}>
        <View style={[s.checkbox, useToday && s.checkboxActive]}>
          {useToday ? <Text style={s.checkmark}>v</Text> : null}
        </View>
        <Text style={s.nowLabel}>Hoje</Text>
        {useToday ? <Text style={s.nowTime}>{todayLabel}</Text> : null}
      </Pressable>

      {!useToday ? (
        <View style={s.pickerRow}>
          <View style={s.pickerCol}>
            <Text style={s.pickerLabel}>Dia</Text>
            <View style={s.scrollWrap}>
              <ScrollPicker data={DAYS} selected={day} onSelect={setDay} />
            </View>
          </View>
          <View style={s.pickerColMonth}>
            <Text style={s.pickerLabel}>Mes</Text>
            <View style={s.scrollWrapMonth}>
              <ScrollPickerMonth data={MONTHS} selected={month} onSelect={setMonth} />
            </View>
          </View>
          <View style={s.pickerCol}>
            <Text style={s.pickerLabel}>Ano</Text>
            <View style={s.scrollWrap}>
              <ScrollPicker data={YEARS} selected={year} onSelect={setYear} />
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function ScrollPicker({
  data,
  selected,
  onSelect,
}: {
  data: string[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const index = data.indexOf(selected);
    if (!scrollRef.current || index < 0) return;

    const timer = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: index * ITEM_H, animated: false });
    }, 100);

    return () => clearTimeout(timer);
  }, [data, selected]);

  return (
    <ScrollView
      ref={scrollRef}
      showsVerticalScrollIndicator={false}
      snapToInterval={ITEM_H}
      decelerationRate="fast"
      nestedScrollEnabled
      style={s.flatList}
      contentContainerStyle={s.scrollContent}>
      {data.map((item) => {
        const active = item === selected;
        return (
          <Pressable
            key={item}
            style={[s.pickItem, active && s.pickItemActive]}
            onPress={() => onSelect(item)}>
            <Text style={[s.pickItemText, active && s.pickItemTextActive]}>{item}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function ScrollPickerMonth({
  data,
  selected,
  onSelect,
}: {
  data: string[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const index = data.indexOf(selected);
    if (!scrollRef.current || index < 0) return;

    const timer = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: index * ITEM_H, animated: false });
    }, 100);

    return () => clearTimeout(timer);
  }, [data, selected]);

  return (
    <ScrollView
      ref={scrollRef}
      showsVerticalScrollIndicator={false}
      snapToInterval={ITEM_H}
      decelerationRate="fast"
      nestedScrollEnabled
      style={s.flatListMonth}
      contentContainerStyle={s.scrollContent}>
      {data.map((item) => {
        const active = item === selected;
        const monthIndex = parseInt(item, 10) - 1;

        return (
          <Pressable
            key={item}
            style={[s.pickItem, active && s.pickItemActive]}
            onPress={() => onSelect(item)}>
            <Text style={[s.pickItemText, active && s.pickItemTextActive]}>
              {MONTHS_LABELS[monthIndex]}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: {
    gap: 10,
  },
  nowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Brand.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: Brand.green,
    borderColor: Brand.green,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  nowLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Brand.text,
  },
  nowTime: {
    fontSize: 13,
    fontWeight: '600',
    color: Brand.greenDark,
    marginLeft: 4,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  pickerCol: {
    alignItems: 'center',
    gap: 4,
  },
  pickerColMonth: {
    alignItems: 'center',
    gap: 4,
  },
  pickerLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Brand.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scrollWrap: {
    height: ITEM_H * 3,
    overflow: 'hidden',
    borderRadius: 12,
    backgroundColor: Brand.card,
    borderWidth: 1,
    borderColor: Brand.border,
  },
  scrollWrapMonth: {
    height: ITEM_H * 3,
    overflow: 'hidden',
    borderRadius: 12,
    backgroundColor: Brand.card,
    borderWidth: 1,
    borderColor: Brand.border,
  },
  flatList: {
    width: 64,
  },
  flatListMonth: {
    width: 72,
  },
  scrollContent: {
    paddingVertical: ITEM_H,
  },
  pickItem: {
    height: ITEM_H,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  pickItemActive: {
    backgroundColor: Brand.green,
  },
  pickItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: Brand.textSecondary,
  },
  pickItemTextActive: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
