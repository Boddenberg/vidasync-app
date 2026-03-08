import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { Brand } from '@/constants/theme';
import type { ChatQuickAction } from '@/types/chat';

export const CHAT_QUICK_ACTIONS: ChatQuickAction[] = [
  {
    id: 'bmi_calculator',
    label: 'Calcular IMC',
    route: '/tools/imc',
    description: 'Abre a calculadora de IMC como acao rapida no fluxo conversacional.',
  },
];

type Props = {
  actions?: ChatQuickAction[];
  onPressAction: (action: ChatQuickAction) => void;
};

/*
 * Barra de acoes rapidas para chat.
 *
 * Neste momento ja disponibiliza o atalho de IMC e permite adicionar
 * novos atalhos sem alterar o componente.
 */
export function ChatQuickActions({
  actions = CHAT_QUICK_ACTIONS,
  onPressAction,
}: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={s.row}>
      {actions.map((action) => (
        <Pressable
          key={action.id}
          onPress={() => onPressAction(action)}
          style={s.button}>
          <Text style={s.buttonText}>{action.label}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  row: {
    gap: 8,
    paddingVertical: 2,
  },
  button: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Brand.green,
    backgroundColor: '#ECF8ED',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '700',
    color: Brand.greenDark,
  },
});

