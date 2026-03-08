import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { BmiCalculatorCard } from '@/components/health/bmi-calculator-card';
import { Brand } from '@/constants/theme';

/*
 * Tela dedicada de IMC para uso como acao rapida no chat.
 *
 * Mantem o mesmo componente do Home para evitar divergencia de UX.
 */
export default function BmiToolScreen() {
  const router = useRouter();

  return (
    <View style={s.root}>
      <ScrollView contentContainerStyle={s.scroll}>
        <BmiCalculatorCard
          title="Calculadora de IMC"
          subtitle="Ferramenta rapida para estimativa inicial. Nao substitui avaliacao profissional."
          compact
        />
      </ScrollView>

      <View style={s.footer}>
        <AppButton title="Voltar" onPress={() => router.back()} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Brand.bg,
  },
  scroll: {
    padding: 20,
    paddingBottom: 110,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Brand.bg,
    borderTopWidth: 1,
    borderTopColor: Brand.border,
  },
});

