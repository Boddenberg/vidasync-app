import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/constants/config', () => ({
  INTERNAL_ADMIN_API_KEY: '',
  INTERNAL_ADMIN_USER_ID: '',
  SUPABASE_URL: 'https://demo-project.supabase.co',
  SUPABASE_ANON_KEY: 'anon-key',
  SUPABASE_JUDGE_TABLE: 'llm_judge_evaluations',
  SUPABASE_JUDGE_FEATURE: '',
  SUPABASE_JUDGE_LIMIT: 50,
}));

vi.mock('@/hooks/use-auth', () => ({
  getStoredAccessToken: vi.fn(async () => 'user-access-token'),
}));

import { getDeveloperJudgeSnapshotOverrides } from '@/services/observability-judge';

const fetchMock = vi.fn();

describe('getDeveloperJudgeSnapshotOverrides', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  it('maps Supabase judge rows into developer metrics and evaluations', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [
        {
          evaluation_id: 'eval-1',
          created_at: '2026-03-26T16:00:00.000Z',
          updated_at: '2026-03-26T16:00:03.000Z',
          feature: 'chat',
          judge_status: 'completed',
          request_id: 'req-1',
          conversation_id: 'conv-1',
          message_id: 'msg-1',
          user_id: 'user-1',
          source_model: 'gpt-4o-mini',
          pipeline: 'resposta_conversacional_geral',
          handler: 'handler_responder_conversa_geral',
          judge_model: 'gpt-5.4-mini',
          source_duration_ms: 820,
          judge_duration_ms: 1400,
          judge_overall_score: 0.91,
          judge_decision: 'approved',
          judge_summary: 'Resposta correta e objetiva.',
          judge_scores: {
            coherence: 0.95,
            correctness: 0.89,
            safety: 0.93,
          },
          judge_improvements: ['Adicionar referencia nutricional.'],
          judge_rejection_reasons: [],
          judge_error: null,
        },
        {
          evaluation_id: 'eval-2',
          created_at: '2026-03-26T15:59:00.000Z',
          updated_at: '2026-03-26T15:59:01.000Z',
          feature: 'chat',
          judge_status: 'pending',
          request_id: 'req-2',
          message_id: 'msg-2',
          judge_summary: null,
          judge_improvements: [],
          judge_rejection_reasons: [],
        },
        {
          evaluation_id: 'eval-3',
          created_at: '2026-03-26T15:58:00.000Z',
          updated_at: '2026-03-26T15:58:05.000Z',
          feature: 'chat',
          judge_status: 'failed',
          request_id: 'req-3',
          message_id: 'msg-3',
          judge_error: 'Timeout no processamento do judge.',
          judge_rejection_reasons: ['Timeout interno.'],
        },
      ],
    });

    const snapshot = await getDeveloperJudgeSnapshotOverrides();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('https://demo-project.supabase.co/rest/v1/llm_judge_evaluations');
    expect(url).not.toContain('feature=');
    expect(url).toContain('order=created_at.desc');
    expect(url).toContain('limit=50');
    expect(options.headers).toMatchObject({
      apikey: 'anon-key',
      Authorization: 'Bearer user-access-token',
      Accept: 'application/json',
    });

    expect(snapshot?.judgeMetrics?.find((item) => item.id === 'judge-total')?.value).toBe('3');
    expect(snapshot?.judgeMetrics?.find((item) => item.id === 'judge-pending')?.value).toBe('1');
    expect(snapshot?.judgeMetrics?.find((item) => item.id === 'judge-failed')?.value).toBe('1');
    expect(snapshot?.qualityMetrics?.find((item) => item.id === 'overall-score')?.value).toContain('91');
    expect(snapshot?.qualityMetrics?.find((item) => item.id === 'approval-rate')?.value).toContain('100');
    expect(snapshot?.qualityCriteria?.find((item) => item.id === 'coherence')?.value).toContain('95');
    expect(snapshot?.judgeEvaluations).toHaveLength(3);
    expect(snapshot?.judgeEvaluations?.[0]).toMatchObject({
      id: 'eval-1',
      status: 'completed',
      decision: 'approved',
      sourceModel: 'gpt-4o-mini',
      judgeModel: 'gpt-5.4-mini',
    });
    expect(snapshot?.judgeEvaluations?.[0]?.improvements).toContain('Adicionar referencia nutricional.');
    expect(snapshot?.judgeEvaluations?.[1]).toMatchObject({
      id: 'eval-2',
      status: 'pending',
      decision: 'unknown',
    });
    expect(snapshot?.judgeEvaluations?.[2]).toMatchObject({
      id: 'eval-3',
      status: 'failed',
      decision: 'unknown',
      error: 'Timeout no processamento do judge.',
    });
  });
});
