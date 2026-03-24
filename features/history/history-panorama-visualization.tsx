import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { AppCard } from '@/components/app-card';
import { Brand, Radii, Typography } from '@/constants/theme';
import {
  buildPanoramaDisplayPoints,
  formatPanoramaMetricValue,
  getDisplayPointValue,
  getPanoramaLabelStep,
  type PanoramaChartGranularity,
  type PanoramaDisplayPoint,
} from '@/features/history/history-panorama-utils';
import type { PanoramaDay, PanoramaMetric } from '@/services/progress-panorama';

type PanoramaVisualizationMode = 'individual' | 'compare';

type Props = {
  days: PanoramaDay[];
  mode: PanoramaVisualizationMode;
  metric: PanoramaMetric;
  granularity: PanoramaChartGranularity;
};

type MetricTone = {
  stroke: string;
  fill: string;
  areaStart: string;
  areaEnd: string;
  grid: string;
};

type PlotGeometry = {
  axisMax: number;
  ticks: number[];
  points: Array<{ key: string; x: number; y: number; value: number }>;
  barWidth: number;
  sideInset: number;
};

const Y_AXIS_WIDTH = 48;
const INDIVIDUAL_HEIGHT = 176;
const MINI_HEIGHT = 104;
const X_AXIS_HEIGHT = 28;
const MINI_GAP = 18;

