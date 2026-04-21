import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { Brand, Radii, Shadows, Typography } from '@/constants/theme';
import type { PanoramaDay } from '@/services/progress-panorama';

type Props = {
  days: PanoramaDay[];
  hitRate: number; // 0..1
  hits: number;
  totalWithGoal: number;
};

const CHART_HEIGHT = 140;
const PADDING_TOP = 12;
const PADDING_BOTTOM = 28;

export function ProgressHydrationBars({ days, hitRate, hits, totalWithGoal }: Props) {
  const [width, setWidth] = useState(0);

  const recent = useMemo(() => {
    // Show last 14 days max for readability
    const slice = days.slice(-14);
    const max = Math.max(...slice.map((day) => Math.max(day.waterMl, day.waterGoalMl)), 1);
    return { slice, max };
  }, [days]);

  const hitRatePct = Math.round(hitRate * 100);
  const totalMl = recent.slice.reduce((acc, day) => acc + day.waterMl, 0);
  const avgMl = recent.slice.length > 0 ? totalMl / recent.slice.length : 0;

  const barCount = recent.slice.length;
  const availableWidth = width;
  const gap = 4;
  const barWidth = barCount > 0 ? Math.max(6, (availableWidth - gap * (barCount - 1)) / barCount) : 0;
  const chartInnerHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

  function formatShortDate(date: string) {
    const [year, month, day] = date.split('-').map((v) => parseInt(v, 10));
    const parsed = new Date(year, month - 1, day);
    return parsed.toLocaleDateString('pt-BR', { day: '2-digit' });
  }

  return (
    <View style={s.card}>
      <View style={s.header}>
        <View style={s.headerLeft}>
          <View style={s.iconWrap}>
            <Ionicons name="water" size={14} color={Brand.hydration} />
          </View>
          <View style={s.headerCopy}>
            <Text style={s.title}>Hidratação</Text>
            <Text style={s.subtitle}>
              {totalWithGoal > 0
                ? `${hits}/${totalWithGoal} dias na meta • ${(avgMl / 1000).toFixed(1)}L média`
                : 'Defina sua meta de hidratação'}
            </Text>
          </View>
        </View>
        <View style={s.scoreBadge}>
          <Text style={s.scoreValue}>{hitRatePct}%</Text>
          <Text style={s.scoreLabel}>adesão</Text>
        </View>
      </View>

      <View
        style={s.chartShell}
        onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}>
        {width > 0 && barCount > 0 ? (
          <Svg width={width} height={CHART_HEIGHT}>
            <Defs>
              <LinearGradient id="hydrationFill" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor={Brand.sky} stopOpacity="1" />
                <Stop offset="100%" stopColor="#6DC3EA" stopOpacity="1" />
              </LinearGradient>
              <LinearGradient id="hydrationMiss" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor="#CFE7F3" stopOpacity="1" />
                <Stop offset="100%" stopColor="#E8F3F9" stopOpacity="1" />
              </LinearGradient>
            </Defs>

            {recent.slice.map((day, idx) => {
              const x = idx * (barWidth + gap);
              const pct = day.waterMl / recent.max;
              const height = Math.max(2, pct * chartInnerHeight);
              const y = PADDING_TOP + (chartInnerHeight - height);

              const reached = day.waterGoalReached;
              const fill = reached ? 'url(#hydrationFill)' : 'url(#hydrationMiss)';

              return (
                <Rect
                  key={day.date}
                  x={x}
                  y={y}
                  width={barWidth}
                  height={height}
                  rx={Math.min(barWidth / 2, 6)}
                  fill={fill}
                />
              );
            })}

            {/* Goal line */}
            {recent.slice.some((day) => day.waterGoalMl > 0) ? (
              <Rect
                x={0}
                y={
                  PADDING_TOP +
                  chartInnerHeight *
                    (1 -
                      Math.max(
                        ...recent.slice
                          .filter((day) => day.waterGoalMl > 0)
                          .map((day) => day.waterGoalMl / recent.max),
                      ))
                }
                width={width}
                height={1}
                fill={Brand.hydration}
                opacity={0.25}
              />
            ) : null}

          </Svg>
        ) : (
          <View style={[s.empty, { height: CHART_HEIGHT }]}>
            <Ionicons name="water-outline" size={22} color={Brand.textMuted} />
            <Text style={s.emptyText}>Registre água para ver suas barras</Text>
          </View>
        )}

        {/* Date labels overlay (better text rendering outside SVG) */}
        {width > 0 && barCount > 0 ? (
          <View style={[s.datesRow, { width }]}>
            {recent.slice.map((day, idx) => {
              if (idx % Math.max(1, Math.floor(barCount / 7)) !== 0) return null;
              const left = idx * (barWidth + gap);
              return (
                <Text
                  key={day.date}
                  style={[s.dateLabel, { left, width: barWidth }]}
                  numberOfLines={1}>
                  {formatShortDate(day.date)}
                </Text>
              );
            })}
          </View>
        ) : null}
      </View>

      <View style={s.footer}>
        <View style={s.legendChip}>
          <View style={[s.chipDot, { backgroundColor: Brand.sky }]} />
          <Text style={s.chipLabel}>Meta atingida</Text>
        </View>
        <View style={s.legendChip}>
          <View style={[s.chipDot, { backgroundColor: '#CFE7F3' }]} />
          <Text style={s.chipLabel}>Abaixo da meta</Text>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.xxl,
    borderWidth: 1,
    borderColor: 'rgba(45,156,219,0.10)',
    padding: 18,
    gap: 12,
    ...Shadows.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.hydrationBg,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
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
  scoreBadge: {
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: Brand.hydrationBg,
    borderRadius: Radii.md,
  },
  scoreValue: {
    fontSize: 16,
    fontWeight: '800',
    color: Brand.hydration,
    letterSpacing: -0.4,
  },
  scoreLabel: {
    ...Typography.caption,
    fontSize: 9,
    fontWeight: '700',
    color: Brand.hydration,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginTop: -2,
  },
  chartShell: {
    position: 'relative',
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
  datesRow: {
    position: 'absolute',
    left: 0,
    bottom: 2,
    height: 14,
  },
  dateLabel: {
    position: 'absolute',
    textAlign: 'center',
    fontSize: 9,
    fontWeight: '700',
    color: Brand.textMuted,
    letterSpacing: 0.3,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  legendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chipLabel: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
});
