import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { Brand, Radii, Shadows } from '@/constants/theme';

export function ChatTypingIndicator() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    function animateDot(value: Animated.Value, delay: number) {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(value, {
            toValue: 1,
            duration: 420,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration: 420,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      );
    }

    const loops = [animateDot(dot1, 0), animateDot(dot2, 140), animateDot(dot3, 280)];
    loops.forEach((loop) => loop.start());

    return () => {
      loops.forEach((loop) => loop.stop());
    };
  }, [dot1, dot2, dot3]);

  const dotStyle = (value: Animated.Value) => ({
    transform: [
      {
        translateY: value.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }),
      },
    ],
    opacity: value.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] }),
  });

  return (
    <View style={s.row}>
      <View style={s.avatar}>
        <Ionicons name="sparkles" size={12} color={Brand.greenDeeper} />
      </View>
      <View style={s.bubble}>
        <View style={s.dots}>
          <Animated.View style={[s.dot, dotStyle(dot1)]} />
          <Animated.View style={[s.dot, dotStyle(dot2)]} />
          <Animated.View style={[s.dot, dotStyle(dot3)]} />
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Brand.mintSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 6,
    borderTopRightRadius: Radii.xl,
    borderBottomRightRadius: Radii.xl,
    borderBottomLeftRadius: Radii.xl,
    borderWidth: 1,
    borderColor: 'rgba(20,108,56,0.08)',
    ...Shadows.soft,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Brand.greenDeeper,
  },
});
