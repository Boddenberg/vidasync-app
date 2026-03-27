import { describe, expect, it } from 'vitest';

import {
  buildAdminTelemetryMetricsSnapshotOverrides,
  buildAdminTelemetryRunsSnapshotOverrides,
  type AdminTelemetryMetricsPayload,
  type AdminTelemetryRunsPayload,
} from '@/services/admin-telemetry';

describe('buildAdminTelemetryMetricsSnapshotOverrides', () => {
  it('maps telemetry metrics into dashboard overrides', () => {
    const payload: AdminTelemetryMetricsPayload = {
      filters: {
        startDate: '2026-03-20',
        endDate: '2026-03-26',
        days: 7,
        agent: 'chat',
        model: null,
        status: null,
      },
      summary: {
        totalRuns: 12,
        successCount: 10,
        errorCount: 2,
        timeoutCount: 1,
        totalCostUsd: 1.23,
        inputTokens: 1200,
        outputTokens: 340,
        totalTokens: 1540,
        averageDurationMs: 812.4,
        p95DurationMs: 1600,
        latestRunAt: '2026-03-26T18:00:00Z',
        oldestRunAt: '2026-03-20T09:00:00Z',
      },
      daily: [
        {
          dayUtc: '2026-03-26',
          runCount: 3,
          successCount: 2,
          errorCount: 1,
          timeoutCount: 1,
          totalCostUsd: 0.42,
          inputTokens: 500,
          outputTokens: 140,
          totalTokens: 640,
          averageDurationMs: 910,
          p95DurationMs: 1400,
        },
      ],
      byAgent: [
        {
          agent: 'chat',
          runCount: 7,
          successCount: 6,
          errorCount: 1,
          timeoutCount: 0,
          totalCostUsd: 0.88,
          totalTokens: 1200,
          averageDurationMs: 700,
          p95DurationMs: 1200,
        },
      ],
      byModel: [
        {
          model: 'gpt-4.1-mini',
          agent: 'chat',
          llmCallCount: 7,
          totalCostUsd: 0.88,
          inputTokens: 1000,
          outputTokens: 200,
          totalTokens: 1200,
          averageDurationMs: 650,
          p95DurationMs: 980,
        },
      ],
    };

    const snapshot = buildAdminTelemetryMetricsSnapshotOverrides(payload);

    expect(snapshot.source).toBe('backend');
    expect(snapshot.periodLabel).toBe('20/03 a 26/03');
    expect(snapshot.scopeLabel).toBe('Agente chat');
    expect(snapshot.services?.[0]).toMatchObject({
      label: 'Backend',
    });
    expect(snapshot.performanceMetrics?.find((item) => item.id === 'avg-duration')?.value).toBe('812ms');
    expect(snapshot.volumeMetrics?.find((item) => item.id === 'total-runs')?.value).toBe('12');
    expect(snapshot.volumeMetrics?.find((item) => item.id === 'success-rate')?.value).toContain('83');
    expect(snapshot.llmMetrics?.find((item) => item.id === 'total-cost')?.value).toBe('$1.23');
    expect(snapshot.topEndpointsTitle).toBe('Latencia por agente');
    expect(snapshot.topEndpoints?.[0]).toMatchObject({
      label: 'chat',
      volume: '7 execs',
    });
    expect(snapshot.errorEndpointsTitle).toBe('Modelos por custo');
    expect(snapshot.errorEndpoints?.[0]?.label).toBe('gpt-4.1-mini (chat)');
    expect(snapshot.timeline?.[0]).toMatchObject({
      timestampLabel: '26/03',
      title: '3 execucoes no dia',
    });
    expect(snapshot.insights?.some((item) => item.title.includes('Agente dominante'))).toBe(true);
  });

  it('maps telemetry runs into recent run cards and timeline events', () => {
    const payload: AdminTelemetryRunsPayload = {
      filters: {
        startDate: '2026-03-20',
        endDate: '2026-03-26',
        days: 7,
        agent: null,
        model: null,
        status: 'error',
      },
      limit: 2,
      recentRuns: [
        {
          runId: 'run-1',
          requestId: 'req-1',
          traceId: 'trace-1',
          agent: 'chat',
          endpoint: '/chat',
          httpMethod: 'POST',
          httpStatus: 502,
          status: 'error',
          timeout: false,
          durationMs: 800,
          totalCostUsd: 0.12,
          totalTokens: 400,
          llmCallCount: 1,
          toolCallCount: 0,
          stageEventCount: 3,
          errorMessage: 'Bad gateway',
          startedAt: '2026-03-26T18:00:00Z',
          finishedAt: '2026-03-26T18:00:01Z',
          requestContext: {
            path: '/chat',
          },
        },
      ],
    };

    const snapshot = buildAdminTelemetryRunsSnapshotOverrides(payload);

    expect(snapshot.scopeLabel).toBe('Todos os agentes - Status error');
    expect(snapshot.recentRuns?.[0]).toMatchObject({
      runId: 'run-1',
      requestId: 'req-1',
      traceId: 'trace-1',
      agent: 'chat',
      requestPath: '/chat',
      httpMethod: 'POST',
      httpStatusLabel: '502',
      status: 'error',
      statusLabel: 'Erro',
      totalTokens: '400',
      llmCallCount: '1',
    });
    expect(snapshot.timeline?.[0]).toMatchObject({
      title: 'POST /chat',
      description: 'Bad gateway',
      tone: 'critical',
    });
  });
});
