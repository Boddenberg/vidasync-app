import Ionicons from '@expo/vector-icons/Ionicons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Brand, Radii, Shadows, Typography } from '@/constants/theme';
import type { PanoramaDay } from '@/services/progress-panorama';

type Props = {
  visible: boolean;
  day: PanoramaDay | null;
  onClose: () => void;
  onViewFullDay?: (date: string) => void;
};

export function ProgressDayDetailModal({ visible, day, onClose, onViewFullDay }: Props) {
  if (!day) {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <Pressable style={s.backdrop} onPress={onClose} />
      </Modal>
    );
  }

  const dateLabel = formatLongDate(day.date);
  const calories = Math.round(day.calories);
  const waterL = (day.waterMl / 1000).toFixed(1);
  const goalL = (day.waterGoalMl / 1000).toFixed(1);
  const hasData = day.hasAnyRecord;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose}>
        <Pressable style={s.sheet} onPress={() => {}}>
          <View style={s.header}>
            <View>
              <Text style={s.eyebrow}>DETALHE DO DIA</Text>
              <Text style={s.title}>{dateLabel}</Text>
            </View>
            <Pressable onPress={onClose} style={s.closeBtn}>
              <Ionicons name="close" size={20} color={Brand.text} />
            </Pressable>
          </View>

          {!hasData ? (
            <View style={s.emptyBox}>
              <View style={s.emptyIcon}>
                <Ionicons name="sparkles-outline" size={22} color={Brand.textMuted} />
              </View>
              <Text style={s.emptyTitle}>Sem registros</Text>
              <Text style={s.emptyText}>
                Este dia ficou sem refeições ou hidratação. Você pode registrá-los no histórico.
              </Text>
            </View>
          ) : (
            <>
              <View style={s.rowStats}>
                <StatBox
                  icon="flame"
                  iconColor={Brand.coral}
                  iconBg={Brand.coralSoft}
                  value={calories.toLocaleString('pt-BR')}
                  unit="kcal"
                  label="Calorias"
                />
                <StatBox
                  icon="water"
                  iconColor={Brand.hydration}
                  iconBg={Brand.hydrationBg}
                  value={waterL}
                  unit="L"
                  label={day.waterGoalMl > 0 ? `Meta ${goalL}L` : 'Hidratação'}
                />
                <StatBox
                  icon="restaurant"
                  iconColor={Brand.greenDark}
                  iconBg={Brand.mintSoft}
                  value={`${day.mealsCount}`}
                  unit={day.mealsCount === 1 ? 'ref.' : 'ref.'}
                  label="Refeições"
                />
              </View>

              <View style={s.macrosRow}>
                <MacroPill
                  label="P"
                  value={Math.round(day.protein)}
                  unit="g"
                  color={Brand.macroProtein}
                  bg={Brand.macroProteinBg}
                />
                <MacroPill
                  label="C"
                  value={Math.round(day.carbs)}
                  unit="g"
                  color={Brand.macroCarb}
                  bg={Brand.macroCarbBg}
                />
                <MacroPill
                  label="G"
                  value={Math.round(day.fat)}
                  unit="g"
                  color={Brand.macroFat}
                  bg={Brand.macroFatBg}
                />
              </View>

              {day.waterGoalMl > 0 ? (
                <View style={s.hydrationLine}>
                  <Ionicons
                    name={day.waterGoalReached ? 'checkmark-circle' : 'time-outline'}
                    size={14}
                    color={day.waterGoalReached ? Brand.fresh : Brand.mango}
                  />
                  <Text style={s.hydrationText}>
                    {day.waterGoalReached
                      ? 'Meta de hidratação atingida neste dia'
                      : `Faltou ${((day.waterGoalMl - day.waterMl) / 1000).toFixed(1)}L para bater a meta`}
                  </Text>
                </View>
              ) : null}

              {onViewFullDay ? (
                <Pressable
                  style={s.cta}
                  onPress={() => {
                    onViewFullDay(day.date);
                    onClose();
                  }}>
                  <Text style={s.ctaText}>Ver dia completo</Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                </Pressable>
              ) : null}
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function StatBox({
  icon,
  iconColor,
  iconBg,
  value,
  unit,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  value: string;
  unit: string;
  label: string;
}) {
  return (
    <View style={s.statBox}>
      <View style={[s.statIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={14} color={iconColor} />
      </View>
      <View style={s.statValueRow}>
        <Text style={s.statValue}>{value}</Text>
        <Text style={s.statUnit}>{unit}</Text>
      </View>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function MacroPill({
  label,
  value,
  unit,
  color,
  bg,
}: {
  label: string;
  value: number;
  unit: string;
  color: string;
  bg: string;
}) {
  return (
    <View style={[s.macroPill, { backgroundColor: bg }]}>
      <View style={[s.macroDot, { backgroundColor: color }]}>
        <Text style={s.macroLabel}>{label}</Text>
      </View>
      <Text style={[s.macroValue, { color }]}>
        {value}
        <Text style={s.macroUnit}>{unit}</Text>
      </Text>
    </View>
  );
}

function formatLongDate(date: string) {
  const [year, month, day] = date.split('-').map((v) => parseInt(v, 10));
  const parsed = new Date(year, month - 1, day);
  const weekday = parsed.toLocaleDateString('pt-BR', { weekday: 'long' });
  const rest = parsed.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
  const pretty = `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}, ${rest}`;
  return pretty;
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(8,18,10,0.45)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.xxl,
    padding: 22,
    gap: 14,
    ...Shadows.floating,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  eyebrow: {
    ...Typography.caption,
    color: Brand.greenDeeper,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '800',
    color: Brand.text,
    letterSpacing: -0.4,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.surfaceAlt,
  },
  emptyBox: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 20,
  },
  emptyIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Brand.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    ...Typography.body,
    fontWeight: '800',
    fontSize: 15,
    color: Brand.text,
  },
  emptyText: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  rowStats: {
    flexDirection: 'row',
    gap: 8,
  },
  statBox: {
    flex: 1,
    padding: 10,
    gap: 4,
    borderRadius: Radii.lg,
    backgroundColor: Brand.surface,
    borderWidth: 1,
    borderColor: 'rgba(20,108,56,0.05)',
  },
  statIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Brand.text,
    letterSpacing: -0.4,
  },
  statUnit: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  statLabel: {
    ...Typography.caption,
    color: Brand.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  macrosRow: {
    flexDirection: 'row',
    gap: 8,
  },
  macroPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: Radii.md,
  },
  macroDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  macroLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  macroValue: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  macroUnit: {
    fontSize: 11,
    fontWeight: '700',
  },
  hydrationLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Brand.surface,
    borderRadius: Radii.md,
  },
  hydrationText: {
    ...Typography.caption,
    fontSize: 12,
    color: Brand.textSecondary,
    fontWeight: '600',
    flex: 1,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: Radii.pill,
    backgroundColor: Brand.greenDeeper,
    marginTop: 2,
  },
  ctaText: {
    ...Typography.body,
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
