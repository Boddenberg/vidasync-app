import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { Brand, Radii, Shadows, Typography } from '@/constants/theme';

type Props = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
};

type ButtonPalette = {
  background: string;
  pressed: string;
  text: string;
  border: string;
  shadowed: boolean;
};

function resolvePalette(variant: Props['variant']): ButtonPalette {
  if (variant === 'secondary') {
    return {
      background: Brand.surfaceSoft,
      pressed: '#DDEFE3',
      text: Brand.greenDark,
      border: 'transparent',
      shadowed: false,
    };
  }

  if (variant === 'danger') {
    return {
      background: Brand.danger,
      pressed: '#C64444',
      text: '#FFFFFF',
      border: Brand.danger,
      shadowed: true,
    };
  }

  return {
    background: Brand.greenDark,
    pressed: Brand.greenDeeper,
    text: '#FFFFFF',
    border: Brand.greenDark,
    shadowed: true,
  };
}

export function AppButton({ title, onPress, loading, disabled, variant = 'primary' }: Props) {
  const palette = resolvePalette(variant);
  const block = loading || disabled;

  return (
    <Pressable
      style={({ pressed }) => [
        s.btn,
        palette.shadowed && Shadows.card,
        {
          backgroundColor: pressed ? palette.pressed : palette.background,
          borderColor: palette.border,
          opacity: block ? 0.55 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
      ]}
      onPress={onPress}
      disabled={block}>
      {loading ? (
        <ActivityIndicator color={palette.text} size="small" />
      ) : (
        <Text style={[s.text, { color: palette.text }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const s = StyleSheet.create({
  btn: {
    minHeight: 56,
    borderRadius: Radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderWidth: 1,
  },
  text: {
    ...Typography.subtitle,
    fontWeight: '800',
    letterSpacing: 0.1,
  },
});