function getMetricTone(metric: PanoramaMetric): MetricTone {
  if (metric === 'water') {
    return {
      stroke: Brand.hydration,
      fill: Brand.hydration,
      areaStart: 'rgba(45, 156, 219, 0.24)',
      areaEnd: 'rgba(45, 156, 219, 0.04)',
      grid: '#D7EAF5',
    };
  }

  if (metric === 'meals') {
    return {
      stroke: Brand.orange,
      fill: Brand.orange,
      areaStart: 'rgba(244, 166, 42, 0.28)',
      areaEnd: 'rgba(244, 166, 42, 0.08)',
      grid: '#F2E2BF',
    };
  }

  return {
    stroke: Brand.greenDark,
    fill: Brand.greenDark,
    areaStart: 'rgba(20, 108, 56, 0.24)',
    areaEnd: 'rgba(20, 108, 56, 0.05)',
    grid: '#D8E8DC',
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

function buildLinePath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return '';
  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y}`;
  }

  return points.reduce((path, point, index) => {
    if (index === 0) {
      return `M ${point.x} ${point.y}`;
    }

    return `${path} L ${point.x} ${point.y}`;
  }, '');
}

function buildAreaPath(points: Array<{ x: number; y: number }>, baselineY: number): string {
  if (points.length === 0) return '';
  if (points.length === 1) {
    return `M ${points[0].x} ${baselineY} L ${points[0].x} ${points[0].y} L ${points[0].x} ${baselineY} Z`;
  }

  return `${buildLinePath(points)} L ${points[points.length - 1].x} ${baselineY} L ${points[0].x} ${baselineY} Z`;
}

function buildPlotGeometry(
  values: number[],
  plotWidth: number,
  plotHeight: number,
  labelWidth: number,
  isBarChart: boolean,
): PlotGeometry {
  const sideInset = Math.max(18, Math.ceil(labelWidth / 2));
  const topPadding = 10;
  const bottomPadding = 8;
  const drawableHeight = Math.max(24, plotHeight - topPadding - bottomPadding);
  const axisMax = getNiceAxisMax(Math.max(0, ...values));
  const usableWidth = Math.max(0, plotWidth - sideInset * 2);
  const step = values.length > 1 ? usableWidth / (values.length - 1) : 0;
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
    barWidth: isBarChart ? Math.min(24, Math.max(12, (step || usableWidth) * 0.55)) : 0,
    sideInset,
  };
}

function clampLabelLeft(x: number, labelWidth: number, plotWidth: number): number {
  return Math.max(0, Math.min(plotWidth - labelWidth, x - labelWidth / 2));
}

function buildSelectionHint(
  point: PanoramaDisplayPoint,
  mode: PanoramaVisualizationMode,
  metric: PanoramaMetric,
  granularity: PanoramaChartGranularity,
): string {
  if (granularity === 'weekly') {
    const prefix = point.dayCount === 1 ? 'Bloco com 1 dia' : `Bloco com ${point.dayCount} dias`;
    const recordsText =
      point.daysWithRecords === 0
        ? 'sem registros'
        : point.daysWithRecords === 1
          ? '1 dia com registro'
          : `${point.daysWithRecords} dias com registro`;

    if (mode === 'compare') {
      return `${prefix} e ${recordsText}.`;
    }

    if (metric === 'water') {
      return `${prefix}. Volume total de água neste trecho.`;
    }

    if (metric === 'calories') {
      return `${prefix}. Total de calorias registradas neste trecho.`;
    }

    return `${prefix}. Total de refeições registradas neste trecho.`;
  }

  if (!point.hasAnyRecord) {
    return 'Sem registros nesta data.';
  }

  if (mode === 'compare') {
    return 'Água e refeições lidas na mesma linha do tempo.';
  }

  if (metric === 'water') return 'Volume de água registrado nesta data.';
  if (metric === 'calories') return 'Calorias registradas nesta data.';
  return 'Refeições registradas nesta data.';
}

function MetricAxis({
  ticks,
  metric,
  height,
}: {
  ticks: number[];
  metric: PanoramaMetric;
  height: number;
}) {
  return (
    <View style={[s.axisColumn, { height }]}>
      {ticks.map((tick, index) => (
        <Text key={`${metric}-${tick}-${index}`} style={s.axisLabel} numberOfLines={1}>
          {formatPanoramaMetricValue(tick, metric, true)}
        </Text>
      ))}
    </View>
  );
}

function MetricPlot({
  points,
  metric,
  plotWidth,
  plotHeight,
  selectedKey,
  onSelect,
}: {
  points: PanoramaDisplayPoint[];
  metric: PanoramaMetric;
  plotWidth: number;
  plotHeight: number;
  selectedKey: string | null;
  onSelect: (key: string) => void;
}) {
  const isBarChart = metric === 'meals';
  const tone = getMetricTone(metric);
  const labelWidth = 56;
  const geometry = useMemo(
    () => buildPlotGeometry(points.map((point) => getDisplayPointValue(point, metric)), plotWidth, plotHeight, labelWidth, isBarChart),
    [isBarChart, metric, plotHeight, plotWidth, points],
  );

  const linePath = buildLinePath(geometry.points);
  const areaPath = buildAreaPath(geometry.points, plotHeight - 8);
  const selectedIndex = Math.max(
    0,
    points.findIndex((point) => point.key === selectedKey),
  );
  const selectedPoint = geometry.points[selectedIndex] ?? geometry.points[geometry.points.length - 1];
  const selectedSource = points[selectedIndex] ?? points[points.length - 1];

  return (
    <Svg width={plotWidth} height={plotHeight}>
      {geometry.ticks.map((tick, index) => {
        const ratio = geometry.axisMax > 0 ? tick / geometry.axisMax : 0;
        const y = 10 + (plotHeight - 18) * (1 - ratio);

        return (
          <Line
            key={`${metric}-grid-${index}`}
            x1={0}
            y1={y}
            x2={plotWidth}
            y2={y}
            stroke={tone.grid}
            strokeWidth={index === geometry.ticks.length - 1 ? 1.25 : 1}
            strokeDasharray={index === geometry.ticks.length - 1 ? undefined : '4 5'}
          />
        );
      })}

      {selectedPoint ? (
        <Line
          x1={selectedPoint.x}
          y1={10}
          x2={selectedPoint.x}
          y2={plotHeight - 8}
          stroke={tone.stroke}
          strokeWidth={1}
          strokeOpacity={0.25}
          strokeDasharray="4 4"
        />
      ) : null}

      {!isBarChart ? (
        <>
          <Defs>
            <LinearGradient id={`panorama-gradient-${metric}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={tone.areaStart} />
              <Stop offset="100%" stopColor={tone.areaEnd} />
            </LinearGradient>
          </Defs>
          <Path d={areaPath} fill={`url(#panorama-gradient-${metric})`} />
          <Path d={linePath} fill="none" stroke={tone.stroke} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
          {geometry.points.map((point, index) => {
            const active = selectedSource?.key === points[index]?.key;

            return (
              <Circle
                key={`${metric}-dot-${points[index]?.key ?? index}`}
                cx={point.x}
                cy={point.y}
                r={active ? 5.2 : 3.2}
                fill={active ? '#FFFFFF' : tone.stroke}
                stroke={tone.stroke}
                strokeWidth={active ? 2.6 : 0}
              />
            );
          })}
        </>
      ) : (
        geometry.points.map((point, index) => {
          const nextValue = points[index] ? getDisplayPointValue(points[index], metric) : 0;
          const barHeight = Math.max(2, plotHeight - 8 - point.y);
          const active = selectedSource?.key === points[index]?.key;

          return (
            <Rect
              key={`${metric}-bar-${points[index]?.key ?? index}`}
              x={point.x - geometry.barWidth / 2}
              y={point.y}
              width={geometry.barWidth}
              height={nextValue > 0 ? barHeight : 2}
              rx={geometry.barWidth / 3}
              fill={tone.fill}
              fillOpacity={active ? 1 : 0.72}
            />
          );
        })
      )}

      {geometry.points.map((point, index) => {
        const prevPoint = geometry.points[index - 1];
        const nextPoint = geometry.points[index + 1];
        const startX = prevPoint ? (prevPoint.x + point.x) / 2 : 0;
        const endX = nextPoint ? (point.x + nextPoint.x) / 2 : plotWidth;

        return (
          <Rect
            key={`${metric}-hit-${points[index]?.key ?? index}`}
            x={startX}
            y={0}
            width={endX - startX}
            height={plotHeight}
            fill="transparent"
            onPress={() => onSelect(points[index].key)}
          />
        );
      })}
    </Svg>
  );
}

