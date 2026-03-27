import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/constants/config', () => ({
  API_BASE_URL: 'http://localhost:8080',
  INTERNAL_ADMIN_API_KEY: '',
  INTERNAL_ADMIN_USER_ID: '',
}));

vi.mock('@/hooks/use-auth', () => ({
  getStoredAccessToken: vi.fn(async () => 'user-access-token'),
  getStoredUserId: vi.fn(async () => '00000000-0000-4000-8000-000000000001'),
  isValidUuid: vi.fn(() => true),
}));

import {
  getAdminTelemetryMetricsSnapshotOverrides,
  getAdminTelemetryRunsSnapshotOverrides,
} from '@/services/admin-telemetry';

const fetchMock = vi.fn();

describe('getAdminTelemetryMetricsSnapshotOverrides without internal admin key', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  it('calls telemetry metrics with the app auth flow when no internal key is configured', async () => {
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
              agent: null,
            },
            summary: {
              totalRuns: 5,
              successCount: 5,
              errorCount: 0,
              timeoutCount: 0,
              totalCostUsd: 0.45,
              inputTokens: 300,
              outputTokens: 100,
              totalTokens: 400,
              averageDurationMs: 500,
              p95DurationMs: 900,
              latestRunAt: '2026-03-26T18:00:00Z',
              oldestRunAt: '2026-03-20T09:00:00Z',
            },
            daily: [],
            byAgent: [],
            byModel: [],
          },
        }),
    });

    const snapshot = await getAdminTelemetryMetricsSnapshotOverrides({ days: 14 });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/internal/admin/telemetry/metrics?days=14');
    expect(options.headers).toMatchObject({
      'X-User-Id': '00000000-0000-4000-8000-000000000001',
      'X-Access-Token': 'user-access-token',
    });
    expect((options.headers as Record<string, string>)['X-Internal-Api-Key']).toBeUndefined();

    expect(snapshot.source).toBe('backend');
    expect(snapshot.volumeMetrics?.find((item) => item.id === 'total-runs')?.value).toBe('5');
  });

  it('calls telemetry runs with the app auth flow when no internal key is configured', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          runs: {
            filters: {
              startDate: '2026-03-20',
              endDate: '2026-03-26',
              days: 7,
              status: 'error',
            },
            limit: 2,
            recentRuns: [
              {
                runId: 'run-1',
                agent: 'chat',
                endpoint: '/chat',
                httpMethod: 'POST',
                httpStatus: 500,
                status: 'error',
                timeout: false,
                durationMs: 1200,
                startedAt: '2026-03-26T18:00:00Z',
                finishedAt: '2026-03-26T18:00:01Z',
                requestContext: {
                  path: '/chat',
                },
              },
            ],
          },
        }),
    });

    const snapshot = await getAdminTelemetryRunsSnapshotOverrides({ limit: 2, status: 'error' });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/internal/admin/telemetry/runs?days=7&limit=2&status=error');
    expect(options.headers).toMatchObject({
      'X-User-Id': '00000000-0000-4000-8000-000000000001',
      'X-Access-Token': 'user-access-token',
    });
    expect((options.headers as Record<string, string>)['X-Internal-Api-Key']).toBeUndefined();

    expect(snapshot.recentRuns?.[0]).toMatchObject({
      runId: 'run-1',
      status: 'error',
      requestPath: '/chat',
    });
  });
});
