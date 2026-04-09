import { SUPABASE_JUDGE_TABLE, SUPABASE_URL } from '@/constants/config';
import {
  getAdminTelemetryMetricsSnapshotOverrides,
  getAdminTelemetryRunsSnapshotOverrides,
  type AdminTelemetryMetricsQuery,
} from '@/services/admin-telemetry';
import {
  getDeveloperJudgeSnapshotOverrides,
  type DeveloperJudgeSnapshotQuery,
} from '@/services/observability-judge';
import type { NetworkInspectorLog } from '@/services/network-inspector';
import type {
  DeveloperObservabilitySnapshot,
  DeveloperObservabilitySnapshotOverrides,
  ObservabilityClassification,
  ObservabilityEndpointRow,
  ObservabilityInsight,
  ObservabilityMetric,
  ObservabilityService,
  ObservabilityServiceStatus,
  ObservabilityTone,
} from '@/types/observability';

type EndpointAccumulator = {
  label: string;
  count: number;
  errorCount: number;
  latenciesMs: number[];
};

type QualityAccumulator = {
  sum: number;
  count: number;
};

export type DeveloperObservabilityQuery = AdminTelemetryMetricsQuery & DeveloperJudgeSnapshotQuery;

const OBSERVABILITY_INTERNAL_PATHS = [
  '/internal/admin/telemetry/metrics',
  '/internal/admin/telemetry/runs',
  '/internal/admin/llm-judge/metrics',
  '/metrics/overview',
  '/metrics/performance',
  '/metrics/llm',
  '/metrics/quality',
  '/metrics/insights',
] as const;

const QUALITY_CRITERIA = [
  { id: 'coherence', label: 'Coerencia' },
  { id: 'contextRelevance', label: 'Contexto' },
  { id: 'correctness', label: 'Correcao' },
  { id: 'efficiency', label: 'Eficiencia' },
  { id: 'faithfulness', label: 'Fidelidade' },
  { id: 'quality', label: 'Qualidade' },
  { id: 'usefulness', label: 'Utilidade' },
  { id: 'safety', label: 'Seguranca' },
  { id: 'tone', label: 'Tom de voz' },
] as const;

function normalizeKey(value: string): string {
  return value.replace(/[^a-z0-9]+/gi, '').toLowerCase();
}

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Agora';
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '--';
  if (value < 1000) return `${Math.round(value)}ms`;
  return `${(value / 1000).toFixed(value >= 10000 ? 0 : 2)}s`;
}

function formatPercent(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '--';
  const normalized = value <= 1 ? value * 100 : value;
  return `${normalized.toFixed(normalized >= 10 ? 1 : 2)}%`;
}

function formatCompactNumber(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '--';
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
  return `${Math.round(value)}`;
}

function formatCurrency(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '--';
  return `$${value.toFixed(value >= 10 ? 1 : 2)}`;
}

function normalizeScore(value: number | null | undefined): number | null {
  if (value == null || Number.isNaN(value)) return null;
  if (value > 1 && value <= 100) return value / 100;
  return value;
}

function toneFromScore(score: number | null): ObservabilityTone {
  if (score == null) return 'neutral';
  if (score >= 0.8) return 'positive';
  if (score >= 0.6) return 'warning';
  return 'critical';
}

function classificationFromScore(score: number | null): ObservabilityClassification {
  if (score == null) return 'unknown';
  if (score >= 0.8) return 'approved';
  if (score >= 0.6) return 'alert';
  return 'rejected';
}

function metric(
  id: string,
  label: string,
  value: string,
  hint: string,
  tone: ObservabilityTone,
): ObservabilityMetric {
  return { id, label, value, hint, tone };
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, item) => sum + item, 0) / values.length;
}

function p95(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.max(0, Math.ceil(sorted.length * 0.95) - 1)] ?? null;
}

function parseNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string') return null;
  const match = value.replace(',', '.').match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function safeJsonParse(value: string | null): unknown | null {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function isObservabilityInternalUrl(url: string): boolean {
  const normalizedUrl = url.toLowerCase();

  if (OBSERVABILITY_INTERNAL_PATHS.some((path) => normalizedUrl.includes(path))) {
    return true;
  }

  if (SUPABASE_URL) {
    const normalizedSupabase = SUPABASE_URL.toLowerCase();
    if (
      normalizedUrl.startsWith(normalizedSupabase) &&
      normalizedUrl.includes(`/rest/v1/${SUPABASE_JUDGE_TABLE.toLowerCase()}`)
    ) {
      return true;
    }
  }

  return false;
}

function findNumber(value: unknown, names: string[]): number | null {
  if (value == null) return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const parsed = findNumber(item, names);
      if (parsed != null) return parsed;
    }
    return null;
  }
  if (typeof value !== 'object') return null;

  const normalizedNames = names.map(normalizeKey);
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (normalizedNames.includes(normalizeKey(key))) {
      const parsed = parseNumber(child);
      if (parsed != null) return parsed;
    }
    const nested = findNumber(child, names);
    if (nested != null) return nested;
  }
  return null;
}

function isAiRequest(log: NetworkInspectorLog): boolean {
  return ['/nutrition', '/review', '/plans', '/agent', '/llm', '/chat', '/rag'].some((path) =>
    log.url.toLowerCase().includes(path),
  );
}

function isErrorLog(log: NetworkInspectorLog): boolean {
  return Boolean(log.error) || (log.statusCode != null && log.statusCode >= 400);
}

function endpointLabel(url: string): string {
  try {
    const parsed = new URL(url);
    return (parsed.pathname || '/')
      .replace(/\/[0-9]+/g, '/:id')
      .replace(/\/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, '/:id');
  } catch {
    return url;
  }
}

function serviceStatus(logs: NetworkInspectorLog[]): ObservabilityServiceStatus {
  if (logs.length === 0) return 'unknown';
  const errorRate = logs.filter(isErrorLog).length / logs.length;
  const avgLatency = average(logs.map((item) => item.durationMs)) ?? 0;
  if (errorRate >= 0.2 || avgLatency >= 2500) return 'critical';
  if (errorRate >= 0.05 || avgLatency >= 1200) return 'warning';
  return 'healthy';
}

function serviceSummary(label: string, logs: NetworkInspectorLog[]): ObservabilityService {
  if (logs.length === 0) {
    return {
      id: normalizeKey(label),
      label,
      status: 'unknown',
      summary: 'Sem dados recentes',
      detail: `Nenhum request de ${label} capturado nesta sessao.`,
    };
  }

  const errorRate = logs.filter(isErrorLog).length / logs.length;
  const avgLatency = average(logs.map((item) => item.durationMs));
  const status = serviceStatus(logs);

  return {
    id: normalizeKey(label),
    label,
    status,
    summary: status === 'healthy' ? 'Operando bem' : status === 'warning' ? 'Sob observacao' : 'Instavel',
    detail: `${logs.length} reqs, ${formatPercent(errorRate)} de erro, media ${formatDuration(avgLatency)}`,
  };
}

function insightsFromSnapshot(params: {
  errorRate: number;
  p95Latency: number | null;
  topEndpoint: string | null;
  totalTokens: number;
  averageQualityScore: number | null;
}): ObservabilityInsight[] {
  const items: ObservabilityInsight[] = [];

  if (params.errorRate >= 0.05) {
    items.push({
      id: 'errors',
      title: 'Taxa de erro acima do ideal',
      description: `A taxa atual esta em ${formatPercent(params.errorRate)}. Vale abrir drill-down por endpoint.`,
      tone: params.errorRate >= 0.12 ? 'critical' : 'warning',
    });
  }

  if ((params.p95Latency ?? 0) >= 1800) {
    items.push({
      id: 'latency',
      title: 'P95 com pico relevante',
      description: `O P95 chegou em ${formatDuration(params.p95Latency)} e pede tracing da cadeia completa.`,
      tone: 'warning',
    });
  }

  if (params.topEndpoint) {
    items.push({
      id: 'endpoint',
      title: 'Endpoint mais lento da sessao',
      description: `${params.topEndpoint} lidera a latencia observada e deve ser o primeiro alvo de otimizacao.`,
      tone: 'neutral',
    });
  }

  if (params.totalTokens > 0) {
    items.push({
      id: 'tokens',
      title: 'Uso de tokens monitorado',
      description: `Foram detectados ${formatCompactNumber(params.totalTokens)} tokens nesta sessao.`,
      tone: 'neutral',
    });
  }

  if (params.averageQualityScore != null) {
    items.push({
      id: 'quality',
      title: 'Score de qualidade agregado',
      description: `O score medio atual esta em ${formatPercent(params.averageQualityScore)}.`,
      tone: toneFromScore(params.averageQualityScore),
    });
  }

  if (items.length === 0) {
    items.push({
      id: 'baseline',
      title: 'Sem alertas criticos por enquanto',
      description: 'Continue monitorando o fluxo para capturar variacao antes de virar incidente.',
      tone: 'positive',
    });
  }

  return items.slice(0, 5);
}

