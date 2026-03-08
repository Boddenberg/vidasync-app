import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { AppInput } from '@/components/app-input';
import { Brand } from '@/constants/theme';
import type { BmiComputation } from '@/utils/bmi';
import { computeBmi, parseMetricInput } from '@/utils/bmi';

type Props = {
  title?: string;
  subtitle?: string;
  compact?: boolean;
  onOpenAsQuickAction?: () => void;
};

/*
 * Componente reutilizavel de calculadora de IMC.
 *
 * Mantem regra deterministica no utilitario (`utils/bmi.ts`) e concentra
 * aqui apenas estado de formulario e apresentacao para reaproveitar no Home
 * e futuramente no chat como acao rapida.
 */
export function BmiCalculatorCard({
  title = 'Calculadora de IMC',
  subtitle = 'Informe peso e altura para obter o indice e a faixa interpretativa.',
  compact = false,
  onOpenAsQuickAction,
}: Props) {
  const [weightInput, setWeightInput] = useState('');
  const [heightInput, setHeightInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BmiComputation | null>(null);

  const hasInput = useMemo(
    () => weightInput.trim().length > 0 || heightInput.trim().length > 0,
    [heightInput, weightInput],
  );

  function handleCalculate() {
    const weight = parseMetricInput(weightInput);
    const height = parseMetricInput(heightInput);

    if (!weight || !height) {
      setError('Informe peso e altura validos para calcular o IMC.');
      setResult(null);
      return;
    }

    if (height < 100 || height > 250) {
      setError('A altura deve estar em centimetros (ex.: 170).');
      setResult(null);
      return;
    }

    if (weight < 20 || weight > 400) {
      setError('O peso informado parece fora do intervalo esperado.');
      setResult(null);
      return;
    }

    setError(null);
    setResult(computeBmi(weight, height));
  }

  function clearForm() {
    setWeightInput('');
    setHeightInput('');
    setError(null);
    setResult(null);
  }

  return (
    <View style={s.wrapper}>
      <Text style={s.title}>{title}</Text>
      <Text style={s.subtitle}>{subtitle}</Text>

      <View style={s.inputRow}>
        <View style={s.inputCol}>
          <Text style={s.inputLabel}>Peso (kg)</Text>
          <AppInput
            value={weightInput}
            onChangeText={(value) => setWeightInput(value.replace(/[^0-9.,]/g, ''))}
            keyboardType="numeric"
            placeholder="72,5"
            maxLength={6}
          />
        </View>

        <View style={s.inputCol}>
          <Text style={s.inputLabel}>Altura (cm)</Text>
          <AppInput
            value={heightInput}
            onChangeText={(value) => setHeightInput(value.replace(/[^0-9.,]/g, ''))}
            keyboardType="numeric"
            placeholder="175"
            maxLength={6}
          />
        </View>
      </View>

      <AppButton title="Calcular IMC" onPress={handleCalculate} />

      {error ? (
        <View style={s.errorBox}>
          <Text style={s.errorText}>{error}</Text>
        </View>
      ) : null}

      {result ? (
        <View style={s.resultBox}>
          <Text style={s.resultValue}>IMC {result.bmi.toFixed(1)}</Text>
          <Text style={s.resultRange}>
            {result.interpretation.label} ({result.interpretation.range})
          </Text>
          <Text style={s.resultMessage}>{result.interpretation.supportMessage}</Text>
        </View>
      ) : null}

      <View style={s.footerRow}>
        {hasInput ? (
          <Pressable onPress={clearForm} style={s.clearButton}>
            <Text style={s.clearButtonText}>Limpar</Text>
          </Pressable>
        ) : (
          <View />
        )}

        {!compact && onOpenAsQuickAction ? (
          <Pressable onPress={onOpenAsQuickAction} style={s.quickActionButton}>
            <Text style={s.quickActionButtonText}>Abrir em acao rapida</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: {
    gap: 10,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: Brand.text,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  subtitle: {
    fontSize: 12,
    color: Brand.textSecondary,
    marginTop: -4,
    lineHeight: 18,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  inputCol: {
    flex: 1,
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Brand.textSecondary,
  },
  errorBox: {
    backgroundColor: '#FFF0F0',
    borderRadius: 12,
    padding: 12,
  },
  errorText: {
    fontSize: 13,
    color: Brand.danger,
  },
  resultBox: {
    backgroundColor: Brand.bg,
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  resultValue: {
    fontSize: 22,
    fontWeight: '700',
    color: Brand.greenDark,
  },
  resultRange: {
    fontSize: 13,
    fontWeight: '700',
    color: Brand.text,
  },
  resultMessage: {
    fontSize: 12,
    color: Brand.textSecondary,
    lineHeight: 18,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  clearButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  clearButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: Brand.textSecondary,
  },
  quickActionButton: {
    borderRadius: 8,
    backgroundColor: '#ECF8ED',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  quickActionButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: Brand.greenDark,
  },
});

