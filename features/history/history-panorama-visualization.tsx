import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { AppCard } from '@/components/app-card';
import { Brand, Radii, Typography } from '@/constants/theme';
import {
  getPanoramaVisualSpec,
  type PanoramaVisualVersion,
} from '@/features/history/history-panorama-visuals';
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
  visualVersion: PanoramaVisualVersion;
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
};

const Y_AXIS_WIDTH = 50;
const INDIVIDUAL_HEIGHT = 188;
const MINI_HEIGHT = 112;
const X_AXIS_HEIGHT = 36;
const MINI_GAP = 18;

function getMetricTone(metric: PanoramaMetric, visualVersion: PanoramaVisualVersion): MetricTone {
  if (metric === 'water') {
    if (visualVersion === 'v3') {
      return {
        stroke: '#308CC2',
        fill: '#308CC2',
        areaStart: 'rgba(48, 140, 194, 0.14)',
        areaEnd: 'rgba(48, 140, 194, 0.03)',
        grid: '#D9EAF4',
      };
    }

    if (visualVersion === 'v4') {
      return {
        stroke: '#1878C0',
        fill: '#1878C0',
        areaStart: 'rgba(24, 120, 192, 0.28)',
        areaEnd: 'rgba(24, 120, 192, 0.06)',
        grid: '#CFE6F5',
      };
    }

    return {
      stroke: Brand.hydration,
      fill: Brand.hydration,
      areaStart: visualVersion === 'v2' ? 'rgba(45, 156, 219, 0.28)' : 'rgba(45, 156, 219, 0.22)',
      areaEnd: visualVersion === 'v2' ? 'rgba(45, 156, 219, 0.08)' : 'rgba(45, 156, 219, 0.04)',
      grid: '#D7EAF5',
    };
  }

  if (metric === 'meals') {
    if (visualVersion === 'v3') {
      return {
        stroke: '#D08A18',
        fill: '#D08A18',
        areaStart: 'rgba(208, 138, 24, 0.16)',
        areaEnd: 'rgba(208, 138, 24, 0.04)',
        grid: '#F2E4C9',
      };
    }

    return {
      stroke: Brand.orange,
      fill: Brand.orange,
      areaStart: visualVersion === 'v4' ? 'rgba(244, 166, 42, 0.32)' : 'rgba(244, 166, 42, 0.24)',
      areaEnd: visualVersion === 'v4' ? 'rgba(244, 166, 42, 0.09)' : 'rgba(244, 166, 42, 0.06)',
      grid: '#F2E2BF',
    };
  }

  if (visualVersion === 'v3') {
    return {
      stroke: '#2A7A51',
      fill: '#2A7A51',
      areaStart: 'rgba(42, 122, 81, 0.14)',
      areaEnd: 'rgba(42, 122, 81, 0.03)',
      grid: '#D9E8DF',
    };
  }

  return {
    stroke: Brand.greenDark,
    fill: Brand.greenDark,
    areaStart: visualVersion === 'v4' ? 'rgba(20, 108, 56, 0.28)' : 'rgba(20, 108, 56, 0.22)',
    areaEnd: visualVersion === 'v4' ? 'rgba(20, 108, 56, 0.07)' : 'rgba(20, 108, 56, 0.05)',
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
    if (index === 0) return `M ${point.x} ${point.y}`;
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
  const topPadding = 12;
  const bottomPadding = 10;
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
    barWidth: isBarChart ? Math.min(24, Math.max(12, (step || usableWidth) * 0.56)) : 0,
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
    const prefix = point.dayCount === 1 ? 'Bloco com 1 dia.' : `Bloco com ${point.dayCount} dias.`;
    const recordsText =
      point.daysWithRecords === 0
        ? 'Sem registros neste bloco.'
        : point.daysWithRecords === 1
          ? '1 dia com registro neste bloco.'
          : `${point.daysWithRecords} dias com registro neste bloco.`;

    if (mode === 'compare') {
      return `${prefix} ${recordsText}`;
    }

    if (metric === 'water') return `${prefix} Volume total de agua neste trecho.`;
    if (metric === 'calories') return `${prefix} Total de calorias registradas neste trecho.`;
    return `${prefix} Total de refeicoes registradas neste trecho.`;
  }

  if (!point.hasAnyRecord) {
    return 'Sem registros nesta data.';
  }

  if (mode === 'compare') {
    return 'Agua e refeicoes alinhadas na mesma linha do tempo.';
  }

  if (metric === 'water') return 'Volume de agua registrado nesta data.';
  if (metric === 'calories') return 'Calorias registradas nesta data.';
  return 'Refeicoes registradas nesta data.';
}

