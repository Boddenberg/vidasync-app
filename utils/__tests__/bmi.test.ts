import { describe, expect, it } from 'vitest';

import { classifyBmi, computeBmi, parseMetricInput } from '@/utils/bmi';

describe('bmi utils', () => {
  it('parses metric values with comma separator', () => {
    expect(parseMetricInput('72,5')).toBe(72.5);
    expect(parseMetricInput('')).toBeNull();
    expect(parseMetricInput('-1')).toBeNull();
  });

  it('computes bmi with deterministic formula', () => {
    const result = computeBmi(72, 175);
    expect(result.bmi).toBe(23.5);
    expect(result.interpretation.category).toBe('peso_adequado');
  });

  it('classifies bmi ranges correctly', () => {
    expect(classifyBmi(17.9).category).toBe('abaixo_do_peso');
    expect(classifyBmi(24.9).category).toBe('peso_adequado');
    expect(classifyBmi(29.9).category).toBe('sobrepeso');
    expect(classifyBmi(30.1).category).toBe('obesidade');
  });
});

