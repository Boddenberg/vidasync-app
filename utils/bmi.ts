export type BmiCategory =
  | 'abaixo_do_peso'
  | 'peso_adequado'
  | 'sobrepeso'
  | 'obesidade';

export type BmiInterpretation = {
  category: BmiCategory;
  label: string;
  range: string;
  supportMessage: string;
};

export type BmiComputation = {
  bmi: number;
  interpretation: BmiInterpretation;
};

/*
 * Converte texto numerico do input para numero decimal.
 *
 * Aceita virgula e ponto como separador decimal para manter UX amigavel.
 */
export function parseMetricInput(input: string): number | null {
  const normalized = input.replace(',', '.').trim();
  if (!normalized) return null;
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

export function classifyBmi(bmi: number): BmiInterpretation {
  if (bmi < 18.5) {
    return {
      category: 'abaixo_do_peso',
      label: 'Abaixo do peso',
      range: '< 18,5',
      supportMessage:
        'Seu IMC esta abaixo da faixa adequada. Vale revisar a alimentacao com acompanhamento profissional.',
    };
  }

  if (bmi < 25) {
    return {
      category: 'peso_adequado',
      label: 'Peso adequado',
      range: '18,5 a 24,9',
      supportMessage:
        'Seu IMC esta na faixa considerada adequada. Continue com habitos consistentes.',
    };
  }

  if (bmi < 30) {
    return {
      category: 'sobrepeso',
      label: 'Sobrepeso',
      range: '25,0 a 29,9',
      supportMessage:
        'Seu IMC esta acima da faixa adequada. Pequenos ajustes de rotina podem ajudar muito.',
    };
  }

  return {
    category: 'obesidade',
    label: 'Obesidade',
    range: '>= 30,0',
    supportMessage:
      'Seu IMC indica risco aumentado. Procure acompanhamento profissional para um plano seguro.',
  };
}

/*
 * Calcula IMC com base em peso (kg) e altura (cm).
 *
 * Formula: peso / (altura_em_metros ^ 2)
 */
export function computeBmi(weightKg: number, heightCm: number): BmiComputation {
  const heightMeters = heightCm / 100;
  const rawBmi = weightKg / (heightMeters * heightMeters);
  const bmi = Number(rawBmi.toFixed(1));

  return {
    bmi,
    interpretation: classifyBmi(bmi),
  };
}

