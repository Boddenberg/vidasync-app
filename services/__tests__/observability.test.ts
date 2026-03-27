import { describe, expect, it } from 'vitest';

import { buildDeveloperObservabilitySnapshot } from '@/services/observability';
import type { NetworkInspectorLog } from '@/services/network-inspector';

function createLog(overrides: Partial<NetworkInspectorLog>): NetworkInspectorLog {
  return {
    id: overrides.id ?? 'log-1',
    timestamp: overrides.timestamp ?? '2026-03-20T12:00:00.000Z',
    method: overrides.method ?? 'GET',
    url: overrides.url ?? 'https://vidasync-bff-production.up.railway.app/health',
    requestHeaders: overrides.requestHeaders ?? {},
    requestBody: overrides.requestBody ?? null,
    requestBodyTruncated: overrides.requestBodyTruncated ?? false,
    statusCode: overrides.statusCode ?? 200,
    ok: overrides.ok ?? true,
    durationMs: overrides.durationMs ?? 320,
    responseHeaders: overrides.responseHeaders ?? {},
    responseBody: overrides.responseBody ?? null,
    responseBodyTruncated: overrides.responseBodyTruncated ?? false,
    error: overrides.error ?? null,
  };
}

describe('buildDeveloperObservabilitySnapshot', () => {
  it('aggregates request, latency and quality metrics from local logs', () => {
    const logs: NetworkInspectorLog[] = [
      createLog({
        id: 'metrics-1',
        url: 'https://vidasync-bff-production.up.railway.app/metrics/overview',
        durationMs: 90,
      }),
      createLog({
        id: 'telemetry-runs',
        url: 'https://vidasync-bff-production.up.railway.app/internal/admin/telemetry/runs?limit=5',
        durationMs: 70,
      }),
      createLog({
        id: 'judge-metrics',
        url: 'https://vidasync-bff-production.up.railway.app/internal/admin/llm-judge/metrics?days=7',
        durationMs: 65,
      }),
      createLog({
        id: 'bff-1',
        url: 'https://vidasync-bff-production.up.railway.app/meals/summary?date=2026-03-20',
        durationMs: 180,
        responseHeaders: { 'x-db-duration-ms': '32' },
      }),
      createLog({
        id: 'ai-1',
        method: 'POST',
        url: 'https://vidasync-bff-production.up.railway.app/nutrition/calories',
        durationMs: 1450,
        responseHeaders: {
          'x-openai-total-tokens': '840',
          'x-estimated-cost-usd': '0.17',
        },
        responseBody: JSON.stringify({
          judge_score: 0.91,
          coherence: 0.95,
          correctness: 0.88,
        }),
      }),
      createLog({
        id: 'ai-2',
        method: 'POST',
        url: 'https://vidasync-bff-production.up.railway.app/review/confirm',
        durationMs: 2380,
        statusCode: 502,
        ok: false,
        error: 'Bad Gateway',
        responseHeaders: {
          'x-openai-total-tokens': '1200',
        },
        responseBody: JSON.stringify({
          judge_score: 0.54,
          safety: 0.4,
        }),
      }),
    ];

    const snapshot = buildDeveloperObservabilitySnapshot(logs);

    expect(snapshot.volumeMetrics.find((item) => item.id === 'total-requests')?.value).toBe('3');
    expect(snapshot.volumeMetrics.find((item) => item.id === 'error-rate')?.value).toContain('33');
    expect(snapshot.llmMetrics.find((item) => item.id === 'total-tokens')?.value).toBe('2.0k');
    expect(snapshot.judgeMetrics.find((item) => item.id === 'judge-total')?.value).toBe('--');
    expect(snapshot.qualityMetrics.find((item) => item.id === 'rejected-count')?.value).toBe('1');
    expect(snapshot.topEndpoints[0]?.label).toBe('/review/confirm');
    expect(snapshot.insights.some((item) => item.title.includes('erro'))).toBe(true);
    expect(snapshot.recentRuns).toEqual([]);
  });
});
