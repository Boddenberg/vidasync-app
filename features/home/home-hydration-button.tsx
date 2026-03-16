import { Pressable, Text } from 'react-native';

import { s } from '@/features/home/home-hydration-card.styles';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: 'positive' | 'negative';
};

export function HomeHydrationButton({
  label,
  onPress,
  disabled,
  tone = 'positive',
}: Props) {
  return (
    <Pressable
      disabled={disabled}
      style={({ pressed }) => [
        s.waterBtn,
        tone === 'positive' ? s.waterBtnPositive : s.waterBtnNegative,
        disabled && s.disabled,
        pressed && s.pressed,
      ]}
      onPress={onPress}>
      <Text style={[s.waterBtnText, tone === 'positive' ? s.waterBtnTextPositive : s.waterBtnTextNegative]}>
        {label}
      </Text>
    </Pressable>
  );
}
