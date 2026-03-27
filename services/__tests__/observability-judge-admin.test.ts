import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/constants/config', () => ({
  API_BASE_URL: 'http://localhost:8080',
  INTERNAL_ADMIN_API_KEY: 'secret-key',
  INTERNAL_ADMIN_JUDGE_FEATURE: 'nutrition',
  INTERNAL_ADMIN_USER_ID: 'admin-1',
  SUPABASE_URL: '',
  SUPABASE_ANON_KEY: '',
  SUPABASE_JUDGE_TABLE: 'llm_judge_evaluations',
  SUPABASE_JUDGE_FEATURE: 'chat',
  SUPABASE_JUDGE_LIMIT: 50,
}));

vi.mock('@/hooks/use-auth', () => ({
  getStoredAccessToken: vi.fn(async () => null),
  getStoredUserId: vi.fn(async () => '00000000-0000-4000-8000-000000000001'),
  isValidUuid: vi.fn(() => true),
}));

import { getDeveloperJudgeSnapshotOverrides } from '@/services/observability-judge';

const fetchMock = vi.fn();

describe('getDeveloperJudgeSnapshotOverrides with internal admin metrics', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  it('maps the internal judge metrics endpoint into dashboard metrics', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          metrics: {
            filters: {
              startDate: '2026-03-20',
              endDate: '2026-03-26',
              days: 7,
              feature: 'nutrition',
            },
            summary: {
              totalEvaluations: 12,
              completedCount: 10,
              pendingCount: 1,
              failedCount: 1,
              approvedCount: 8,
              rejectedCount: 2,
              completionRatePercent: 83.33,
              failureRatePercent: 8.33,
              approvalRatePercent: 80.0,
              averageOverallScore: 0.91,
              averageSourceDurationMs: 1320.4,
              averageJudgeDurationMs: 210.5,
              averageSourceTotalTokens: 512,
              averageJudgeTotalTokens: 140,
              latestEvaluationAt: '2026-03-26T18:00:00Z',
              oldestEvaluationAt: '2026-03-20T09:00:00Z',
            },
            recentEvaluations: [
              {
                evaluationId: 'eval-1',
                createdAt: '2026-03-26T18:00:00Z',
                feature: 'nutrition',
                judgeStatus: 'completed',
                judgeDecision: 'approved',
                judgeOverallScore: 0.98,
                idioma: 'pt-BR',
                pipeline: 'image',
                handler: 'calories',
                sourceModel: 'gpt-4.1-mini',
                sourceDurationMs: 1200,
                judgeDurationMs: 180,
                sourceTotalTokens: 480,
                judgeTotalTokens: 120,
              },
            ],
          },
        }),
    });

    const snapshot = await getDeveloperJudgeSnapshotOverrides();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/internal/admin/llm-judge/metrics?days=7&feature=nutrition');
    expect(options.headers).toMatchObject({
      'X-Internal-Api-Key': 'secret-key',
      'X-User-Id': 'admin-1',
    });

    expect(snapshot?.judgeMetrics?.find((item) => item.id === 'judge-total')?.value).toBe('12');
    expect(snapshot?.judgeMetrics?.find((item) => item.id === 'judge-pending')?.value).toBe('1');
    expect(snapshot?.judgeMetrics?.find((item) => item.id === 'judge-failed')?.value).toBe('1');
    expect(snapshot?.qualityMetrics?.find((item) => item.id === 'overall-score')?.value).toContain('91');
    expect(snapshot?.qualityMetrics?.find((item) => item.id === 'approval-rate')?.value).toContain('80');
    expect(snapshot?.judgeEvaluations?.[0]).toMatchObject({
      id: 'eval-1',
      feature: 'nutrition',
      status: 'completed',
      decision: 'approved',
      sourceModel: 'gpt-4.1-mini',
      pipeline: 'image - pt-BR',
      handler: 'calories',
    });
  });
});
