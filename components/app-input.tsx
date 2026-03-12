import { forwardRef } from 'react';
import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { Brand, Radii, Typography } from '@/constants/theme';

type Props = TextInputProps;

export const AppInput = forwardRef<TextInput, Props>((props, ref) => {
  return (
    <TextInput
      ref={ref}
      placeholderTextColor={Brand.textSecondary}
      selectionColor={Brand.green}
      {...props}
      style={[s.input, props.style]}
    />
  );
});

AppInput.displayName = 'AppInput';

const s = StyleSheet.create({
  input: {
    backgroundColor: Brand.card,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: Radii.lg,
    paddingVertical: 15,
    paddingHorizontal: 18,
    color: Brand.text,
    minHeight: 56,
    ...Typography.body,
    lineHeight: 22,
  },
});
