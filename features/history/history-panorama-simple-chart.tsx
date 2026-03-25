import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Line, Rect } from 'react-native-svg';

import { Brand, Typography } from '@/constants/theme';
import {
  formatPanoramaMetricValue,
  getDisplayPointValue,
  type PanoramaChartGranularity,
  type PanoramaDisplayPoint,
} from '@/features/history/history-panorama-utils';
import type { PanoramaMetric } from '@/services/progress-panorama';

type Props = {
  points: PanoramaDisplayPoint[];
  metric: PanoramaMetric;
  granularity: PanoramaChartGranularity;
  selectedKey: string | null;
  onSelect: (key: string) => void;
};

type Geometry = {
  axisMax: number;
  ticks: number[];
  points: Array<{ key: string; x: number; y: number; value: number }>;
  barWidth: number;
  baselineY: number;
  step: number;
};

const Y_AXIS_WIDTH = 46;
const PLOT_HEIGHT = 204;
const X_AXIS_HEIGHT = 34;

function getMetricTone(metric: PanoramaMetric) {
  if (metric === 'water') {
    return {
      bar: Brand.hydration,
      barMuted: '#A6D4EF',
      grid: '#E7F1F8',
      highlight: '#EFF7FD',
    };
  }

  if (metric === 'meals') {
    return {
      bar: Brand.orange,
      barMuted: '#F7DCAA',
      grid: '#F6EFE3',
      highlight: '#FFF8ED',
    };
  }

  return {
    bar: Brand.greenDark,
    barMuted: '#B9D8C2',
    grid: '#E8F0EA',
    highlight: '#F3F8F4',
  };
}

function getNiceAxisMax(value: number): number {
  if (value <= 0) return 1;

  const raw = value * 1.12;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const normalized = raw / magnitude;
  const steps = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];
  const nextStep = steps.find((step) => normalized <= step) ?? 10;

  return nextStep * magnitude;
}

function buildGeometry(values: number[], plotWidth: number, labelWidth: number): Geometry {
  const sideInset = Math.max(18, Math.ceil(labelWidth / 2));
  const topPadding = 12;
  const bottomPadding = 10;
  const drawableHeight = Math.max(32, PLOT_HEIGHT - topPadding - bottomPadding);
  const axisMax = getNiceAxisMax(Math.max(0, ...values));
  const usableWidth = Math.max(0, plotWidth - sideInset * 2);
  const step = values.length > 1 ? usableWidth / (values.length - 1) : 0;
  const baselineY = PLOT_HEIGHT - bottomPadding;

  const points = values.map((value, index) => {
    const x = values.length === 1 ? plotWidth / 2 : sideInset + step * index;
    const ratio = axisMax > 0 ? value / axisMax : 0;
    const y = topPadding + drawableHeight * (1 - ratio);

    return {
      key: `point-${index}`,
      x,
      y,
      value,
    };
  });

  return {
    axisMax,
    ticks: [axisMax, axisMax / 2, 0],
    points,
    barWidth: Math.min(24, Math.max(14, (step || usableWidth || 56) * 0.56)),
    baselineY,
    step,
  };
}

function clampLabelLeft(x: number, labelWidth: number, plotWidth: number): number {
  return Math.max(0, Math.min(plotWidth - labelWidth, x - labelWidth / 2));
}

function getLabelStep(pointCount: number, granularity: PanoramaChartGranularity): number {
  if (granularity === 'weekly') return 1;
  if (pointCount <= 7) return 1;
  if (pointCount <= 15) return 2;
  return 4;
}