function AxisLabels({
  points,
  plotWidth,
  metric,
  granularity,
}: {
  points: PanoramaDisplayPoint[];
  plotWidth: number;
  metric: PanoramaMetric;
  granularity: PanoramaChartGranularity;
}) {
  const labelWidth = granularity === 'weekly' ? 60 : 50;
  const geometry = useMemo(
    () => buildPlotGeometry(points.map((point) => getDisplayPointValue(point, metric)), plotWidth, 80, labelWidth, metric === 'meals'),
    [granularity, metric, plotWidth, points],
  );
  const labelStep = getPanoramaLabelStep(points.length, granularity);

  return (
    <View style={[s.axisLabelsWrap, { width: plotWidth }]}>
      {points.map((point, index) => {
        const showLabel = index % labelStep === 0 || index === points.length - 1;
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
              },
            ]}
            numberOfLines={1}>
            {point.tickLabel}
          </Text>
        );
      })}
    </View>
  );
}

function CompareLegend() {
  return (
    <View style={s.compareLegendRow}>
      <View style={s.compareLegendItem}>
        <View style={[s.compareLegendDot, { backgroundColor: Brand.hydration }]} />
        <Text style={s.compareLegendText}>Água</Text>
      </View>
      <View style={s.compareLegendItem}>
        <View style={[s.compareLegendDot, { backgroundColor: Brand.orange }]} />
        <Text style={s.compareLegendText}>Refeições</Text>
      </View>
    </View>
  );
}

function CompareValueChip({
  label,
  value,
  tint,
}: {
  label: string;
  value: string;
  tint: string;
}) {
  return (
    <View style={s.valueChip}>
      <Text style={[s.valueChipLabel, { color: tint }]}>{label}</Text>
      <Text style={s.valueChipValue}>{value}</Text>
    </View>
  );
}

