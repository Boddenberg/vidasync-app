import { describe, expect, it } from 'vitest';

import {
  buildPlanPdfPayload,
  mapPlanPdfRequestErrorMessage,
  normalizePlanPdfResponse,
} from '@/utils/plan-pdf';

describe('plan pdf utils', () => {
  it('builds canonical payload for pdf fields', () => {
    const payload = buildPlanPdfPayload(
      'data:application/pdf;base64,AAA',
      'application/pdf',
      'plano.pdf',
    );

    expect(payload.pdf).toBe('data:application/pdf;base64,AAA');
    expect(payload.mime_type).toBe('application/pdf');
    expect(payload.file_name).toBe('plano.pdf');
  });

  it('includes canonical URL field when remote link is available', () => {
    const payload = buildPlanPdfPayload(
      null,
      'application/pdf',
      'plano.pdf',
      'https://cdn.example.com/plano.pdf',
    );

    expect(payload.pdf).toBeUndefined();
    expect(payload.pdf_url).toBe('https://cdn.example.com/plano.pdf');
  });

  it('prioritizes file_key over remote URL when both are available', () => {
    const payload = buildPlanPdfPayload(
      null,
      'application/pdf',
      'plano.pdf',
      'https://cdn.example.com/plano.pdf',
      'pdf/abc/plano.pdf',
    );

    expect(payload.file_key).toBe('pdf/abc/plano.pdf');
    expect(payload.pdf_url).toBeUndefined();
  });

  it('normalizes sections, warnings and review flags', () => {
    const result = normalizePlanPdfResponse(
      {
        texto_normalizado: '[Cafe] itens...',
        secoes: [{ titulo: 'Cafe da manha', texto: 'QTD: 1 | ALIMENTO: iogurte' }],
        warnings: ['OCR com baixa nitidez'],
        precisa_revisao: true,
        trace_id: 'trace-abc',
      },
      { fileName: 'plano.pdf', fileSizeBytes: 1024 },
    );

    expect(result.fileName).toBe('plano.pdf');
    expect(result.sections.length).toBe(1);
    expect(result.precisaRevisao).toBe(true);
    expect(result.traceId).toBe('trace-abc');
    expect(result.warnings).toContain('OCR com baixa nitidez');
  });

  it('maps 404 errors to a user-friendly backend message', () => {
    const message = mapPlanPdfRequestErrorMessage('Erro 404');
    expect(message).toContain('Endpoint de PDF nao encontrado');
  });
});
