import { describe, expect, it } from 'vitest';

import {
  buildObservabilityExecutiveSummary,
  type ObservabilityExecutiveSummary,
} from '@/services/observability-summary';
import type { DeveloperObservabilitySnapshot } from '@/types/observability';

function createSnapshot(
  overrides: Partial<DeveloperObservabilitySnapshot> = {},
): DeveloperObservabilitySnapshot {
  return {
    generatedAt: '2026-04-09T10:00:00.000Z',
    generatedAtLabel: '09/04 07:00',
    source: 'backend',
    periodLabel: 'Ultimos 7 dias',
    scopeLabel: 'Agente chat',
    services: [
      {
        id: 'frontend',
        label: 'Frontend',
        status: 'healthy',
        summary: 'Capturando eventos',
        detail: 'Dados locais ativos.',
      },
      {
        id: 'bff',
        label: 'BFF',
        status: 'healthy',
        summary: 'Sem gargalos relevantes',
        detail: 'Erro baixo e latencia normal.',
      },
      {
        id: 'llm',
        label: 'IA / Agent',
        status: 'healthy',
        summary: 'Executando dentro do esperado',
        detail: 'Sem alertas no recorte atual.',
      },
    ],
    performanceMetrics: [
      {
        id: 'avg-duration',
        label: 'Latencia media',
        value: '820ms',
        hint: 'Media consolidada.',
        tone: 'positive',
      },
      {
        id: 'p95-duration',
        label: 'P95',
        value: '1.40s',
        hint: 'P95 consolidado.',
        tone: 'positive',
      },
      {
        id: 'timeout-count',
        label: 'Timeouts',
        value: '0',
        hint: 'Sem timeouts.',
        tone: 'positive',
      },
      {
        id: 'latest-run',
        label: 'Ultima execucao',
        value: '09/04 06:58',
        hint: 'Atualizado recentemente.',
        tone: 'neutral',
      },
    ],
    volumeMetrics: [
      {
        id: 'total-runs',
        label: 'Total de runs',
        value: '12',
        hint: 'Volume consolidado.',
        tone: 'positive',
      },
      {
        id: 'error-rate',
        label: 'Taxa de erro',
        value: '2.0%',
        hint: 'Erro agregado.',
        tone: 'positive',
      },
      {
        id: 'error-count',
        label: 'Erros',
        value: '0',
        hint: 'Nenhum erro.',
        tone: 'positive',
      },
      {
        id: 'active-days',
        label: 'Dias ativos',
        value: '4',
        hint: 'Dias com execucao.',
        tone: 'positive',
      },
    ],
    llmMetrics: [
      {
        id: 'total-tokens',
        label: 'Tokens totais',
        value: '2.4k',
        hint: 'Tokens totais.',
        tone: 'neutral',
      },
    ],
    judgeMetrics: [
      {
        id: 'judge-total',
        label: 'Avaliacoes',
        value: '8',
        hint: 'Total do judge.',
        tone: 'positive',
      },
      {
        id: 'judge-pending',
        label: 'Pendentes',
        value: '0',
        hint: 'Sem pendencias.',
        tone: 'positive',
      },
      {
        id: 'judge-failed',
        label: 'Falhas',
        value: '0',
        hint: 'Sem falhas.',
        tone: 'positive',
      },
      {
        id: 'judge-latency',
        label: 'Tempo medio',
        value: '920ms',
        hint: 'Judge dentro do esperado.',
        tone: 'positive',
      },
    ],
    qualityMetrics: [
      {
        id: 'overall-score',
        label: 'Score geral',
        value: '91.0%',
        hint: 'Qualidade boa.',
        tone: 'positive',
      },
      {
        id: 'approval-rate',
        label: 'Taxa de aprovacao',
        value: '88.0%',
        hint: 'Aprovacao boa.',
        tone: 'positive',
      },
      {
        id: 'approved-count',
        label: 'Aprovado',
        value: '7',
        hint: 'Aprovadas.',
        tone: 'positive',
      },
      {
        id: 'rejected-count',
        label: 'Reprovado',
        value: '1',
        hint: 'Reprovadas.',
        tone: 'warning',
      },
    ],
    qualityCriteria: [
      {
        id: 'correctness',
        label: 'Correcao',
        value: '92.0%',
        classification: 'approved',
      },
    ],
    insights: [],
    topEndpointsTitle: 'Latencia por agente',
    topEndpoints: [
      {
        id: 'chat',
        label: 'chat',
        avgLatency: '780ms',
        p95Latency: '1.40s',
        volume: '12 execs',
        errors: '0 erros',
      },
    ],
    errorEndpointsTitle: 'Modelos por custo',
    errorEndpoints: [
      {
        id: 'gpt',
        label: 'gpt-4.1-mini',
        avgLatency: '780ms',
        p95Latency: '1.40s',
        volume: '24 calls',
        errors: '$1.20 - 2.4k tok',
      },
    ],
    timeline: [],
    judgeEvaluations: [],
    recentRuns: [],
    ...overrides,
  };
}