function endpointRow(id: string, item: EndpointAccumulator): ObservabilityEndpointRow {
  return {
    id,
    label: item.label,
    avgLatency: formatDuration(average(item.latenciesMs)),
    p95Latency: formatDuration(p95(item.latenciesMs)),
    volume: `${item.count} reqs`,
    errors: item.errorCount > 0 ? `${item.errorCount} falhas` : '0 falhas',
  };
}

export function buildDeveloperObservabilitySnapshot(logs: NetworkInspectorLog[]): DeveloperObservabilitySnapshot {
  const now = new Date().toISOString();
  const relevantLogs = logs.filter((log) => !isObservabilityInternalUrl(log.url));

  if (relevantLogs.length === 0) {
    return {
      generatedAt: now,
      generatedAtLabel: formatTimestamp(now),
      source: 'fallback',
      periodLabel: null,
      scopeLabel: null,
      services: [
        { id: 'frontend', label: 'Frontend', status: 'healthy', summary: 'App ativo', detail: 'Painel pronto para observar requests.' },
        { id: 'bff', label: 'BFF', status: 'unknown', summary: 'Sem trafego', detail: 'Nenhuma chamada recente ao backend.' },
        { id: 'llm', label: 'IA / Agent', status: 'unknown', summary: 'Sem trafego', detail: 'Nenhuma chamada de IA registrada.' },
      ],
      performanceMetrics: [
        metric('total-latency', 'Latencia total', '--', 'Aguardando trafego para calcular.', 'neutral'),
        metric('avg-latency', 'Latencia media', '--', 'Sem requests recentes.', 'neutral'),
        metric('p95-latency', 'P95', '--', 'Sem requests recentes.', 'neutral'),
        metric('db-latency', 'Banco de dados', '--', 'Sem headers de banco nesta sessao.', 'neutral'),
      ],
      volumeMetrics: [
        metric('total-requests', 'Total de requests', '0', 'Ainda nao houve trafego na sessao.', 'neutral'),
        metric('error-rate', 'Taxa de erro', '--', 'Sem requests para comparar.', 'neutral'),
        metric('failed-requests', 'Falhas', '0', 'Nenhum erro observado.', 'positive'),
        metric('active-endpoints', 'Endpoints ativos', '0', 'Nenhum endpoint tocado ainda.', 'neutral'),
      ],
      llmMetrics: [
        metric('total-tokens', 'Tokens totais', '--', 'Sem dados de IA no momento.', 'neutral'),
        metric('tokens-per-request', 'Tokens por request', '--', 'Sem dados de IA no momento.', 'neutral'),
        metric('estimated-cost', 'Custo estimado', '--', 'Sem payload de custo observado.', 'neutral'),
        metric('cache-hit-rate', 'Cache hit rate', '--', 'Sem cache hit/miss observado.', 'neutral'),
      ],
      judgeMetrics: [
        metric('judge-total', 'Avaliacoes', '--', 'Configure o Supabase publico para ler o judge.', 'neutral'),
        metric('judge-pending', 'Pendentes', '--', 'As avaliacoes assincronas aparecem aqui quando o banco estiver conectado.', 'neutral'),
        metric('judge-failed', 'Falhas', '--', 'Sem acesso remoto ao status do judge ainda.', 'neutral'),
        metric('judge-latency', 'Tempo medio', '--', 'Aguardando duracoes do banco do judge.', 'neutral'),
      ],
      qualityMetrics: [
        metric('overall-score', 'Score geral', '--', 'Sem avaliacoes do judge ainda.', 'neutral'),
        metric('approval-rate', 'Taxa de aprovacao', '--', 'Sem avaliacoes do judge ainda.', 'neutral'),
        metric('approved-count', 'Aprovado', '0', 'Nenhuma classificacao encontrada.', 'neutral'),
        metric('rejected-count', 'Reprovado', '0', 'Nenhuma classificacao encontrada.', 'neutral'),
      ],
      qualityCriteria: QUALITY_CRITERIA.map((criterion) => ({
        id: criterion.id,
        label: criterion.label,
        value: '--',
        classification: 'unknown',
      })),
      insights: [
        {
          id: 'empty',
          title: 'Sem trafego suficiente ainda',
          description: 'Navegue pelo app para alimentar o painel com requests, latencia e sinais de IA.',
          tone: 'neutral',
        },
      ],
      topEndpointsTitle: null,
      topEndpoints: [{ id: 'empty-latency', label: 'Latencia por endpoint', avgLatency: '--', p95Latency: '--', volume: 'Nenhum endpoint observado', errors: '--' }],
      errorEndpointsTitle: null,
      errorEndpoints: [{ id: 'empty-errors', label: 'Erros por endpoint', avgLatency: '--', p95Latency: '--', volume: 'Nenhuma falha observada', errors: '--' }],
      timeline: [],
      judgeEvaluations: [],
      recentRuns: [],
    };
  }

  const endpointMap = new Map<string, EndpointAccumulator>();
  const qualityTotals = new Map<string, QualityAccumulator>();
  QUALITY_CRITERIA.forEach((criterion) => qualityTotals.set(criterion.id, { sum: 0, count: 0 }));
  const bffLogs: NetworkInspectorLog[] = [];
  const aiLogs: NetworkInspectorLog[] = [];
  const dbLatencies: number[] = [];
  let totalLatency = 0;
  let errorCount = 0;
  let totalTokens = 0;
  let tokenRequests = 0;
  let totalCost = 0;
  let qualityScoreSum = 0;
  let qualityScoreCount = 0;
  let approvedCount = 0;
  let rejectedCount = 0;

  relevantLogs.forEach((log) => {
    totalLatency += log.durationMs;
    if (isErrorLog(log)) errorCount += 1;
    if (isAiRequest(log)) aiLogs.push(log);
    else bffLogs.push(log);

    const label = endpointLabel(log.url);
    const current = endpointMap.get(label) ?? { label, count: 0, errorCount: 0, latenciesMs: [] };
    current.count += 1;
    current.latenciesMs.push(log.durationMs);
    if (isErrorLog(log)) current.errorCount += 1;
    endpointMap.set(label, current);

    for (const [key, value] of Object.entries(log.responseHeaders)) {
      const normalized = normalizeKey(key);
      if (['xdbdurationms', 'xdatabasedurationms', 'xquerydurationms'].includes(normalized)) {
        const dbLatency = parseNumber(value);
        if (dbLatency != null) dbLatencies.push(dbLatency);
      }
      if (['xopenaitotaltokens', 'xtotaltokens'].includes(normalized)) {
        const tokens = parseNumber(value);
        if (tokens != null) {
          totalTokens += tokens;
          tokenRequests += 1;
        }
      }
      if (['xestimatedcostusd', 'xllmcostusd'].includes(normalized)) {
        const cost = parseNumber(value);
        if (cost != null) totalCost += cost;
      }
    }

    const body = safeJsonParse(log.responseBody);
    const score = normalizeScore(findNumber(body, ['judge_score', 'overall_score', 'quality_score', 'score']));
    if (score != null) {
      qualityScoreSum += score;
      qualityScoreCount += 1;
      if (score >= 0.8) approvedCount += 1;
      else if (score < 0.6) rejectedCount += 1;
    }

    QUALITY_CRITERIA.forEach((criterion) => {
      const value = normalizeScore(findNumber(body, [criterion.id]));
      if (value == null) return;
      const current = qualityTotals.get(criterion.id);
      if (!current) return;
      current.sum += value;
      current.count += 1;
    });
  });

  const requestCount = relevantLogs.length;
  const errorRate = errorCount / requestCount;
  const avgLatency = average(relevantLogs.map((item) => item.durationMs));
  const p95Latency = p95(relevantLogs.map((item) => item.durationMs));
  const avgDbLatency = average(dbLatencies);
  const endpointStats = Array.from(endpointMap.values());
  const slowEndpoints = [...endpointStats]
    .sort((left, right) => (p95(right.latenciesMs) ?? 0) - (p95(left.latenciesMs) ?? 0))
    .slice(0, 5);
  const failingEndpoints = [...endpointStats]
    .filter((item) => item.errorCount > 0)
    .sort((left, right) => right.errorCount - left.errorCount)
    .slice(0, 5);
  const averageQualityScore = qualityScoreCount > 0 ? qualityScoreSum / qualityScoreCount : null;
  const approvalRate = qualityScoreCount > 0 ? approvedCount / qualityScoreCount : null;

  return {
    generatedAt: now,
    generatedAtLabel: formatTimestamp(now),
    source: 'fallback',
    periodLabel: null,
    scopeLabel: null,
    services: [
      { id: 'frontend', label: 'Frontend', status: 'healthy', summary: 'Capturando eventos', detail: `${requestCount} requests observados nesta sessao.` },
      serviceSummary('BFF', bffLogs),
      serviceSummary('IA / Agent', aiLogs),
    ],
    performanceMetrics: [
      metric('total-latency', 'Latencia total', formatDuration(totalLatency), `Soma da sessao com ${requestCount} requests.`, (p95Latency ?? 0) >= 2200 ? 'warning' : 'positive'),
      metric('avg-latency', 'Latencia media', formatDuration(avgLatency), 'Media geral da sessao observada.', (avgLatency ?? 0) >= 1200 ? 'warning' : 'positive'),
      metric('p95-latency', 'P95', formatDuration(p95Latency), 'Pico de latencia para priorizar gargalos.', (p95Latency ?? 0) >= 1800 ? 'warning' : 'positive'),
      metric('db-latency', 'Banco de dados', formatDuration(avgDbLatency), dbLatencies.length > 0 ? 'Media lida de headers do backend.' : 'Sem headers de banco nesta sessao.', (avgDbLatency ?? 0) >= 400 ? 'warning' : 'neutral'),
    ],
    volumeMetrics: [
      metric('total-requests', 'Total de requests', formatCompactNumber(requestCount), `${endpointStats.length} endpoints acionados.`, 'positive'),
      metric('error-rate', 'Taxa de erro', formatPercent(errorRate), `${errorCount} requests falharam nesta sessao.`, errorRate >= 0.05 ? 'critical' : 'positive'),
      metric('failed-requests', 'Falhas', formatCompactNumber(errorCount), 'Volume absoluto de erros observados.', errorCount > 0 ? 'critical' : 'positive'),
      metric('active-endpoints', 'Endpoints ativos', formatCompactNumber(endpointStats.length), 'Cobertura tecnica observada na sessao.', 'positive'),
    ],
    llmMetrics: [
      metric('total-tokens', 'Tokens totais', totalTokens > 0 ? formatCompactNumber(totalTokens) : '--', totalTokens > 0 ? 'Somatorio dos requests de IA capturados.' : 'Sem sinais de tokens ainda.', totalTokens > 0 ? 'positive' : 'neutral'),
      metric('tokens-per-request', 'Tokens por request', tokenRequests > 0 ? formatCompactNumber(totalTokens / tokenRequests) : '--', tokenRequests > 0 ? `${tokenRequests} requests de IA com uso identificado.` : 'Sem sinais de tokens ainda.', 'neutral'),
      metric('estimated-cost', 'Custo estimado', totalCost > 0 ? formatCurrency(totalCost) : '--', totalCost > 0 ? 'Baseado em headers de custo.' : 'Sem valores de custo expostos pelo backend.', totalCost > 0 ? 'warning' : 'neutral'),
      metric('cache-hit-rate', 'Cache hit rate', '--', 'Sem cache hit/miss padronizado nesta sessao.', 'neutral'),
    ],
    judgeMetrics: [
      metric('judge-total', 'Avaliacoes', '--', 'Os dados do judge sao lidos remotamente do banco.', 'neutral'),
      metric('judge-pending', 'Pendentes', '--', 'Aguardando sincronizacao com a tabela do judge.', 'neutral'),
      metric('judge-failed', 'Falhas', '--', 'Falhas do judge nao aparecem nos logs locais.', 'neutral'),
      metric('judge-latency', 'Tempo medio', '--', 'Tempo do judge vem da persistencia assincrona no banco.', 'neutral'),
    ],
    qualityMetrics: [
      metric('overall-score', 'Score geral', averageQualityScore != null ? formatPercent(averageQualityScore) : '--', averageQualityScore != null ? 'Media agregada do judge.' : 'Sem scores de qualidade capturados.', toneFromScore(averageQualityScore)),
      metric('approval-rate', 'Taxa de aprovacao', approvalRate != null ? formatPercent(approvalRate) : '--', approvalRate != null ? 'Share de respostas aprovadas.' : 'Sem classificacoes do judge ainda.', toneFromScore(approvalRate)),
      metric('approved-count', 'Aprovado', formatCompactNumber(approvedCount), 'Classificacoes aprovadas na sessao.', approvedCount > 0 ? 'positive' : 'neutral'),
      metric('rejected-count', 'Reprovado', formatCompactNumber(rejectedCount), 'Classificacoes reprovadas na sessao.', rejectedCount > 0 ? 'critical' : 'neutral'),
    ],
    qualityCriteria: QUALITY_CRITERIA.map((criterion) => {
      const total = qualityTotals.get(criterion.id);
      const score = total && total.count > 0 ? total.sum / total.count : null;
      return {
        id: criterion.id,
        label: criterion.label,
        value: score != null ? formatPercent(score) : '--',
        classification: classificationFromScore(score),
      };
    }),
    insights: insightsFromSnapshot({
      errorRate,
      p95Latency,
      topEndpoint: slowEndpoints[0]?.label ?? null,
      totalTokens,
      averageQualityScore,
    }),
    topEndpointsTitle: null,
    topEndpoints: slowEndpoints.length > 0 ? slowEndpoints.map((item, index) => endpointRow(`slow-${index}`, item)) : [buildDeveloperObservabilitySnapshot([]).topEndpoints[0]],
    errorEndpointsTitle: null,
    errorEndpoints: failingEndpoints.length > 0 ? failingEndpoints.map((item, index) => endpointRow(`err-${index}`, item)) : [buildDeveloperObservabilitySnapshot([]).errorEndpoints[0]],
    timeline: relevantLogs.slice(0, 6).map((log) => ({
      id: log.id,
      timestampLabel: formatTimestamp(log.timestamp),
      title: isErrorLog(log) ? `${log.method} falhou em ${endpointLabel(log.url)}` : `${log.method} em ${endpointLabel(log.url)}`,
      description: isErrorLog(log) ? log.error || `Status ${log.statusCode ?? 'desconhecido'}` : `${formatDuration(log.durationMs)} - ${log.statusCode ?? 'sem status'}`,
      tone: isErrorLog(log) ? 'critical' : log.durationMs >= 1800 ? 'warning' : 'neutral',
    })),
    judgeEvaluations: [],
    recentRuns: [],
  };
}

