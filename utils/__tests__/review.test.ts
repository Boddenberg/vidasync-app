import { describe, expect, it } from 'vitest';

import type { ReviewSession } from '@/types/review';
import {
  buildReviewDraft,
  buildReviewSubmitPayload,
  mapReviewSubmitErrorMessage,
} from '@/utils/review';

describe('review utils', () => {
  it('builds editable nutrition draft with detected items', () => {
    const session: ReviewSession = {
      kind: 'nutrition',
      source: 'photo',
      createdAt: '2026-03-07T10:00:00.000Z',
      result: {
        nutrition: {
          calories: '300 kcal',
          protein: '20 g',
          carbs: '30 g',
          fat: '10 g',
        },
        ingredients: [
          {
            name: 'frango',
            nutrition: {
              calories: '200 kcal',
              protein: '25 g',
              carbs: '0 g',
              fat: '8 g',
            },
            cached: false,
            precisaRevisao: true,
            warnings: ['estimado por imagem'],
            traceId: 'trace-item-1',
          },
        ],
        corrections: [],
        invalidItems: [],
        precisaRevisao: true,
        warnings: ['validar porcao'],
        traceId: 'trace-main',
        error: null,
      },
    };

    const draft = buildReviewDraft(session);
    expect(draft.kind).toBe('nutrition');
    if (draft.kind !== 'nutrition') return;
    expect(draft.items.length).toBe(1);
    expect(draft.items[0].name).toBe('frango');
  });

  it('builds submit payload for plan review with section edits', () => {
    const session: ReviewSession = {
      kind: 'plan',
      source: 'pdf',
      createdAt: '2026-03-07T10:00:00.000Z',
      result: {
        source: 'plan_pdf',
        fileName: 'plano.pdf',
        extractedText: 'texto original',
        sections: [{ title: 'Cafe', text: 'Iogurte' }],
        warnings: ['coluna ambigua'],
        precisaRevisao: true,
        traceId: 'trace-plan',
        raw: null,
      },
    };

    const draft = buildReviewDraft(session);
    expect(draft.kind).toBe('plan');
    if (draft.kind !== 'plan') return;

    draft.sections[0].text = 'Iogurte + fruta';
    const payload = buildReviewSubmitPayload(session, draft);

    expect(payload.kind).toBe('plan');
    if (payload.kind !== 'plan') return;
    expect(payload.adjustments.sections[0].text).toBe('Iogurte + fruta');
    expect(payload.trace_id).toBe('trace-plan');
  });

  it('maps 404 review endpoint errors to friendly message', () => {
    const message = mapReviewSubmitErrorMessage('Erro 404');
    expect(message).toContain('Endpoint de revisao nao encontrado');
  });
});

