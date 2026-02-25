/**
 * Seletor de horário
 *
 * Duas opções mutuamente exclusivas:
 *   - Checkbox "Agora" → usa hora atual
 *   - Seletor de hora e minuto via scroll
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
  value: string; // "HH:MM" ou ""
  useNow: boolean;
  onChangeTime: (time: string) => void;
  onToggleNow: (useNow: boolean) => void;
};

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));
const ITEM_H = 38;

function pad(n: number) { return String(n).padStart(2, '0'); }
function nowTime() { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; }

export function TimePicker({ value, useNow, onChangeTime, onToggleNow }: Props) {
  const [hour, setHour] = useState(() => {
    if (value) return value.split(':')[0] ?? '12';
    return pad(new Date().getHours());
  });
  const [minute, setMinute] = useState(() => {
    if (value) return value.split(':')[1] ?? '00';
    const m = new Date().getMinutes();
    return pad(Math.round(m / 5) * 5 % 60);
  });

  // Sync para cima quando muda
  useEffect(() => {
    if (!useNow) {
      onChangeTime(`${hour}:${minute}`);
    }
  }, [hour, minute, useNow]);

  function handleToggleNow() {
    if (!useNow) {
      onToggleNow(true);
      onChangeTime(nowTime());
    } else {
      onToggleNow(false);
      onChangeTime(`${hour}:${minute}`);
    }
  }

  return (
    <View style={s.root}>
      {/* Checkbox "Agora" */}
      <Pressable style={s.nowRow} onPress={handleToggleNow}>
        <View style={[s.checkbox, useNow && s.checkboxActive]}>
          {useNow && <Text style={s.checkmark}>✓</Text>}
        </View>
        <Text style={s.nowLabel}>Agora</Text>
        {useNow && <Text style={s.nowTime}>{nowTime()}</Text>}
      </Pressable>

      {/* Seletores de hora e minuto */}
      {!useNow && (
        <View style={s.pickerRow}>
          <View style={s.pickerCol}>
            <Text style={s.pickerLabel}>Hora</Text>
            <View style={s.scrollWrap}>
              <ScrollPicker
                data={HOURS}
                selected={hour}
                onSelect={setHour}
              />
            </View>
          </View>
          <Text style={s.colon}>:</Text>
          <View style={s.pickerCol}>
            <Text style={s.pickerLabel}>Min</Text>
            <View style={s.scrollWrap}>
              <ScrollPicker
                data={MINUTES}
                selected={minute}
                onSelect={setMinute}
              />
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
    gap: 8,
  },
  pickerCol: {
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
  colon: {
    fontSize: 22,
    fontWeight: '700',
    color: Brand.text,
    marginTop: 18,
  },
  scrollWrap: {
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
    fontSize: 18,
    fontWeight: '500',
    color: Brand.textSecondary,
  },
  pickItemTextActive: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