function StageDecorations({ visualVersion }: { visualVersion: PanoramaVisualVersion }) {
  if (visualVersion === 'v2') {
    return (
      <>
        <View style={[s.decorBeamVertical, { backgroundColor: 'rgba(31, 167, 80, 0.09)' }]} />
        <View style={[s.decorCircle, s.decorCircleTopRight, { backgroundColor: 'rgba(45, 156, 219, 0.10)' }]} />
      </>
    );
  }

  if (visualVersion === 'v3') {
    return (
      <>
        <View style={[s.decorLine, s.decorLineTop]} />
        <View style={[s.decorLine, s.decorLineBottom]} />
      </>
    );
  }

  if (visualVersion === 'v4') {
    return (
      <>
        <View style={[s.decorCircle, s.decorCircleTopRightLarge, { backgroundColor: 'rgba(31, 167, 80, 0.10)' }]} />
        <View style={[s.decorCircle, s.decorCircleBottomLeft, { backgroundColor: 'rgba(45, 156, 219, 0.12)' }]} />
        <View style={[s.decorBand, { backgroundColor: 'rgba(244, 166, 42, 0.10)' }]} />
      </>
    );
  }

  return (
    <>
      <View style={[s.decorCircle, s.decorCircleTopRight, { backgroundColor: 'rgba(31, 167, 80, 0.08)' }]} />
      <View style={[s.decorCircle, s.decorCircleBottomLeft, { backgroundColor: 'rgba(45, 156, 219, 0.08)' }]} />
    </>
  );
}

