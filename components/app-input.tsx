/**
 * Campo de texto do VidaSync
 *
 * Input estilizado com a identidade visual do app.
 *
 * Exemplo:
 *   <AppInput
 *     placeholder="O que você comeu?"
 *     value={text}
 *     onChangeText={setText}
 *   />
 */

import { Brand } from '@/constants/theme';
import { forwardRef } from 'react';
import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

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
    backgroundColor: Brand.bg,
    borderWidth: 1.5,
    borderColor: Brand.border,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    color: Brand.text,
    minHeight: 52,
    lineHeight: 22,
  },
});