export function HistoryPanoramaVisualization({
  days,
  mode,
  metric,
  granularity,
}: Props) {
  const displayPoints = useMemo(() => buildPanoramaDisplayPoints(days, granularity), [days, granularity]);
  const [selectedKey, setSelectedKey] = useState<string | null>(displayPoints[displayPoints.length - 1]?.key ?? null);
  const [containerWidth, setContainerWidth] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const { width: windowWidth } = useWindowDimensions();

  useEffect(() => {
    if (!displayPoints.some((point) => point.key === selectedKey)) {
      setSelectedKey(displayPoints[displayPoints.length - 1]?.key ?? null);
    }
  }, [displayPoints, selectedKey]);

  const shouldScroll = granularity === 'daily' && displayPoints.length > 7;
  const plotViewportWidth = Math.max(180, (containerWidth || windowWidth - 96) - Y_AXIS_WIDTH);
  const labelWidth = granularity === 'weekly' ? 60 : 50;
  const sideInset = Math.max(18, Math.ceil(labelWidth / 2));
  const pointSpacing = displayPoints.length > 15 ? 52 : 48;
  const plotWidth = shouldScroll
    ? Math.max(plotViewportWidth, sideInset * 2 + Math.max(1, displayPoints.length - 1) * pointSpacing)
    : plotViewportWidth;
  const selectedPoint = displayPoints.find((point) => point.key === selectedKey) ?? displayPoints[displayPoints.length - 1] ?? null;

  useEffect(() => {
    if (!shouldScroll || plotWidth <= plotViewportWidth) return;

    const timeout = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: false });
    }, 20);

    return () => clearTimeout(timeout);
  }, [plotViewportWidth, plotWidth, shouldScroll]);

  if (!selectedPoint) {
    return null;
  }

  return (
    <View style={s.root} onLayout={(event) => setContainerWidth(event.nativeEvent.layout.width)}>
      <AppCard style={s.selectionCard}>
        <Text style={s.selectionEyebrow}>{granularity === 'weekly' ? 'Resumo selecionado' : 'Ponto selecionado'}</Text>
        <Text style={s.selectionTitle}>{selectedPoint.label}</Text>

        {mode === 'compare' ? (
          <View style={s.selectionChipRow}>
            <CompareValueChip
              label="Água"
              value={formatPanoramaMetricValue(selectedPoint.waterMl, 'water', false)}
              tint={Brand.hydration}
            />
            <CompareValueChip
              label="Refeições"
              value={formatPanoramaMetricValue(selectedPoint.mealsCount, 'meals', true)}
              tint={Brand.orange}
            />
          </View>
        ) : (
          <Text style={s.selectionValue}>
            {formatPanoramaMetricValue(getDisplayPointValue(selectedPoint, metric), metric, false)}
          </Text>
        )}

        <Text style={s.selectionHint}>{buildSelectionHint(selectedPoint, mode, metric, granularity)}</Text>
      </AppCard>

      {mode === 'compare' ? <CompareLegend /> : null}

      {mode === 'compare' ? (
        <View style={s.compareWrap}>
          <View style={s.compareAxisStack}>
            <MetricAxis ticks={buildPlotGeometry(displayPoints.map((point) => point.waterMl), plotWidth, MINI_HEIGHT, labelWidth, false).ticks} metric="water" height={MINI_HEIGHT} />
            <View style={{ height: MINI_GAP }} />
            <MetricAxis ticks={buildPlotGeometry(displayPoints.map((point) => point.mealsCount), plotWidth, MINI_HEIGHT, labelWidth, true).ticks} metric="meals" height={MINI_HEIGHT} />
          </View>

          <ScrollView
            ref={scrollRef}
            horizontal={shouldScroll}
            bounces={false}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.chartScrollContent}>
            <View style={{ width: plotWidth }}>
              <MetricPlot
                points={displayPoints}
                metric="water"
                plotWidth={plotWidth}
                plotHeight={MINI_HEIGHT}
                selectedKey={selectedPoint.key}
                onSelect={setSelectedKey}
              />
              <View style={{ height: MINI_GAP }} />
              <MetricPlot
                points={displayPoints}
                metric="meals"
                plotWidth={plotWidth}
                plotHeight={MINI_HEIGHT}
                selectedKey={selectedPoint.key}
                onSelect={setSelectedKey}
              />
              <AxisLabels points={displayPoints} plotWidth={plotWidth} metric="water" granularity={granularity} />
            </View>
          </ScrollView>
        </View>
      ) : (
        <View style={s.individualWrap}>
          <MetricAxis
            ticks={buildPlotGeometry(displayPoints.map((point) => getDisplayPointValue(point, metric)), plotWidth, INDIVIDUAL_HEIGHT, labelWidth, metric === 'meals').ticks}
            metric={metric}
            height={INDIVIDUAL_HEIGHT}
          />

          <ScrollView
            ref={scrollRef}
            horizontal={shouldScroll}
            bounces={false}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.chartScrollContent}>
            <View style={{ width: plotWidth }}>
              <MetricPlot
                points={displayPoints}
                metric={metric}
                plotWidth={plotWidth}
                plotHeight={INDIVIDUAL_HEIGHT}
                selectedKey={selectedPoint.key}
                onSelect={setSelectedKey}
              />
              <AxisLabels points={displayPoints} plotWidth={plotWidth} metric={metric} granularity={granularity} />
            </View>
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    gap: 14,
  },
  selectionCard: {
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  selectionEyebrow: {
    ...Typography.caption,
    color: Brand.greenDark,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  selectionTitle: {
    ...Typography.subtitle,
    color: Brand.text,
    fontWeight: '800',
  },
  selectionValue: {
    fontSize: 30,
    lineHeight: 34,
    color: Brand.text,
    fontWeight: '800',
  },
  selectionHint: {
    ...Typography.body,
    color: Brand.textSecondary,
  },
  selectionChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 2,
  },
  valueChip: {
    minWidth: 112,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Brand.border,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 3,
  },
  valueChipLabel: {
    ...Typography.caption,
    fontWeight: '800',
  },
  valueChipValue: {
    ...Typography.subtitle,
    color: Brand.text,
    fontWeight: '800',
  },
  compareLegendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'center',
  },
  compareLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  compareLegendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  compareLegendText: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '700',
  },
  individualWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  compareWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  compareAxisStack: {
    width: Y_AXIS_WIDTH,
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
  chartScrollContent: {
    paddingRight: 4,
  },
  axisLabelsWrap: {
    height: X_AXIS_HEIGHT,
    position: 'relative',
    marginTop: 8,
  },
  xAxisLabel: {
    ...Typography.caption,
    color: Brand.textMuted,
    fontWeight: '700',
    textAlign: 'center',
    position: 'absolute',
    top: 0,
  },
});