function MetricAxis({
  ticks,
  metric,
  height,
  visualVersion,
}: {
  ticks: number[];
  metric: PanoramaMetric;
  height: number;
  visualVersion: PanoramaVisualVersion;
}) {
  const visual = getPanoramaVisualSpec(visualVersion);

  return (
    <View style={[s.axisColumn, { height }]}>
      {ticks.map((tick, index) => (
        <View
          key={`${metric}-${tick}-${index}`}
          style={[
            s.axisLabelShell,
            visual.axisSurface
              ? {
                  backgroundColor: visual.axisSurface,
                  borderColor: visual.axisBorder ?? 'transparent',
                  borderWidth: 1,
                  paddingHorizontal: 8,
                  borderRadius: 12,
                }
              : null,
          ]}>
          <Text style={[s.axisLabel, { color: visual.axisText }]} numberOfLines={1}>
            {formatPanoramaMetricValue(tick, metric, true)}
          </Text>
        </View>
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
  visualVersion,
}: {
  points: PanoramaDisplayPoint[];
  metric: PanoramaMetric;
  plotWidth: number;
  plotHeight: number;
  selectedKey: string | null;
  onSelect: (key: string) => void;
  visualVersion: PanoramaVisualVersion;
}) {
  const isBarChart = metric === 'meals';
  const tone = getMetricTone(metric, visualVersion);
  const visual = getPanoramaVisualSpec(visualVersion);
  const labelWidth = 56;
  const geometry = useMemo(
    () =>
      buildPlotGeometry(
        points.map((point) => getDisplayPointValue(point, metric)),
        plotWidth,
        plotHeight,
        labelWidth,
        isBarChart,
      ),
    [isBarChart, metric, plotHeight, plotWidth, points],
  );

  const linePath = buildLinePath(geometry.points);
  const areaPath = buildAreaPath(geometry.points, plotHeight - 10);
  const selectedIndex = Math.max(0, points.findIndex((point) => point.key === selectedKey));
  const selectedPoint = geometry.points[selectedIndex] ?? geometry.points[geometry.points.length - 1];
  const selectedSource = points[selectedIndex] ?? points[points.length - 1];
  const gradientId = `panorama-gradient-${visualVersion}-${metric}`;

  return (
    <Svg width={plotWidth} height={plotHeight}>
      {geometry.ticks.map((tick, index) => {
        const ratio = geometry.axisMax > 0 ? tick / geometry.axisMax : 0;
        const y = 12 + (plotHeight - 22) * (1 - ratio);

        return (
          <Line
            key={`${metric}-grid-${index}`}
            x1={0}
            y1={y}
            x2={plotWidth}
            y2={y}
            stroke={tone.grid}
            strokeWidth={index === geometry.ticks.length - 1 ? 1.25 : 1}
            strokeDasharray={index === geometry.ticks.length - 1 ? undefined : visual.gridDashArray}
            strokeOpacity={visual.gridOpacity}
          />
        );
      })}

      {selectedPoint ? (
        <Line
          x1={selectedPoint.x}
          y1={12}
          x2={selectedPoint.x}
          y2={plotHeight - 10}
          stroke={tone.stroke}
          strokeWidth={1}
          strokeOpacity={visualVersion === 'v3' ? 0.18 : 0.28}
          strokeDasharray={visualVersion === 'v3' ? '2 6' : '4 4'}
        />
      ) : null}

      {!isBarChart ? (
        <>
          <Defs>
            <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={tone.areaStart} />
              <Stop offset="100%" stopColor={tone.areaEnd} />
            </LinearGradient>
          </Defs>
          <Path d={areaPath} fill={`url(#${gradientId})`} />
          <Path
            d={linePath}
            fill="none"
            stroke={tone.stroke}
            strokeWidth={visual.lineWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {geometry.points.map((point, index) => {
            const active = selectedSource?.key === points[index]?.key;

            return (
              <Circle
                key={`${metric}-dot-${points[index]?.key ?? index}`}
                cx={point.x}
                cy={point.y}
                r={active ? visual.selectedDotRadius : visual.dotRadius}
                fill={active ? '#FFFFFF' : tone.stroke}
                stroke={tone.stroke}
                strokeWidth={active ? 2.4 : 0}
              />
            );
          })}
        </>
      ) : (
        geometry.points.map((point, index) => {
          const nextValue = points[index] ? getDisplayPointValue(points[index], metric) : 0;
          const barHeight = Math.max(2, plotHeight - 10 - point.y);
          const active = selectedSource?.key === points[index]?.key;

          return (
            <Rect
              key={`${metric}-bar-${points[index]?.key ?? index}`}
              x={point.x - geometry.barWidth / 2}
              y={point.y}
              width={geometry.barWidth}
              height={nextValue > 0 ? barHeight : 2}
              rx={geometry.barWidth / (visualVersion === 'v3' ? 4 : 2.7)}
              fill={tone.fill}
              fillOpacity={active ? 1 : visual.barOpacity}
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
  visualVersion,
}: {
  points: PanoramaDisplayPoint[];
  plotWidth: number;
  metric: PanoramaMetric;
  granularity: PanoramaChartGranularity;
  visualVersion: PanoramaVisualVersion;
}) {
  const visual = getPanoramaVisualSpec(visualVersion);
  const labelWidth = granularity === 'weekly' ? 62 : 52;
  const geometry = useMemo(
    () =>
      buildPlotGeometry(
        points.map((point) => getDisplayPointValue(point, metric)),
        plotWidth,
        80,
        labelWidth,
        metric === 'meals',
      ),
    [metric, plotWidth, points, labelWidth],
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
                color: visual.xAxisText,
                backgroundColor: visual.xAxisSurface ?? 'transparent',
                borderColor: visual.xAxisBorder ?? 'transparent',
                borderWidth: visual.xAxisSurface ? 1 : 0,
                borderRadius: visual.xAxisSurface ? 11 : 0,
                paddingHorizontal: visual.xAxisSurface ? 6 : 0,
                paddingVertical: visual.xAxisSurface ? 4 : 0,
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

function CompareLegend({ visualVersion }: { visualVersion: PanoramaVisualVersion }) {
  const visual = getPanoramaVisualSpec(visualVersion);

  return (
    <View style={s.compareLegendRow}>
      {[
        { label: 'Agua', color: Brand.hydration },
        { label: 'Refeicoes', color: Brand.orange },
      ].map((item) => (
        <View
          key={item.label}
          style={[
            s.compareLegendItem,
            visual.legendSurface
              ? {
                  backgroundColor: visual.legendSurface,
                  borderColor: visual.legendBorder ?? 'transparent',
                  borderWidth: 1,
                  borderRadius: 999,
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                }
              : null,
          ]}>
          <View style={[s.compareLegendDot, { backgroundColor: item.color }]} />
          <Text style={[s.compareLegendText, { color: visual.titleTone }]}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

function CompareValueChip({
  label,
  value,
  tint,
  visualVersion,
}: {
  label: string;
  value: string;
  tint: string;
  visualVersion: PanoramaVisualVersion;
}) {
  const visual = getPanoramaVisualSpec(visualVersion);

  return (
    <View
      style={[
        s.valueChip,
        {
          backgroundColor: visual.valueSurface,
          borderColor: visual.valueBorder,
        },
      ]}>
      <Text style={[s.valueChipLabel, { color: tint || visual.valueLabel }]}>{label}</Text>
      <Text style={s.valueChipValue}>{value}</Text>
    </View>
  );
}

export function HistoryPanoramaVisualization({
  days,
  mode,
  metric,
  granularity,
  visualVersion,
}: Props) {
  const visual = getPanoramaVisualSpec(visualVersion);
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
  const labelWidth = granularity === 'weekly' ? 62 : 52;
  const pointSpacing = displayPoints.length > 15 ? 54 : 50;
  const sideInset = Math.max(18, Math.ceil(labelWidth / 2));
  const plotWidth = shouldScroll
    ? Math.max(plotViewportWidth, sideInset * 2 + Math.max(1, displayPoints.length - 1) * pointSpacing)
    : plotViewportWidth;
  const selectedPoint = displayPoints.find((point) => point.key === selectedKey) ?? displayPoints[displayPoints.length - 1] ?? null;
  const selectionTone = mode === 'compare' ? Brand.text : getMetricTone(metric, visualVersion).stroke;
  const waterTicks = useMemo(
    () =>
      buildPlotGeometry(
        displayPoints.map((point) => point.waterMl),
        plotWidth,
        MINI_HEIGHT,
        labelWidth,
        false,
      ).ticks,
    [displayPoints, labelWidth, plotWidth],
  );
  const mealTicks = useMemo(
    () =>
      buildPlotGeometry(
        displayPoints.map((point) => point.mealsCount),
        plotWidth,
        MINI_HEIGHT,
        labelWidth,
        true,
      ).ticks,
    [displayPoints, labelWidth, plotWidth],
  );
  const metricTicks = useMemo(
    () =>
      buildPlotGeometry(
        displayPoints.map((point) => getDisplayPointValue(point, metric)),
        plotWidth,
        INDIVIDUAL_HEIGHT,
        labelWidth,
        metric === 'meals',
      ).ticks,
    [displayPoints, labelWidth, metric, plotWidth],
  );

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
      <AppCard
        style={{
          gap: 8,
          paddingHorizontal: 16,
          paddingVertical: 14,
          backgroundColor: visual.selectionSurface,
          borderColor: visual.selectionBorder,
        }}>
        <View style={[s.selectionEyebrowPill, { backgroundColor: visual.eyebrowSurface }]}>
          <Text style={[s.selectionEyebrow, { color: visual.eyebrowText }]}>
            {granularity === 'weekly' ? 'Resumo selecionado' : 'Ponto selecionado'}
          </Text>
        </View>
        <Text style={[s.selectionTitle, { color: visual.titleTone }]}>{selectedPoint.label}</Text>

        {mode === 'compare' ? (
          <View style={s.selectionChipRow}>
            <CompareValueChip
              label="Agua"
              value={formatPanoramaMetricValue(selectedPoint.waterMl, 'water', false)}
              tint={Brand.hydration}
              visualVersion={visualVersion}
            />
            <CompareValueChip
              label="Refeicoes"
              value={formatPanoramaMetricValue(selectedPoint.mealsCount, 'meals', true)}
              tint={Brand.orange}
              visualVersion={visualVersion}
            />
          </View>
        ) : (
          <Text style={[s.selectionValue, { color: selectionTone }]}>
            {formatPanoramaMetricValue(getDisplayPointValue(selectedPoint, metric), metric, false)}
          </Text>
        )}

        <Text style={[s.selectionHint, { color: visual.hintTone }]}>
          {buildSelectionHint(selectedPoint, mode, metric, granularity)}
        </Text>
      </AppCard>

      <View
        style={[
          s.stageShell,
          {
            backgroundColor: visual.stageSurface,
            borderColor: visual.stageBorder,
          },
        ]}>
        <StageDecorations visualVersion={visualVersion} />

        <View
          style={[
            s.stageInset,
            {
              backgroundColor: visual.stageInsetSurface,
              borderColor: visual.stageInsetBorder,
            },
          ]}>
          {mode === 'compare' ? <CompareLegend visualVersion={visualVersion} /> : null}

          {mode === 'compare' ? (
            <View style={s.compareWrap}>
              <View style={s.compareAxisStack}>
                <MetricAxis
                  ticks={waterTicks}
                  metric="water"
                  height={MINI_HEIGHT}
                  visualVersion={visualVersion}
                />
                <View style={{ height: MINI_GAP }} />
                <MetricAxis
                  ticks={mealTicks}
                  metric="meals"
                  height={MINI_HEIGHT}
                  visualVersion={visualVersion}
                />
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
                    visualVersion={visualVersion}
                  />
                  <View style={{ height: MINI_GAP }} />
                  <MetricPlot
                    points={displayPoints}
                    metric="meals"
                    plotWidth={plotWidth}
                    plotHeight={MINI_HEIGHT}
                    selectedKey={selectedPoint.key}
                    onSelect={setSelectedKey}
                    visualVersion={visualVersion}
                  />
                  <AxisLabels
                    points={displayPoints}
                    plotWidth={plotWidth}
                    metric="water"
                    granularity={granularity}
                    visualVersion={visualVersion}
                  />
                </View>
              </ScrollView>
            </View>
          ) : (
            <View style={s.individualWrap}>
              <MetricAxis
                ticks={metricTicks}
                metric={metric}
                height={INDIVIDUAL_HEIGHT}
                visualVersion={visualVersion}
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
                    visualVersion={visualVersion}
                  />
                  <AxisLabels
                    points={displayPoints}
                    plotWidth={plotWidth}
                    metric={metric}
                    granularity={granularity}
                    visualVersion={visualVersion}
                  />
                </View>
              </ScrollView>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    gap: 14,
  },
  selectionEyebrowPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  selectionEyebrow: {
    ...Typography.caption,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  selectionTitle: {
    ...Typography.subtitle,
    fontWeight: '800',
  },
  selectionValue: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '800',
  },
  selectionHint: {
    ...Typography.body,
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
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
  stageShell: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 26,
    borderWidth: 1,
    padding: 12,
  },
  stageInset: {
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 12,
  },
  compareLegendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
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
    fontWeight: '800',
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
  axisLabelShell: {
    alignSelf: 'flex-end',
  },
  axisLabel: {
    ...Typography.caption,
    fontWeight: '700',
    textAlign: 'right',
  },
  chartScrollContent: {
    paddingRight: 4,
  },
  axisLabelsWrap: {
    height: X_AXIS_HEIGHT,
    position: 'relative',
    marginTop: 10,
  },
  xAxisLabel: {
    ...Typography.caption,
    fontWeight: '700',
    textAlign: 'center',
    position: 'absolute',
    top: 0,
  },
  decorCircle: {
    position: 'absolute',
    borderRadius: 999,
  },
  decorCircleTopRight: {
    width: 120,
    height: 120,
    right: -28,
    top: -28,
  },
  decorCircleTopRightLarge: {
    width: 156,
    height: 156,
    right: -38,
    top: -44,
  },
  decorCircleBottomLeft: {
    width: 108,
    height: 108,
    left: -28,
    bottom: -28,
  },
  decorBeamVertical: {
    position: 'absolute',
    left: 22,
    top: 0,
    bottom: 0,
    width: 48,
    borderRadius: 28,
  },
  decorBand: {
    position: 'absolute',
    left: 26,
    right: 26,
    bottom: 18,
    height: 44,
    borderRadius: 22,
  },
  decorLine: {
    position: 'absolute',
    left: 18,
    right: 18,
    height: 1,
    backgroundColor: 'rgba(21, 32, 24, 0.08)',
  },
  decorLineTop: {
    top: 18,
  },
  decorLineBottom: {
    bottom: 18,
  },
});
