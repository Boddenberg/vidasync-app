import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Brand, Radii, Typography } from '@/constants/theme';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: 'positive' | 'negative';
  variant?: 'primary' | 'secondary';
  eyebrow?: string;
};

export function HomeHydrationButton({
  label,
  onPress,
  disabled,
  tone = 'positive',
  variant = 'primary',
  eyebrow: _eyebrow,
}: Props) {
  const isPrimary = variant === 'primary';
  const isPositive = tone === 'positive';

  if (!isPrimary) {
    return (
      <Pressable
        disabled={disabled}
        style={({ pressed }) => [
          s.secondary,
          isPositive ? s.secondaryPositive : s.secondaryNegative,
          disabled && s.disabled,
          pressed && s.pressed,
        ]}
        onPress={onPress}>
        <Ionicons
          name={isPositive ? 'add' : 'remove'}
          size={14}
          color={isPositive ? Brand.hydration : '#BE123C'}
        />
        <Text
          numberOfLines={1}
          style={[s.secondaryLabel, isPositive ? s.secondaryLabelPositive : s.secondaryLabelNegative]}>
          {label}
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      disabled={disabled}
      style={({ pressed }) => [
        s.primary,
        isPositive ? s.primaryPositive : s.primaryNegative,
        disabled && s.disabled,
        pressed && s.pressed,
      ]}
      onPress={onPress}>
      <View
        style={[
          s.primaryIcon,
          isPositive ? s.primaryIconPositive : s.primaryIconNegative,
        ]}>
        <Ionicons
          name={isPositive ? 'add' : 'remove'}
          size={15}
          color={isPositive ? '#FFFFFF' : '#FFFFFF'}
        />
      </View>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
        style={[s.primaryLabel, isPositive ? s.primaryLabelPositive : s.primaryLabelNegative]}>
        {label}
      </Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  primary: {
    flex: 1,
    minWidth: 0,
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: Radii.pill,
    borderWidth: 1,
  },
  primaryPositive: {
    backgroundColor: '#F2FAFF',
    borderColor: '#CFE8F6',
  },
  primaryNegative: {
    backgroundColor: '#FFF4F6',
    borderColor: '#F7D6DC',
  },
  primaryIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryIconPositive: {
    backgroundColor: Brand.hydration,
  },
  primaryIconNegative: {
    backgroundColor: '#E0607E',
  },
  primaryLabel: {
    ...Typography.body,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.1,
    flexShrink: 1,
  },
  primaryLabelPositive: {
    color: Brand.hydration,
  },
  primaryLabelNegative: {
    color: '#BE123C',
  },
  secondary: {
    flex: 1,
    minWidth: 0,
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: Radii.pill,
    borderWidth: 1,
  },
  secondaryPositive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D9ECF9',
  },
  secondaryNegative: {
    backgroundColor: '#FFFFFF',
    borderColor: '#F7D6DC',
  },
  secondaryLabel: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: -0.1,
    flexShrink: 1,
  },
  secondaryLabelPositive: {
    color: Brand.hydration,
  },
  secondaryLabelNegative: {
    color: '#BE123C',
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.97 }],
  },
  disabled: {
    opacity: 0.45,
  },
});
