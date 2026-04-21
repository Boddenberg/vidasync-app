import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { Brand, Radii, Shadows, Typography } from '@/constants/theme';

export type ChatSuggestion = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  title: string;
  prompt: string;
};

type Props = {
  userName: string;
  onSuggestionPress: (prompt: string) => void;
};

const SUGGESTIONS: ChatSuggestion[] = [
  {
    id: 'meal-idea',
    icon: 'restaurant',
    iconColor: Brand.fresh,
    iconBg: Brand.mintSoft,
    title: 'Ideias de refeição',
    prompt: 'Me dê 3 ideias de café da manhã com alta proteína e menos de 500 kcal.',
  },
  {
    id: 'analyze',
    icon: 'analytics',
    iconColor: Brand.hydration,
    iconBg: Brand.hydrationBg,
    title: 'Analisar meu dia',
    prompt: 'Analise minhas refeições de hoje e aponte o que posso melhorar.',
  },
  {
    id: 'hydration',
    icon: 'water',
    iconColor: Brand.hydration,
    iconBg: Brand.hydrationBg,
    title: 'Dicas de hidratação',
    prompt: 'Como posso melhorar minha hidratação durante o dia?',
  },
  {
    id: 'macro',
    icon: 'pie-chart',
    iconColor: Brand.mango,
    iconBg: '#FFF4DD',
    title: 'Meta de macros',
    prompt: 'Ajude a definir minhas metas de proteína, carboidrato e gordura.',
  },
];

export function ChatEmptyState({ userName, onSuggestionPress }: Props) {
  const pulse = useRef(new Animated.Value(0)).current;
  const innerPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const outer = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 2400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 2400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    const inner = Animated.loop(
      Animated.sequence([
        Animated.timing(innerPulse, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(innerPulse, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    outer.start();
    inner.start();
    return () => {
      outer.stop();
      inner.stop();
    };
  }, [pulse, innerPulse]);

  const outerScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1.1] });
  const outerOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.1] });
  const innerScale = innerPulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.05] });

  const firstName = userName?.split(' ')[0] ?? 'você';

  return (
    <View style={s.wrap}>
      {/* AI Orb */}
      <View style={s.orbStage}>
        <Animated.View
          style={[
            s.orbOuter,
            { transform: [{ scale: outerScale }], opacity: outerOpacity },
          ]}
        />
        <Animated.View style={[s.orbInner, { transform: [{ scale: innerScale }] }]}>
          <Svg width={110} height={110}>
            <Defs>
              <RadialGradient id="orbGrad" cx="50%" cy="45%" rx="55%" ry="55%">
                <Stop offset="0%" stopColor="#6DE695" stopOpacity="1" />
                <Stop offset="55%" stopColor={Brand.fresh} stopOpacity="1" />
                <Stop offset="100%" stopColor={Brand.forest} stopOpacity="1" />
              </RadialGradient>
              <RadialGradient id="orbGloss" cx="38%" cy="28%" rx="28%" ry="20%">
                <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
                <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Circle cx={55} cy={55} r={55} fill="url(#orbGrad)" />
            <Circle cx={55} cy={55} r={55} fill="url(#orbGloss)" />
          </Svg>
          <View style={s.orbIcon}>
            <Ionicons name="sparkles" size={34} color="#FFFFFF" />
          </View>
        </Animated.View>
      </View>

      <Text style={s.greeting}>Oi, {firstName} 👋</Text>
      <Text style={s.title}>Sou a Fitty, sua IA de nutrição.</Text>
      <Text style={s.subtitle}>
        Me conte o que você precisa ou use uma das sugestões abaixo para começar.
      </Text>

      <View style={s.suggestionsLabel}>
        <View style={s.suggestionsLine} />
        <Text style={s.suggestionsCaption}>SUGESTÕES RÁPIDAS</Text>
        <View style={s.suggestionsLine} />
      </View>

      <View style={s.suggestionsGrid}>
        {SUGGESTIONS.map((suggestion) => (
          <Pressable
            key={suggestion.id}
            onPress={() => onSuggestionPress(suggestion.prompt)}
            style={({ pressed }) => [s.suggestionCard, pressed && s.suggestionCardPressed]}>
            <View style={[s.suggestionIcon, { backgroundColor: suggestion.iconBg }]}>
              <Ionicons name={suggestion.icon} size={16} color={suggestion.iconColor} />
            </View>
            <Text style={s.suggestionTitle}>{suggestion.title}</Text>
            <Text style={s.suggestionPrompt} numberOfLines={2}>
              {suggestion.prompt}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingBottom: 12,
  },
  orbStage: {
    width: 150,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  orbOuter: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: Brand.fresh,
  },
  orbInner: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.floating,
  },
  orbIcon: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greeting: {
    ...Typography.body,
    fontSize: 14,
    color: Brand.textSecondary,
    fontWeight: '600',
    marginTop: 4,
  },
  title: {
    ...Typography.title,
    fontSize: 22,
    lineHeight: 27,
    fontWeight: '800',
    color: Brand.text,
    letterSpacing: -0.5,
    textAlign: 'center',
    marginTop: 4,
  },
  subtitle: {
    ...Typography.caption,
    fontSize: 13,
    lineHeight: 18,
    color: Brand.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 10,
  },
  suggestionsLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 22,
    marginBottom: 12,
    width: '100%',
    paddingHorizontal: 12,
  },
  suggestionsLine: {
    flex: 1,
    height: 1,
    backgroundColor: Brand.border,
  },
  suggestionsCaption: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '800',
    color: Brand.textMuted,
    letterSpacing: 1.1,
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    width: '100%',
  },
  suggestionCard: {
    flexBasis: '48%',
    flexGrow: 1,
    padding: 14,
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(20,108,56,0.08)',
    ...Shadows.soft,
  },
  suggestionCardPressed: {
    transform: [{ scale: 0.98 }],
    backgroundColor: Brand.surfaceAlt,
  },
  suggestionIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  suggestionTitle: {
    ...Typography.body,
    fontSize: 13,
    fontWeight: '800',
    color: Brand.text,
    letterSpacing: -0.2,
  },
  suggestionPrompt: {
    ...Typography.caption,
    fontSize: 11,
    color: Brand.textSecondary,
    fontWeight: '500',
    lineHeight: 15,
  },
});