export function mergeDeveloperObservabilitySnapshot(
  fallback: DeveloperObservabilitySnapshot,
  overrides: DeveloperObservabilitySnapshotOverrides | null,
): DeveloperObservabilitySnapshot {
  if (!overrides) return fallback;

  const generatedAt = overrides.generatedAt ?? fallback.generatedAt;

  return {
    generatedAt,
    generatedAtLabel: overrides.generatedAtLabel ?? formatTimestamp(generatedAt),
    source: overrides.source ?? fallback.source,
    periodLabel: overrides.periodLabel ?? fallback.periodLabel ?? null,
    scopeLabel: overrides.scopeLabel ?? fallback.scopeLabel ?? null,
    services: overrides.services?.length ? overrides.services : fallback.services,
    performanceMetrics: overrides.performanceMetrics?.length ? overrides.performanceMetrics : fallback.performanceMetrics,
    volumeMetrics: overrides.volumeMetrics?.length ? overrides.volumeMetrics : fallback.volumeMetrics,
    llmMetrics: overrides.llmMetrics?.length ? overrides.llmMetrics : fallback.llmMetrics,
    judgeMetrics: overrides.judgeMetrics?.length ? overrides.judgeMetrics : fallback.judgeMetrics,
    qualityMetrics: overrides.qualityMetrics?.length ? overrides.qualityMetrics : fallback.qualityMetrics,
    qualityCriteria: overrides.qualityCriteria?.length ? overrides.qualityCriteria : fallback.qualityCriteria,
    insights: overrides.insights?.length ? overrides.insights : fallback.insights,
    topEndpointsTitle: overrides.topEndpointsTitle ?? fallback.topEndpointsTitle ?? null,
    topEndpoints: overrides.topEndpoints?.length ? overrides.topEndpoints : fallback.topEndpoints,
    errorEndpointsTitle: overrides.errorEndpointsTitle ?? fallback.errorEndpointsTitle ?? null,
    errorEndpoints: overrides.errorEndpoints?.length ? overrides.errorEndpoints : fallback.errorEndpoints,
    timeline: overrides.timeline?.length ? overrides.timeline : fallback.timeline,
    judgeEvaluations: overrides.judgeEvaluations?.length ? overrides.judgeEvaluations : fallback.judgeEvaluations,
    recentRuns: overrides.recentRuns?.length ? overrides.recentRuns : fallback.recentRuns,
  };
}

