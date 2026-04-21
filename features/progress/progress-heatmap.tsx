import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { Brand, Radii, Shadows, Typography } from '@/constants/theme';
import type { HeatmapCell } from '@/features/progress/progress-insights';

type Props = {
  cells: HeatmapCell[];
  onCellPress?: (cell: HeatmapCell) => void;
  totalDays: number;
};

const CELL_SIZE = 14;
const CELL_GAP = 4;
const LEFT_LABELS_WIDTH = 18;

export function ProgressHeatmap({ cells, onCellPress, totalDays }: Props) {
  const { weeks, monthMarkers } = useMemo(() => {
    if (cells.length === 0) {
      return { weeks: [] as HeatmapCell[][], monthMarkers: [] as { weekIndex: number; label: string }[] };
    }

    // Group cells by week index
    const maxWeek = cells.reduce((max, cell) => Math.max(max, cell.weekIndex), 0);
    const weeksArr: HeatmapCell[][] = Array.from({ length: maxWeek + 1 }, () => []);
    cells.forEach((cell) => {
      weeksArr[cell.weekIndex][cell.weekdayIndex] = cell;
    });

    // Month markers
    const markers: { weekIndex: number; label: string }[] = [];
    let lastMonth = -1;
    cells.forEach((cell) => {
      const date = new Date(cell.date + 'T12:00:00');
      const month = date.getMonth();
      if (month !== lastMonth) {
        const label = date
          .toLocaleDateString('pt-BR', { month: 'short' })
          .replace('.', '')
          .toUpperCase();
        markers.push({ weekIndex: cell.weekIndex, label });
        lastMonth = month;
      }
    });

    return { weeks: weeksArr, monthMarkers: markers };
  }, [cells]);

  const width = weeks.length * (CELL_SIZE + CELL_GAP) - CELL_GAP + LEFT_LABELS_WIDTH;
  const gridHeight = 7 * (CELL_SIZE + CELL_GAP) - CELL_GAP;
  const monthLabelsHeight = 14;
  const totalHeight = gridHeight + monthLabelsHeight + 4;

  const activeCount = cells.filter((cell) => cell.hasRecord).length;

  return (
    <View style={s.card}>
      <View style={s.header}>
        <View style={s.headerLeft}>
          <View style={s.iconWrap}>
            <Ionicons name="grid-outline" size={14} color={Brand.greenDeeper} />
          </View>
          <View>
            <Text style={s.title}>Mapa de atividade</Text>
            <Text style={s.subtitle}>
              {activeCount} de {totalDays} dias registrados
            </Text>
          </View>
        </View>
        <View style={s.rangeBadge}>
          <Text style={s.rangeBadgeText}>{totalDays}d</Text>
        </View>
      </View>

      <View style={s.gridShell}>
        <Svg width={width} height={totalHeight}>
          <Defs>
            <LinearGradient id="heatmapGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={Brand.fresh} stopOpacity="1" />
              <Stop offset="100%" stopColor={Brand.forest} stopOpacity="1" />
            </LinearGradient>
          </Defs>

          {/* Cells */}
          {weeks.map((week, weekIndex) =>
            week.map((cell, weekdayIndex) => {
              if (!cell) return null;
              const x = LEFT_LABELS_WIDTH + weekIndex * (CELL_SIZE + CELL_GAP);
              const y = monthLabelsHeight + weekdayIndex * (CELL_SIZE + CELL_GAP);
              const fill = cell.hasRecord ? 'url(#heatmapGradient)' : Brand.mintSoft;
              const opacity = cell.hasRecord ? 0.2 + cell.intensity * 0.8 : 0.6;

              return (
                <Rect
                  key={`${weekIndex}-${weekdayIndex}`}
                  x={x}
                  y={y}
                  width={CELL_SIZE}
                  height={CELL_SIZE}
                  rx={3.5}
                  fill={fill}
                  opacity={opacity}
                />
              );
            }),
          )}
        </Svg>

        {/* Month labels overlay */}
        <View style={[s.monthLabelsRow, { width }]}>
          {monthMarkers.map((marker, idx) => {
            const left = LEFT_LABELS_WIDTH + marker.weekIndex * (CELL_SIZE + CELL_GAP);
            return (
              <Text key={`${marker.label}-${idx}`} style={[s.monthLabel, { left }]}>
                {marker.label}
              </Text>
            );
          })}
        </View>

        {/* Weekday labels overlay */}
        <View style={[s.weekdayLabels, { top: monthLabelsHeight }]}>
          {['S', 'T', 'Q'].map((label, idx) => {
            const top = (idx * 2 + 1) * (CELL_SIZE + CELL_GAP);
            return (
              <Text key={`${label}-${idx}`} style={[s.weekdayLabel, { top }]}>
                {label}
              </Text>
            );
          })}
        </View>

        {/* Tap overlay (separate from SVG so Pressable works reliably) */}
        {onCellPress ? (
          <View style={[s.tapOverlay, { top: monthLabelsHeight }]} pointerEvents="box-none">
            {weeks.map((week, weekIndex) =>
              week.map((cell, weekdayIndex) => {
                if (!cell) return null;
                const left = LEFT_LABELS_WIDTH + weekIndex * (CELL_SIZE + CELL_GAP);
                const top = weekdayIndex * (CELL_SIZE + CELL_GAP);
                return (
                  <Pressable
                    key={`tap-${weekIndex}-${weekdayIndex}`}
                    style={[
                      s.cellTap,
                      {
                        left,
                        top,
                        width: CELL_SIZE,
                        height: CELL_SIZE,
                      },
                    ]}
                    onPress={() => onCellPress(cell)}
                    hitSlop={1}
                  />
                );
              }),
            )}
          </View>
        ) : null}
      </View>

      <View style={s.legendRow}>
        <Text style={s.legendLabel}>Menos</Text>
        <View style={s.legendDots}>
          <View style={[s.legendDot, { backgroundColor: Brand.mintSoft, opacity: 0.6 }]} />
          <View style={[s.legendDot, { backgroundColor: Brand.fresh, opacity: 0.35 }]} />
          <View style={[s.legendDot, { backgroundColor: Brand.fresh, opacity: 0.6 }]} />
          <View style={[s.legendDot, { backgroundColor: Brand.fresh, opacity: 0.85 }]} />
          <View style={[s.legendDot, { backgroundColor: Brand.forest, opacity: 1 }]} />
        </View>
        <Text style={s.legendLabel}>Mais</Text>
      </View>
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
    backgroundColor: Brand.mintSoft,
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
  rangeBadge: {
    backgroundColor: Brand.mintSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.pill,
  },
  rangeBadgeText: {
    ...Typography.caption,
    color: Brand.greenDeeper,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  gridShell: {
    position: 'relative',
    alignItems: 'flex-start',
  },
  monthLabelsRow: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 12,
  },
  monthLabel: {
    position: 'absolute',
    top: 0,
    fontSize: 9,
    fontWeight: '700',
    color: Brand.textMuted,
    letterSpacing: 0.4,
  },
  weekdayLabels: {
    position: 'absolute',
    left: 0,
    width: 14,
    height: '100%',
  },
  weekdayLabel: {
    position: 'absolute',
    left: 0,
    fontSize: 9,
    fontWeight: '700',
    color: Brand.textMuted,
    letterSpacing: 0.3,
  },
  tapOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  cellTap: {
    position: 'absolute',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    marginTop: 2,
  },
  legendLabel: {
    ...Typography.caption,
    fontSize: 10,
    color: Brand.textMuted,
    fontWeight: '600',
  },
  legendDots: {
    flexDirection: 'row',
    gap: 3,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 2.5,
  },
});
