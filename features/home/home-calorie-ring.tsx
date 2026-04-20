import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

import { Brand, Typography } from '@/constants/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = {
  size?: number;
  strokeWidth?: number;
  progress: number;
  calories: number;
  goal: number | null;
  reached?: boolean;
};

export function HomeCalorieRing({
  size = 200,
  strokeWidth = 16,
  progress,
  calories,
  goal,
  reached,
}: Props) {
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const animated = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animated, {
      toValue: clampedProgress,
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [animated, clampedProgress]);

  const strokeDashoffset = animated.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  const remainingLabel = goal
    ? reached
      ? 'Meta alcançada'
      : `de ${Math.round(goal)} kcal`
    : 'sem meta definida';

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="calorieGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={reached ? Brand.fresh : Brand.greenDark} stopOpacity="1" />
            <Stop offset="100%" stopColor={reached ? Brand.forest : Brand.fresh} stopOpacity="1" />
          </LinearGradient>
        </Defs>

        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={Brand.mintSoft}
          strokeWidth={strokeWidth}
          fill="transparent"
        />

        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#calorieGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="transparent"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset as unknown as number}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>

      <View style={styles.center}>
        <Text style={styles.eyebrow}>CONSUMIDO</Text>
        <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
          {calories}
        </Text>
        <Text style={styles.unit}>kcal</Text>
        <Text style={styles.remaining}>{remainingLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  eyebrow: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '800',
    letterSpacing: 1.1,
    fontSize: 10,
  },
  value: {
    fontSize: 48,
    lineHeight: 52,
    color: Brand.text,
    fontWeight: '800',
    letterSpacing: -1.5,
  },
  unit: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginTop: -4,
  },
  remaining: {
    ...Typography.caption,
    color: Brand.greenDeeper,
    fontWeight: '700',
    marginTop: 6,
    paddingHorizontal: 8,
    textAlign: 'center',
  },
});
