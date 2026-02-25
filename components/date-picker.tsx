/**
 * Seletor de data
 *
 * Duas opções mutuamente exclusivas:
 *   - Checkbox "Hoje" → usa data atual
 *   - Seletor de dia/mês/ano via scroll
 */

import { Brand } from '@/constants/theme';
import { useEffect, useRef, useState } from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

type Props = {
  value: string;        // "YYYY-MM-DD" ou ""
  useToday: boolean;
  onChangeDate: (date: string) => void;
  onToggleToday: (useToday: boolean) => void;
};

const MONTHS_LABELS = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

function pad(n: number) { return String(n).padStart(2, '0'); }
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const ITEM_H = 38;

// Generate arrays
const DAYS = Array.from({ length: 31 }, (_, i) => pad(i + 1));
const MONTHS = Array.from({ length: 12 }, (_, i) => pad(i + 1));
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 3 }, (_, i) => String(currentYear - 1 + i));

export function DatePicker({ value, useToday, onChangeDate, onToggleToday }: Props) {
  const today = todayStr();

  const [day, setDay] = useState(() => {
    if (value) return value.split('-')[2] ?? pad(new Date().getDate());
    return pad(new Date().getDate());
  });
  const [month, setMonth] = useState(() => {
    if (value) return value.split('-')[1] ?? pad(new Date().getMonth() + 1);
    return pad(new Date().getMonth() + 1);
  });
  const [year, setYear] = useState(() => {
    if (value) return value.split('-')[0] ?? String(new Date().getFullYear());
    return String(new Date().getFullYear());
  });

  useEffect(() => {
    if (!useToday) {
      onChangeDate(`${year}-${month}-${day}`);
    }
  }, [day, month, year, useToday]);

  function handleToggleToday() {
    if (!useToday) {
      onToggleToday(true);
      onChangeDate(todayStr());
    } else {
      onToggleToday(false);
      onChangeDate(`${year}-${month}-${day}`);
    }
  }

  // Format today for display
  const todayDate = new Date();
  const todayLabel = `${pad(todayDate.getDate())}/${pad(todayDate.getMonth() + 1)}/${todayDate.getFullYear()}`;

  return (
    <View style={s.root}>
      {/* Checkbox "Hoje" */}
      <Pressable style={s.nowRow} onPress={handleToggleToday}>
        <View style={[s.checkbox, useToday && s.checkboxActive]}>
          {useToday && <Text style={s.checkmark}>✓</Text>}
        </View>
        <Text style={s.nowLabel}>Hoje</Text>
        {useToday && <Text style={s.nowTime}>{todayLabel}</Text>}
      </Pressable>

      {/* Seletores */}
      {!useToday && (
        <View style={s.pickerRow}>
          <View style={s.pickerCol}>
            <Text style={s.pickerLabel}>Dia</Text>
            <View style={s.scrollWrap}>
              <ScrollPicker data={DAYS} selected={day} onSelect={setDay} />
            </View>
          </View>
          <View style={s.pickerColMonth}>
            <Text style={s.pickerLabel}>Mês</Text>
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
      )}
    </View>
  );
}

// ─── ScrollPicker simples (ScrollView, sem FlatList) ─────

function ScrollPicker({ data, selected, onSelect }: {
  data: string[];
  selected: string;
  onSelect: (val: string) => void;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const initialIdx = data.indexOf(selected);

  useEffect(() => {
    if (scrollRef.current && initialIdx >= 0) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({ y: initialIdx * ITEM_H, animated: false });
      }, 100);
    }
  }, []);

  return (
    <ScrollView
      ref={scrollRef}
      showsVerticalScrollIndicator={false}
      snapToInterval={ITEM_H}
      decelerationRate="fast"
      nestedScrollEnabled
      style={s.flatList}
      contentContainerStyle={{ paddingVertical: ITEM_H }}
    >
      {data.map((item) => {
        const active = item === selected;
        return (
          <Pressable
            key={item}
            style={[s.pickItem, active && s.pickItemActive]}
            onPress={() => onSelect(item)}>
            <Text style={[s.pickItemText, active && s.pickItemTextActive]}>
              {item}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function ScrollPickerMonth({ data, selected, onSelect }: {
  data: string[];
  selected: string;
  onSelect: (val: string) => void;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const initialIdx = data.indexOf(selected);

  useEffect(() => {
    if (scrollRef.current && initialIdx >= 0) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({ y: initialIdx * ITEM_H, animated: false });
      }, 100);
    }
  }, []);

  return (
    <ScrollView
      ref={scrollRef}
      showsVerticalScrollIndicator={false}
      snapToInterval={ITEM_H}
      decelerationRate="fast"
      nestedScrollEnabled
      style={s.flatListMonth}
      contentContainerStyle={{ paddingVertical: ITEM_H }}
    >
      {data.map((item) => {
        const active = item === selected;
        const idx = parseInt(item, 10) - 1;
        return (
          <Pressable
            key={item}
            style={[s.pickItem, active && s.pickItemActive]}
            onPress={() => onSelect(item)}>
            <Text style={[s.pickItemText, active && s.pickItemTextActive]}>
              {MONTHS_LABELS[idx]}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

// ─── Estilos ─────────────────────────────────────────────

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

  // Picker
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
