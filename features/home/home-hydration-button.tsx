import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, Text, View } from 'react-native';

import { s } from '@/features/home/home-hydration-card.styles';

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
  eyebrow,
}: Props) {
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      disabled={disabled}
      style={({ pressed }) => [
        s.waterBtn,
        isPrimary ? s.waterBtnPrimary : s.waterBtnSecondary,
        disabled && s.disabled,
        pressed && s.pressed,
      ]}
      onPress={onPress}>
      {isPrimary ? (
        <View style={s.waterBtnPrimaryContent}>
          <View
            style={[
              s.waterBtnIconWrap,
              tone === 'positive' ? s.waterBtnIconWrapPositive : s.waterBtnIconWrapNegative,
            ]}>
            <Ionicons
              name={tone === 'positive' ? 'add' : 'remove'}
              size={18}
              color={tone === 'positive' ? '#FFFFFF' : '#BE123C'}
            />
          </View>

          <View style={s.waterBtnTextBlock}>
            {eyebrow ? (
              <Text style={[s.waterBtnEyebrow, tone === 'negative' && s.waterBtnEyebrowNegative]}>{eyebrow}</Text>
            ) : null}
            <Text style={[s.waterBtnText, tone === 'positive' ? s.waterBtnTextPrimary : s.waterBtnTextNegative]}>
              {label}
            </Text>
          </View>
        </View>
      ) : (
        <View style={s.waterBtnSecondaryContent}>
          <Ionicons name={tone === 'positive' ? 'add' : 'remove'} size={15} color={tone === 'positive' ? '#0B6B94' : '#BE123C'} />
          <Text style={[s.waterBtnText, tone === 'positive' ? s.waterBtnTextPositive : s.waterBtnTextSecondary]}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
