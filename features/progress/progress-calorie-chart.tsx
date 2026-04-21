import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { Brand, Radii, Shadows, Typography } from '@/constants/theme';
import type { PanoramaDay } from '@/services/progress-panorama';

type Props = {
  days: PanoramaDay[];
  goal?: number;
};

const HEIGHT = 150;
const PADDING_TOP = 18;
const PADDING_BOTTOM = 22;
const PADDING_X = 8;

export function ProgressCalorieChart({ days, goal = 2000 }: Props) {
  const [width, setWidth] = useState(0);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const stats = useMemo(() => {
    const activeDays = days.filter((day) => day.hasAnyRecord);
    if (activeDays.length === 0) {
      return { max: 0, avg: 0, total: 0 };
    }
    const max = Math.max(...activeDays.map((day) => day.calories), goal);
    const total = activeDays.reduce((acc, day) => acc + day.calories, 0);
    const avg = total / activeDays.length;
    return { max: max * 1.1, avg, total };
  }, [days, goal]);

  const hasData = stats.total > 0;

  const { linePath, areaPath, points, goalY } = useMemo(() => {
    if (width <= 0 || days.length === 0 || stats.max <= 0) {
      return { linePath: '', areaPath: '', points: [] as { x: number; y: number; day: PanoramaDay }[], goalY: 0 };
    }

    const chartWidth = width - PADDING_X * 2;
    const chartHeight = HEIGHT - PADDING_TOP - PADDING_BOTTOM;
    const stepX = days.length > 1 ? chartWidth / (days.length - 1) : 0;

    const pts = days.map((day, idx) => {
      const x = PADDING_X + idx * stepX;
      const pct = day.hasAnyRecord ? day.calories / stats.max : 0;
      const y = PADDING_TOP + chartHeight * (1 - pct);
      return { x, y, day };
    });

    // Line using smooth curves (cubic bezier)
    const line = pts.reduce((acc, point, idx) => {
      if (idx === 0) return `M ${point.x} ${point.y}`;
      const prev = pts[idx - 1];
      const cpX1 = prev.x + (point.x - prev.x) / 2;
      const cpX2 = prev.x + (point.x - prev.x) / 2;
      return `${acc} C ${cpX1} ${prev.y}, ${cpX2} ${point.y}, ${point.x} ${point.y}`;
    }, '');

    const area = `${line} L ${pts[pts.length - 1].x} ${HEIGHT - PADDING_BOTTOM} L ${pts[0].x} ${HEIGHT - PADDING_BOTTOM} Z`;

    const goalPct = stats.max > 0 ? goal / stats.max : 0;
    const goalYCoord = PADDING_TOP + chartHeight * (1 - goalPct);

    return { linePath: line, areaPath: area, points: pts, goalY: goalYCoord };
  }, [days, stats.max, width, goal]);

  const activeDay = hoverIndex !== null ? days[hoverIndex] : null;

  function handleTap(event: { nativeEvent: { locationX: number } }) {
    if (width <= 0 || days.length === 0) return;
    const chartWidth = width - PADDING_X * 2;
    const stepX = days.length > 1 ? chartWidth / (days.length - 1) : chartWidth;
    const localX = event.nativeEvent.locationX - PADDING_X;
    const idx = Math.round(localX / stepX);
    const clamped = Math.max(0, Math.min(days.length - 1, idx));
    setHoverIndex(clamped);
  }

  function formatShortDate(date: string) {
    const [year, month, day] = date.split('-').map((v) => parseInt(v, 10));
    const parsed = new Date(year, month - 1, day);
    return parsed.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
  }

  return (
    <View style={s.card}>
      <View style={s.header}>
        <View style={s.headerLeft}>
          <View style={s.iconWrap}>
            <Ionicons name="flame" size={14} color={Brand.coral} />
          </View>
          <View>
            <Text style={s.title}>Calorias por dia</Text>
            <Text style={s.subtitle}>
              {hasData
                ? `Média ${Math.round(stats.avg).toLocaleString('pt-BR')} kcal • Meta ${goal.toLocaleString('pt-BR')}`
                : 'Sem dados no período'}
            </Text>
          </View>
        </View>
      </View>

      <Pressable
        style={s.chartShell}
        onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
        onPressIn={handleTap}
        onPress={handleTap}>
        {width > 0 && hasData ? (
          <Svg width={width} height={HEIGHT}>
            <Defs>
              <LinearGradient id="calorieArea" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor={Brand.coral} stopOpacity="0.35" />
                <Stop offset="100%" stopColor={Brand.coral} stopOpacity="0.02" />
              </LinearGradient>
              <LinearGradient id="calorieLine" x1="0%" y1="0%" x2="100%" y2="0%">
                <Stop offset="0%" stopColor={Brand.mango} stopOpacity="1" />
                <Stop offset="100%" stopColor={Brand.coral} stopOpacity="1" />
              </LinearGradient>
            </Defs>

            {/* Goal line */}
            {goal > 0 ? (
              <Path
                d={`M ${PADDING_X} ${goalY} L ${width - PADDING_X} ${goalY}`}
                stroke={Brand.greenDark}
                strokeOpacity={0.45}
                strokeWidth={1}
                strokeDasharray="4 4"
                fill="none"
              />
            ) : null}

            {/* Area */}
            <Path d={areaPath} fill="url(#calorieArea)" />

            {/* Line */}
            <Path d={linePath} stroke="url(#calorieLine)" strokeWidth={2.5} fill="none" strokeLinecap="round" />

            {/* Points */}
            {points.map((point, idx) => {
              if (!point.day.hasAnyRecord) return null;
              const isActive = hoverIndex === idx;
              return (
                <Circle
                  key={idx}
                  cx={point.x}
                  cy={point.y}
                  r={isActive ? 5 : 2.5}
                  fill={isActive ? Brand.coral : '#FFFFFF'}
                  stroke={Brand.coral}
                  strokeWidth={isActive ? 2 : 1.5}
                />
              );
            })}

            {/* Active indicator line */}
            {hoverIndex !== null && points[hoverIndex] ? (
              <Path
                d={`M ${points[hoverIndex].x} ${PADDING_TOP} L ${points[hoverIndex].x} ${HEIGHT - PADDING_BOTTOM}`}
                stroke={Brand.coral}
                strokeOpacity={0.35}
                strokeWidth={1}
                strokeDasharray="2 3"
              />
            ) : null}
          </Svg>
        ) : (
          <View style={[s.empty, { height: HEIGHT }]}>
            <Ionicons name="sparkles-outline" size={22} color={Brand.textMuted} />
            <Text style={s.emptyText}>Registre suas refeições para ver o gráfico</Text>
          </View>
        )}
      </Pressable>

      <View style={s.footer}>
        <View style={s.footerChip}>
          <View style={[s.chipDot, { backgroundColor: Brand.coral }]} />
          <Text style={s.chipLabel}>Calorias</Text>
        </View>
        <View style={s.footerChip}>
          <View style={[s.chipDash, { borderColor: Brand.greenDark }]} />
          <Text style={s.chipLabel}>Meta {goal.toLocaleString('pt-BR')} kcal</Text>
        </View>
      </View>

      {activeDay ? (
        <View style={s.tooltip}>
          <Text style={s.tooltipDate}>{formatShortDate(activeDay.date)}</Text>
          <Text style={s.tooltipValue}>
            {Math.round(activeDay.calories).toLocaleString('pt-BR')}{' '}
            <Text style={s.tooltipUnit}>kcal</Text>
          </Text>
          <Text style={s.tooltipMeta}>
            {activeDay.mealsCount} refeição{activeDay.mealsCount === 1 ? '' : 'ões'} •{' '}
            {Math.round(activeDay.waterMl / 100) / 10}L água
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.xxl,
    borderWidth: 1,
    borderColor: 'rgba(20,108,56,0.08)',
    padding: 18,
    gap: 10,
    ...Shadows.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.coralSoft,
  },
  title: {
    ...Typography.body,
    fontWeight: '800',
    fontSize: 15,
    color: Brand.text,
    letterSpacing: -0.2,
  },
  subtitle: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  chartShell: {
    marginHorizontal: -4,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emptyText: {
    ...Typography.caption,
    color: Brand.textMuted,
    fontSize: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  footerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chipDash: {
    width: 14,
    height: 0,
    borderBottomWidth: 1.5,
    borderStyle: 'dashed',
  },
  chipLabel: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  tooltip: {
    marginTop: 4,
    padding: 10,
    backgroundColor: Brand.coralSoft,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,122,89,0.25)',
  },
  tooltipDate: {
    ...Typography.caption,
    color: Brand.coral,
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  tooltipValue: {
    fontSize: 22,
    fontWeight: '800',
    color: Brand.text,
    letterSpacing: -0.5,
    marginTop: 2,
  },
  tooltipUnit: {
    fontSize: 13,
    fontWeight: '700',
    color: Brand.textSecondary,
  },
  tooltipMeta: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
});
