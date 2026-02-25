/**
 * Card do VidaSync
 *
 * Container branco com sombra sutil e borda suave.
 * Use para agrupar qualquer conteúdo em um bloco visual.
 *
 * Exemplo:
 *   <AppCard>
 *     <Text>Conteúdo aqui dentro</Text>
 *   </AppCard>
 */

import { Brand } from '@/constants/theme';
import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

type Props = PropsWithChildren<{
  style?: ViewStyle;
}>;

export function AppCard({ children, style }: Props) {
  return <View style={[s.card, style]}>{children}</View>;
}

const s = StyleSheet.create({
  card: {
    backgroundColor: Brand.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: Brand.border,
  },
});