export async function getDeveloperObservabilitySnapshotOverrides(
  query: DeveloperObservabilityQuery = {},
): Promise<DeveloperObservabilitySnapshotOverrides | null> {
  const [telemetryResult, runsResult, judgeResult] = await Promise.allSettled([
    getAdminTelemetryMetricsSnapshotOverrides(query),
    getAdminTelemetryRunsSnapshotOverrides({ ...query, limit: 5 }),
    getDeveloperJudgeSnapshotOverrides(query),
  ]);

  const telemetry =
    telemetryResult.status === 'fulfilled' ? telemetryResult.value : null;
  const runs =
    runsResult.status === 'fulfilled' ? runsResult.value : null;
  const judge = judgeResult.status === 'fulfilled' ? judgeResult.value : null;

  if (!telemetry && !runs && !judge) {
    if (telemetryResult.status === 'rejected') throw telemetryResult.reason;
    if (runsResult.status === 'rejected') throw runsResult.reason;
    if (judgeResult.status === 'rejected') throw judgeResult.reason;
    return null;
  }

  const sources = [telemetry, runs, judge].filter(Boolean).length;
  const source =
    sources > 1
      ? 'hybrid'
      : telemetry?.source ?? runs?.source ?? judge?.source ?? 'backend';

  return {
    generatedAt: telemetry?.generatedAt ?? runs?.generatedAt ?? judge?.generatedAt,
    generatedAtLabel: telemetry?.generatedAtLabel ?? runs?.generatedAtLabel ?? judge?.generatedAtLabel,
    source,
    periodLabel: telemetry?.periodLabel ?? runs?.periodLabel ?? judge?.periodLabel ?? null,
    scopeLabel: telemetry?.scopeLabel ?? runs?.scopeLabel ?? judge?.scopeLabel ?? null,
    services: telemetry?.services,
    performanceMetrics: telemetry?.performanceMetrics,
    volumeMetrics: telemetry?.volumeMetrics,
    llmMetrics: telemetry?.llmMetrics,
    judgeMetrics: judge?.judgeMetrics ?? [],
    qualityMetrics: judge?.qualityMetrics?.length ? judge.qualityMetrics : telemetry?.qualityMetrics ?? [],
    qualityCriteria: judge?.qualityCriteria?.length ? judge.qualityCriteria : telemetry?.qualityCriteria ?? [],
    insights: telemetry?.insights,
    topEndpointsTitle: telemetry?.topEndpointsTitle,
    topEndpoints: telemetry?.topEndpoints,
    errorEndpointsTitle: telemetry?.errorEndpointsTitle,
    errorEndpoints: telemetry?.errorEndpoints,
    timeline: runs?.timeline?.length ? runs.timeline : telemetry?.timeline,
    judgeEvaluations: judge?.judgeEvaluations ?? [],
    recentRuns: runs?.recentRuns ?? [],
  };
}
