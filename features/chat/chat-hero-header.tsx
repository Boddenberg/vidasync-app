import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

import { Brand, Radii, Shadows, Typography } from '@/constants/theme';

type Props = {
  agentName: string;
  subtitle: string;
  canStartNew: boolean;
  onStartNew: () => void;
  online: boolean;
};

export function ChatHeroHeader({ agentName, subtitle, canStartNew, onStartNew, online }: Props) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] });

  return (
    <View style={s.header}>
      <View style={s.identity}>
        <View style={s.avatarSlot}>
          <Animated.View
            style={[
              s.pulseRing,
              { transform: [{ scale: ringScale }], opacity: ringOpacity },
            ]}
          />
          <View style={s.avatarGradientWrap}>
            <Svg width={46} height={46}>
              <Defs>
                <LinearGradient id="fittyAvatar" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor={Brand.fresh} stopOpacity="1" />
                  <Stop offset="100%" stopColor={Brand.forest} stopOpacity="1" />
                </LinearGradient>
              </Defs>
              <Circle cx={23} cy={23} r={23} fill="url(#fittyAvatar)" />
            </Svg>
            <View style={s.avatarOverlay}>
              <Ionicons name="sparkles" size={20} color="#FFFFFF" />
            </View>
          </View>
          {online ? <View style={s.onlineDot} /> : null}
        </View>

        <View style={s.identityCopy}>
          <View style={s.nameRow}>
            <Text style={s.name}>{agentName}</Text>
            <View style={s.aiBadge}>
              <Ionicons name="flash" size={8} color={Brand.greenDeeper} />
              <Text style={s.aiBadgeText}>IA</Text>
            </View>
          </View>
          <Text style={s.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [
          s.newBtn,
          !canStartNew && s.newBtnDisabled,
          pressed && canStartNew && s.newBtnPressed,
        ]}
        onPress={onStartNew}
        disabled={!canStartNew}>
        <Ionicons
          name="refresh"
          size={14}
          color={canStartNew ? Brand.greenDeeper : Brand.textMuted}
        />
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
    gap: 12,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  avatarSlot: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Brand.fresh,
  },
  avatarGradientWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...Shadows.soft,
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineDot: {
    position: 'absolute',
    right: 1,
    bottom: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: Brand.fresh,
  },
  identityCopy: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    ...Typography.subtitle,
    fontSize: 19,
    fontWeight: '800',
    color: Brand.text,
    letterSpacing: -0.4,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radii.pill,
    backgroundColor: Brand.mintSoft,
  },
  aiBadgeText: {
    ...Typography.caption,
    fontSize: 9,
    fontWeight: '800',
    color: Brand.greenDeeper,
    letterSpacing: 0.7,
  },
  subtitle: {
    ...Typography.caption,
    fontSize: 11,
    color: Brand.textSecondary,
    fontWeight: '600',
    marginTop: 1,
  },
  newBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Brand.border,
    ...Shadows.soft,
  },
  newBtnDisabled: {
    backgroundColor: Brand.surfaceAlt,
    borderColor: Brand.surfaceAlt,
  },
  newBtnPressed: {
    transform: [{ scale: 0.95 }],
  },
});
