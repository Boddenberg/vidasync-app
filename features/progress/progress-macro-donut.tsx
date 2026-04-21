import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Brand, Radii, Shadows, Typography } from '@/constants/theme';
import type { MacroAverages, MacroDistribution } from '@/features/progress/progress-insights';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = {
  averages: MacroAverages;
  distribution: MacroDistribution;
};

const SIZE = 132;
const STROKE = 16;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ProgressMacroDonut({ averages, distribution }: Props) {
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    progressAnim.setValue(0);
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progressAnim, distribution.proteinPct, distribution.carbsPct, distribution.fatPct]);

  const proteinLen = distribution.proteinPct * CIRCUMFERENCE;
  const carbsLen = distribution.carbsPct * CIRCUMFERENCE;
  const fatLen = distribution.fatPct * CIRCUMFERENCE;

  // Each arc: strokeDasharray static ("arcLen rest") so only one arc is drawn per rotation.
  // strokeDashoffset animates from arcLen (hidden) to 0 (fully revealed).
  const proteinOffset = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [proteinLen, 0],
  });
  const carbsOffset = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [carbsLen, 0],
  });
  const fatOffset = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [fatLen, 0],
  });

  // Angle each arc starts from (measured in degrees, 0 = 12 o'clock after rotate(-90))
  const carbsStartDeg = -90 + distribution.proteinPct * 360;
  const fatStartDeg = -90 + (distribution.proteinPct + distribution.carbsPct) * 360;

  const hasData = averages.calories > 0;
  const totalKcal = Math.round(
    averages.protein * 4 + averages.carbs * 4 + averages.fat * 9,
  );

  return (
    <View style={s.card}>
      <View style={s.header}>
        <View style={s.iconWrap}>
          <Ionicons name="pie-chart" size={14} color={Brand.greenDeeper} />
        </View>
        <View style={s.headerCopy}>
          <Text style={s.title}>Composição média</Text>
          <Text style={s.subtitle}>
            {hasData ? `${totalKcal.toLocaleString('pt-BR')} kcal/dia` : 'Registre para ver'}
          </Text>
        </View>
      </View>

      <View style={s.body}>
        <View style={s.donutWrap}>
          <Svg width={SIZE} height={SIZE}>
            {/* Background ring */}
            <Circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              stroke={Brand.surfaceAlt}
              strokeWidth={STROKE}
              fill="transparent"
            />

            {hasData ? (
              <>
                {/* Protein */}
                {proteinLen > 0 ? (
                  <AnimatedCircle
                    cx={SIZE / 2}
                    cy={SIZE / 2}
                    r={RADIUS}
                    stroke={Brand.macroProtein}
                    strokeWidth={STROKE}
                    fill="transparent"
                    strokeDasharray={`${proteinLen} ${CIRCUMFERENCE}`}
                    strokeDashoffset={proteinOffset as unknown as number}
                    strokeLinecap="butt"
                    transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
                  />
                ) : null}
                {/* Carbs */}
                {carbsLen > 0 ? (
                  <AnimatedCircle
                    cx={SIZE / 2}
                    cy={SIZE / 2}
                    r={RADIUS}
                    stroke={Brand.macroCarb}
                    strokeWidth={STROKE}
                    fill="transparent"
                    strokeDasharray={`${carbsLen} ${CIRCUMFERENCE}`}
                    strokeDashoffset={carbsOffset as unknown as number}
                    strokeLinecap="butt"
                    transform={`rotate(${carbsStartDeg} ${SIZE / 2} ${SIZE / 2})`}
                  />
                ) : null}
                {/* Fat */}
                {fatLen > 0 ? (
                  <AnimatedCircle
                    cx={SIZE / 2}
                    cy={SIZE / 2}
                    r={RADIUS}
                    stroke={Brand.macroFat}
                    strokeWidth={STROKE}
                    fill="transparent"
                    strokeDasharray={`${fatLen} ${CIRCUMFERENCE}`}
                    strokeDashoffset={fatOffset as unknown as number}
                    strokeLinecap="butt"
                    transform={`rotate(${fatStartDeg} ${SIZE / 2} ${SIZE / 2})`}
                  />
                ) : null}
              </>
            ) : null}
          </Svg>

          <View style={s.donutCenter}>
            <Text style={s.donutCaption}>PROTEÍNA</Text>
            <Text style={s.donutValue}>{Math.round(distribution.proteinPct * 100)}%</Text>
          </View>
        </View>

        <View style={s.legend}>
          <LegendItem
            color={Brand.macroProtein}
            bg={Brand.macroProteinBg}
            label="Proteína"
            pct={distribution.proteinPct}
            grams={averages.protein}
          />
          <LegendItem
            color={Brand.macroCarb}
            bg={Brand.macroCarbBg}
            label="Carboidratos"
            pct={distribution.carbsPct}
            grams={averages.carbs}
          />
          <LegendItem
            color={Brand.macroFat}
            bg={Brand.macroFatBg}
            label="Gorduras"
            pct={distribution.fatPct}
            grams={averages.fat}
          />
        </View>
      </View>
    </View>
  );
}

function LegendItem({
  color,
  bg,
  label,
  pct,
  grams,
}: {
  color: string;
  bg: string;
  label: string;
  pct: number;
  grams: number;
}) {
  return (
    <View style={s.legendItem}>
      <View style={[s.legendBadge, { backgroundColor: bg }]}>
        <View style={[s.legendDot, { backgroundColor: color }]} />
      </View>
      <View style={s.legendCopy}>
        <Text style={s.legendLabel}>{label}</Text>
        <Text style={s.legendValueRow}>
          <Text style={[s.legendValue, { color }]}>{Math.round(pct * 100)}%</Text>
          <Text style={s.legendGrams}>  •  {Math.round(grams)}g</Text>
        </Text>
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
    gap: 14,
    ...Shadows.card,
  },
  header: {
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
    backgroundColor: Brand.mintSoft,
  },
  headerCopy: {
    flex: 1,
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
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  donutWrap: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutCaption: {
    ...Typography.caption,
    color: Brand.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  donutValue: {
    fontSize: 26,
    fontWeight: '800',
    color: Brand.text,
    letterSpacing: -0.8,
    marginTop: -2,
  },
  legend: {
    flex: 1,
    gap: 10,
    minWidth: 0,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendCopy: {
    flex: 1,
    minWidth: 0,
  },
  legendLabel: {
    ...Typography.caption,
    color: Brand.text,
    fontWeight: '700',
    fontSize: 12,
  },
  legendValueRow: {
    marginTop: 1,
  },
  legendValue: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  legendGrams: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
});