function findAction(summary: ObservabilityExecutiveSummary, id: string) {
  return summary.recommendedActions.find((item) => item.id === id);
}

describe('buildObservabilityExecutiveSummary', () => {
  it('prioritizes failures when error rate and latency are critical', () => {
    const summary = buildObservabilityExecutiveSummary(
      createSnapshot({
        services: [
          {
            id: 'bff',
            label: 'BFF',
            status: 'critical',
            summary: 'Instavel',
            detail: 'Erro e latencia acima do aceitavel.',
          },
        ],
        performanceMetrics: [
          {
            id: 'avg-duration',
            label: 'Latencia media',
            value: '2.20s',
            hint: 'Media alta.',
            tone: 'warning',
          },
          {
            id: 'p95-duration',
            label: 'P95',
            value: '4.80s',
            hint: 'P95 muito alto.',
            tone: 'critical',
          },
          {
            id: 'timeout-count',
            label: 'Timeouts',
            value: '4',
            hint: 'Timeouts detectados.',
            tone: 'critical',
          },
          {
            id: 'latest-run',
            label: 'Ultima execucao',
            value: '09/04 06:58',
            hint: 'Atualizado recentemente.',
            tone: 'neutral',
          },
        ],
        volumeMetrics: [
          {
            id: 'total-runs',
            label: 'Total de runs',
            value: '23',
            hint: 'Volume alto.',
            tone: 'positive',
          },
          {
            id: 'error-rate',
            label: 'Taxa de erro',
            value: '18.0%',
            hint: 'Erro agregado alto.',
            tone: 'critical',
          },
          {
            id: 'error-count',
            label: 'Erros',
            value: '4',
            hint: 'Erros detectados.',
            tone: 'critical',
          },
          {
            id: 'active-days',
            label: 'Dias ativos',
            value: '7',
            hint: 'Dias com execucao.',
            tone: 'positive',
          },
        ],
        topEndpoints: [
          {
            id: 'chat',
            label: '/chat',
            avgLatency: '2.20s',
            p95Latency: '4.80s',
            volume: '23 execs',
            errors: '4 erros',
          },
        ],
        errorEndpoints: [
          {
            id: 'chat',
            label: '/chat',
            avgLatency: '2.20s',
            p95Latency: '4.80s',
            volume: '23 execs',
            errors: '4 erros',
          },
        ],
      }),
    );

    expect(summary.overallStatus).toBe('critical');
    expect(summary.primaryFinding?.tab).toBe('failures');
    expect(summary.headline).toContain('critica');
    expect(summary.suspectedCause).toContain('/chat');
    expect(findAction(summary, 'open-failures')?.tab).toBe('failures');
    expect(findAction(summary, 'open-investigation')?.tab).toBe('investigation');
    expect(summary.topFindings.some((item) => item.id === 'errors' && item.target.telemetry?.status === 'error')).toBe(
      true,
    );
  });

  it('prioritizes quality when judge and approval rate are degraded', () => {
    const summary = buildObservabilityExecutiveSummary(
      createSnapshot({
        qualityMetrics: [
          {
            id: 'overall-score',
            label: 'Score geral',
            value: '62.0%',
            hint: 'Score baixo.',
            tone: 'warning',
          },
          {
            id: 'approval-rate',
            label: 'Taxa de aprovacao',
            value: '54.0%',
            hint: 'Aprovacao baixa.',
            tone: 'critical',
          },
          {
            id: 'approved-count',
            label: 'Aprovado',
            value: '4',
            hint: 'Aprovadas.',
            tone: 'neutral',
          },
          {
            id: 'rejected-count',
            label: 'Reprovado',
            value: '5',
            hint: 'Reprovadas.',
            tone: 'critical',
          },
        ],
        judgeMetrics: [
          {
            id: 'judge-total',
            label: 'Avaliacoes',
            value: '9',
            hint: 'Total do judge.',
            tone: 'positive',
          },
          {
            id: 'judge-pending',
            label: 'Pendentes',
            value: '1',
            hint: 'Pendencias.',
            tone: 'warning',
          },
          {
            id: 'judge-failed',
            label: 'Falhas',
            value: '2',
            hint: 'Falhas do judge.',
            tone: 'critical',
          },
          {
            id: 'judge-latency',
            label: 'Tempo medio',
            value: '1.20s',
            hint: 'Judge um pouco alto.',
            tone: 'warning',
          },
        ],
        judgeEvaluations: [
          {
            id: 'judge-1',
            createdAt: '2026-04-09T10:00:00.000Z',
            createdAtLabel: '09/04 07:00',
            updatedAtLabel: '09/04 07:01',
            feature: 'chat',
            status: 'completed',
            statusLabel: 'Concluido',
            decision: 'rejected',
            decisionLabel: 'Reprovado',
            tone: 'critical',
            score: '41.0%',
            summary: 'Resposta sem fidelidade suficiente.',
            pipeline: 'chat',
            handler: 'default',
            requestId: 'req-1',
            conversationId: '--',
            messageId: '--',
            userId: '--',
            sourceModel: 'gpt-4.1-mini',
            judgeModel: 'gpt-4.1-mini',
            sourceDuration: '780ms',
            judgeDuration: '1.10s',
            improvements: [],
            rejectionReasons: ['Fidelidade'],
            error: null,
          },
        ],
      }),
    );

    expect(summary.overallStatus).toBe('critical');
    expect(summary.primaryFinding?.tab).toBe('quality');
    expect(summary.headline).toContain('Qualidade');
    expect(summary.suspectedCause).toContain('Fidelidade');
    expect(findAction(summary, 'open-quality')?.tab).toBe('quality');
    expect(findAction(summary, 'open-quality')?.target.quality?.decision).toBe('rejected');
  });

  it('marks data quality as incomplete when only local fallback is available', () => {
    const summary = buildObservabilityExecutiveSummary(
      createSnapshot({
        source: 'fallback',
        services: [
          {
            id: 'frontend',
            label: 'Frontend',
            status: 'unknown',
            summary: 'Sem trafego',
            detail: 'Nenhuma chamada registrada.',
          },
        ],
        performanceMetrics: [
          {
            id: 'avg-duration',
            label: 'Latencia media',
            value: '--',
            hint: 'Sem dados.',
            tone: 'neutral',
          },
          {
            id: 'p95-duration',
            label: 'P95',
            value: '--',
            hint: 'Sem dados.',
            tone: 'neutral',
          },
          {
            id: 'timeout-count',
            label: 'Timeouts',
            value: '0',
            hint: 'Sem dados.',
            tone: 'neutral',
          },
          {
            id: 'latest-run',
            label: 'Ultima execucao',
            value: '--',
            hint: 'Sem dados.',
            tone: 'neutral',
          },
        ],
        volumeMetrics: [
          {
            id: 'total-requests',
            label: 'Total de requests',
            value: '0',
            hint: 'Sem trafego.',
            tone: 'neutral',
          },
          {
            id: 'error-rate',
            label: 'Taxa de erro',
            value: '--',
            hint: 'Sem requests.',
            tone: 'neutral',
          },
          {
            id: 'failed-requests',
            label: 'Falhas',
            value: '0',
            hint: 'Sem requests.',
            tone: 'neutral',
          },
          {
            id: 'active-endpoints',
            label: 'Endpoints ativos',
            value: '0',
            hint: 'Sem requests.',
            tone: 'neutral',
          },
        ],
        judgeMetrics: [
          {
            id: 'judge-total',
            label: 'Avaliacoes',
            value: '--',
            hint: 'Sem remoto.',
            tone: 'neutral',
          },
        ],
        qualityMetrics: [
          {
            id: 'overall-score',
            label: 'Score geral',
            value: '--',
            hint: 'Sem remoto.',
            tone: 'neutral',
          },
          {
            id: 'approval-rate',
            label: 'Taxa de aprovacao',
            value: '--',
            hint: 'Sem remoto.',
            tone: 'neutral',
          },
        ],
        topEndpoints: [
          {
            id: 'empty',
            label: 'Sem endpoints no recorte',
            avgLatency: '--',
            p95Latency: '--',
            volume: '0',
            errors: '--',
          },
        ],
        errorEndpoints: [
          {
            id: 'empty',
            label: 'Sem endpoints no recorte',
            avgLatency: '--',
            p95Latency: '--',
            volume: '0',
            errors: '--',
          },
        ],
      }),
    );

    expect(summary.overallStatus).toBe('unknown');
    expect(summary.headline.toLowerCase()).toContain('sem trafego');
    expect(summary.dataQuality.title).toContain('Sem trafego');
    expect(summary.primaryFinding?.tab).toBe('overview');
  });
});
