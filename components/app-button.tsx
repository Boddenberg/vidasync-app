/**
 * Botão principal do VidaSync
 *
 * Componente reutilizável para botões.
 * Sempre que precisar de um botão no app, use este.
 *
 * Exemplo:
 *   <AppButton title="Calcular" onPress={handlePress} />
 *   <AppButton title="Enviar" loading={true} />
 *   <AppButton title="Deletar" variant="danger" />
 */

import { Brand } from '@/constants/theme';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

type Props = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
};

export function AppButton({ title, onPress, loading, disabled, variant = 'primary' }: Props) {
  const bgColor =
    variant === 'secondary' ? Brand.orange :
    variant === 'danger' ? Brand.danger :
    Brand.green;

  const bgPressed =
    variant === 'secondary' ? '#D9874E' :
    variant === 'danger' ? '#C04040' :
    Brand.greenDark;

  return (
    <Pressable
      style={({ pressed }) => [
        s.btn,
        { backgroundColor: bgColor },
        pressed && { backgroundColor: bgPressed },
        (loading || disabled) && s.disabled,
      ]}
      onPress={onPress}
      disabled={loading || disabled}>
      {loading ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        <Text style={s.text}>{title}</Text>
      )}
    </Pressable>
  );
}

const s = StyleSheet.create({
  btn: {
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