export function HistoryPanoramaSimpleChart({ points, metric, granularity, selectedKey, onSelect }: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const { width: windowWidth } = useWindowDimensions();
  const [containerWidth, setContainerWidth] = useState(0);

  const tone = getMetricTone(metric);
  const labelWidth = granularity === 'weekly' ? 62 : 52;
  const shouldScroll = granularity === 'daily' && points.length > 7;
  const viewportWidth = Math.max(180, (containerWidth || windowWidth - 96) - Y_AXIS_WIDTH);
  const pointSpacing = points.length > 15 ? 50 : 46;
  const sideInset = Math.max(18, Math.ceil(labelWidth / 2));
  const plotWidth = shouldScroll
    ? Math.max(viewportWidth, sideInset * 2 + Math.max(1, points.length - 1) * pointSpacing)
    : viewportWidth;

  const geometry = useMemo(
    () => buildGeometry(points.map((point) => getDisplayPointValue(point, metric)), plotWidth, labelWidth),
    [labelWidth, metric, plotWidth, points],
  );
  const selectedIndex = Math.max(0, points.findIndex((point) => point.key === selectedKey));
  const selectedPoint = points[selectedIndex] ?? points[points.length - 1] ?? null;
  const selectedGeometry = geometry.points[selectedIndex] ?? geometry.points[geometry.points.length - 1] ?? null;
  const labelStep = getLabelStep(points.length, granularity);

  useEffect(() => {
    if (!shouldScroll || plotWidth <= viewportWidth) return;

    const timeout = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: false });
    }, 20);

    return () => clearTimeout(timeout);
  }, [plotWidth, shouldScroll, viewportWidth]);

  if (!selectedPoint || !selectedGeometry) {
    return null;
  }

  const selectedRailWidth = Math.max(34, (geometry.step || 44) * 0.84);
  const selectedRailX = Math.max(0, Math.min(plotWidth - selectedRailWidth, selectedGeometry.x - selectedRailWidth / 2));

  return (
    <View style={s.root} onLayout={(event) => setContainerWidth(event.nativeEvent.layout.width)}>
      <View style={s.chartRow}>
        <View style={[s.axisColumn, { height: PLOT_HEIGHT }]}>
          {geometry.ticks.map((tick, index) => (
            <Text key={`${metric}-${tick}-${index}`} style={s.axisLabel}>
              {formatPanoramaMetricValue(tick, metric, true)}
            </Text>
          ))}
        </View>

        <ScrollView
          ref={scrollRef}
          horizontal={shouldScroll}
          bounces={false}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.scrollContent}>
          <View style={{ width: plotWidth }}>
            <Svg width={plotWidth} height={PLOT_HEIGHT}>
              {geometry.ticks.map((tick, index) => {
                const ratio = geometry.axisMax > 0 ? tick / geometry.axisMax : 0;
                const y = 12 + (PLOT_HEIGHT - 22) * (1 - ratio);

                return (
                  <Line
                    key={`grid-${index}`}
                    x1={0}
                    y1={y}
                    x2={plotWidth}
                    y2={y}
                    stroke={tone.grid}
                    strokeWidth={index === geometry.ticks.length - 1 ? 1.2 : 1}
                  />
                );
              })}

              <Rect
                x={selectedRailX}
                y={6}
                width={selectedRailWidth}
                height={geometry.baselineY - 2}
                rx={18}
                fill={tone.highlight}
              />

              {geometry.points.map((point, index) => {
                const source = points[index];
                const value = source ? getDisplayPointValue(source, metric) : 0;
                const active = source?.key === selectedPoint.key;
                const barHeight = value > 0 ? Math.max(10, geometry.baselineY - point.y) : 4;
                const y = value > 0 ? point.y : geometry.baselineY - barHeight;

                return (
                  <Rect
                    key={`bar-${source?.key ?? index}`}
                    x={point.x - geometry.barWidth / 2}
                    y={y}
                    width={geometry.barWidth}
                    height={barHeight}
                    rx={geometry.barWidth / 2}
                    fill={active ? tone.bar : tone.barMuted}
                    fillOpacity={active ? 1 : value > 0 ? 0.72 : 0.4}
                  />
                );
              })}

              {geometry.points.map((point, index) => {
                const prevPoint = geometry.points[index - 1];
                const nextPoint = geometry.points[index + 1];
                const startX = prevPoint ? (prevPoint.x + point.x) / 2 : 0;
                const endX = nextPoint ? (point.x + nextPoint.x) / 2 : plotWidth;

                return (
                  <Rect
                    key={`hit-${points[index]?.key ?? index}`}
                    x={startX}
                    y={0}
                    width={endX - startX}
                    height={PLOT_HEIGHT}
                    fill="transparent"
                    onPress={() => onSelect(points[index].key)}
                  />
                );
              })}
            </Svg>

            <View style={[s.xAxisWrap, { width: plotWidth }]}>
              {points.map((point, index) => {
                const active = point.key === selectedPoint.key;
                const showLabel = active || index % labelStep === 0 || index === points.length - 1;
                if (!showLabel) return null;

                const x = geometry.points[index]?.x ?? 0;

                return (
                  <Text
                    key={`label-${point.key}`}
                    style={[
                      s.xAxisLabel,
                      {
                        width: labelWidth,
                        left: clampLabelLeft(x, labelWidth, plotWidth),
                        color: active ? Brand.text : Brand.textMuted,
                        fontWeight: active ? '800' : '700',
                      },
                    ]}
                    numberOfLines={1}>
                    {point.tickLabel}
                  </Text>
                );
              })}
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    gap: 10,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  axisColumn: {
    width: Y_AXIS_WIDTH,
    justifyContent: 'space-between',
    paddingRight: 8,
  },
  axisLabel: {
    ...Typography.caption,
    color: Brand.textMuted,
    fontWeight: '700',
    textAlign: 'right',
  },
  scrollContent: {
    paddingRight: 4,
  },
  xAxisWrap: {
    height: X_AXIS_HEIGHT,
    position: 'relative',
    marginTop: 10,
  },
  xAxisLabel: {
    ...Typography.caption,
    position: 'absolute',
    top: 0,
    textAlign: 'center',
  },
});
