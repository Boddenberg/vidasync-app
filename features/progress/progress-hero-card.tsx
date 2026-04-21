import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

import { Brand, Radii, Shadows, Typography } from '@/constants/theme';
import { formatTrendLabel, scoreToTier, type ProgressScore, type ProgressStreak, type ProgressTrend } from '@/features/progress/progress-insights';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = {
  score: ProgressScore;
  streak: ProgressStreak;
  trend: ProgressTrend;
  activeDays: number;
  totalDays: number;
};

export function ProgressHeroCard({ score, streak, trend, activeDays, totalDays }: Props) {
  const size = 148;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(1, score.overall / 100));
  const animated = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animated, {
      toValue: progress,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [animated, progress]);

  const strokeDashoffset = animated.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  const tier = scoreToTier(score.overall);
  const trendMeta = formatTrendLabel(trend);

  return (
    <View style={s.card}>
      <View pointerEvents="none" style={s.glowTop} />
      <View pointerEvents="none" style={s.glowBottom} />

      <View style={s.eyebrowRow}>
        <View style={s.eyebrowPill}>
          <Ionicons name="sparkles" size={12} color={Brand.greenDeeper} />
          <Text style={s.eyebrowText}>ÍNDICE DE PROGRESSO</Text>
        </View>
        <View style={[s.trendPill, { backgroundColor: `${trendMeta.color}18`, borderColor: `${trendMeta.color}35` }]}>
          <Ionicons name={trendMeta.icon} size={12} color={trendMeta.color} />
          <Text style={[s.trendText, { color: trendMeta.color }]}>{trendMeta.label}</Text>
        </View>
      </View>

      <View style={s.body}>
        <View style={s.ringWrap}>
          <Svg width={size} height={size}>
            <Defs>
              <LinearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={Brand.fresh} stopOpacity="1" />
                <Stop offset="100%" stopColor={Brand.forest} stopOpacity="1" />
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
              stroke="url(#scoreGradient)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              fill="transparent"
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={strokeDashoffset as unknown as number}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          </Svg>

          <View style={s.ringCenter}>
            <Text style={s.scoreValue}>{score.overall}</Text>
            <Text style={s.scoreUnit}>/100</Text>
          </View>
        </View>

        <View style={s.copyCol}>
          <Text style={[s.tier, { color: tier.color }]}>{tier.label}</Text>
          <Text style={s.tierDesc}>{tier.description}</Text>

          <View style={s.miniStats}>
            <MiniStat
              icon="flame"
              iconColor={Brand.coral}
              iconBg={Brand.coralSoft}
              value={streak.current}
              unit={streak.current === 1 ? 'dia' : 'dias'}
              label="Sequência atual"
            />
            <MiniStat
              icon="trophy"
              iconColor={Brand.mango}
              iconBg="#FFF4DD"
              value={streak.best}
              unit={streak.best === 1 ? 'dia' : 'dias'}
              label="Recorde"
            />
          </View>
        </View>
      </View>

      <View style={s.divider} />

      <View style={s.footerRow}>
        <FooterStat
          label="Consistência"
          value={`${score.consistency}%`}
          icon="checkmark-circle"
          color={Brand.greenDark}
        />
        <View style={s.footerSep} />
        <FooterStat
          label="Hidratação"
          value={`${score.hydration}%`}
          icon="water"
          color={Brand.hydration}
        />
        <View style={s.footerSep} />
        <FooterStat
          label="Dias ativos"
          value={`${activeDays}/${totalDays}`}
          icon="calendar"
          color={Brand.mango}
        />
      </View>
    </View>
  );
}

function MiniStat({
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
  value: number;
  unit: string;
  label: string;
}) {
  return (
    <View style={s.miniStat}>
      <View style={[s.miniStatIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={12} color={iconColor} />
      </View>
      <View style={s.miniStatCopy}>
        <View style={s.miniStatValueRow}>
          <Text style={s.miniStatValue}>{value}</Text>
          <Text style={s.miniStatUnit}>{unit}</Text>
        </View>
        <Text style={s.miniStatLabel}>{label}</Text>
      </View>
    </View>
  );
}

function FooterStat({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}) {
  return (
    <View style={s.footerStat}>
      <Ionicons name={icon} size={14} color={color} />
      <Text style={s.footerValue}>{value}</Text>
      <Text style={s.footerLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.xxl,
    borderWidth: 1,
    borderColor: 'rgba(20,108,56,0.08)',
    padding: 22,
    gap: 18,
    overflow: 'hidden',
    ...Shadows.floating,
  },
  glowTop: {
    position: 'absolute',
    top: -120,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(31,167,80,0.12)',
  },
  glowBottom: {
    position: 'absolute',
    left: -70,
    bottom: -90,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(244,166,42,0.10)',
  },
  eyebrowRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  eyebrowPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Brand.mintSoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.pill,
  },
  eyebrowText: {
    ...Typography.caption,
    color: Brand.greenDeeper,
    fontWeight: '800',
    fontSize: 10,
    letterSpacing: 0.8,
  },
  trendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.pill,
    borderWidth: 1,
  },
  trendText: {
    ...Typography.caption,
    fontWeight: '800',
    fontSize: 11,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  ringWrap: {
    width: 148,
    height: 148,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreValue: {
    fontSize: 42,
    lineHeight: 46,
    color: Brand.text,
    fontWeight: '800',
    letterSpacing: -1.5,
  },
  scoreUnit: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '700',
    marginTop: -4,
  },
  copyCol: {
    flex: 1,
    gap: 6,
    minWidth: 0,
  },
  tier: {
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  tierDesc: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  miniStats: {
    gap: 8,
    marginTop: 8,
  },
  miniStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniStatIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniStatCopy: {
    flex: 1,
  },
  miniStatValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  miniStatValue: {
    ...Typography.body,
    color: Brand.text,
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: -0.3,
  },
  miniStatUnit: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '700',
    fontSize: 11,
  },
  miniStatLabel: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontSize: 10,
    fontWeight: '600',
    marginTop: -2,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(21,32,24,0.06)',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerStat: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  footerSep: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(21,32,24,0.06)',
  },
  footerValue: {
    ...Typography.body,
    color: Brand.text,
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: -0.2,
  },
  footerLabel: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
});
