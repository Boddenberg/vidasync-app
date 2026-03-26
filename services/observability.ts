import { SUPABASE_JUDGE_TABLE, SUPABASE_URL } from '@/constants/config';
import { apiGetJson } from '@/services/api';
import { getDeveloperJudgeSnapshotOverrides } from '@/services/observability-judge';
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

const METRIC_PATHS = {
  overview: '/metrics/overview',
  performance: '/metrics/performance',
  llm: '/metrics/llm',
  quality: '/metrics/quality',
  insights: '/metrics/insights',
} as const;

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

  if (Object.values(METRIC_PATHS).some((path) => normalizedUrl.includes(path))) {
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

function findArray(value: unknown, name: string): unknown[] | null {
  if (value == null) return null;
  if (Array.isArray(value)) return value;
  if (typeof value !== 'object') return null;

  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (normalizeKey(key) === normalizeKey(name) && Array.isArray(child)) {
      return child;
    }
    const nested = findArray(child, name);
    if (nested) return nested;
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
      topEndpoints: [{ id: 'empty-latency', label: 'Latencia por endpoint', avgLatency: '--', p95Latency: '--', volume: 'Nenhum endpoint observado', errors: '--' }],
      errorEndpoints: [{ id: 'empty-errors', label: 'Erros por endpoint', avgLatency: '--', p95Latency: '--', volume: 'Nenhuma falha observada', errors: '--' }],
      timeline: [],
      judgeEvaluations: [],
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
    topEndpoints: slowEndpoints.length > 0 ? slowEndpoints.map((item, index) => endpointRow(`slow-${index}`, item)) : [buildDeveloperObservabilitySnapshot([]).topEndpoints[0]],
    errorEndpoints: failingEndpoints.length > 0 ? failingEndpoints.map((item, index) => endpointRow(`err-${index}`, item)) : [buildDeveloperObservabilitySnapshot([]).errorEndpoints[0]],
    timeline: relevantLogs.slice(0, 6).map((log) => ({
      id: log.id,
      timestampLabel: formatTimestamp(log.timestamp),
      title: isErrorLog(log) ? `${log.method} falhou em ${endpointLabel(log.url)}` : `${log.method} em ${endpointLabel(log.url)}`,
      description: isErrorLog(log) ? log.error || `Status ${log.statusCode ?? 'desconhecido'}` : `${formatDuration(log.durationMs)} - ${log.statusCode ?? 'sem status'}`,
      tone: isErrorLog(log) ? 'critical' : log.durationMs >= 1800 ? 'warning' : 'neutral',
    })),
    judgeEvaluations: [],
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
    services: overrides.services?.length ? overrides.services : fallback.services,
    performanceMetrics: overrides.performanceMetrics?.length ? overrides.performanceMetrics : fallback.performanceMetrics,
    volumeMetrics: overrides.volumeMetrics?.length ? overrides.volumeMetrics : fallback.volumeMetrics,
    llmMetrics: overrides.llmMetrics?.length ? overrides.llmMetrics : fallback.llmMetrics,
    judgeMetrics: overrides.judgeMetrics?.length ? overrides.judgeMetrics : fallback.judgeMetrics,
    qualityMetrics: overrides.qualityMetrics?.length ? overrides.qualityMetrics : fallback.qualityMetrics,
    qualityCriteria: overrides.qualityCriteria?.length ? overrides.qualityCriteria : fallback.qualityCriteria,
    insights: overrides.insights?.length ? overrides.insights : fallback.insights,
    topEndpoints: overrides.topEndpoints?.length ? overrides.topEndpoints : fallback.topEndpoints,
    errorEndpoints: overrides.errorEndpoints?.length ? overrides.errorEndpoints : fallback.errorEndpoints,
    timeline: overrides.timeline?.length ? overrides.timeline : fallback.timeline,
    judgeEvaluations: overrides.judgeEvaluations?.length ? overrides.judgeEvaluations : fallback.judgeEvaluations,
  };
}

export async function getDeveloperObservabilitySnapshotOverrides(): Promise<DeveloperObservabilitySnapshotOverrides | null> {
  const [overview, performance, llm, quality, insights, judge] = await Promise.all([
    apiGetJson(METRIC_PATHS.overview).catch(() => null),
    apiGetJson(METRIC_PATHS.performance).catch(() => null),
    apiGetJson(METRIC_PATHS.llm).catch(() => null),
    apiGetJson(METRIC_PATHS.quality).catch(() => null),
    apiGetJson(METRIC_PATHS.insights).catch(() => null),
    getDeveloperJudgeSnapshotOverrides().catch(() => null),
  ]);

  const available = [overview, performance, llm, quality, insights, judge].filter((item) => item != null);
  if (available.length === 0) return null;

  const generatedAt = new Date().toISOString();
  const servicesArray = findArray(overview, 'services');
  const services: ObservabilityService[] = Array.isArray(servicesArray)
    ? servicesArray
        .map((item, index) => {
          const row = item as Record<string, unknown>;
          const label = `${row.label ?? row.name ?? row.service ?? `Servico ${index + 1}`}`.trim();
          const status = normalizeKey(`${row.status ?? row.health ?? 'unknown'}`);
          return {
            id: `${normalizeKey(label)}-${index}`,
            label,
            status: ['healthy', 'ok', 'up'].includes(status)
              ? 'healthy'
              : ['warning', 'alert', 'degraded'].includes(status)
                ? 'warning'
                : ['critical', 'error', 'down'].includes(status)
                  ? 'critical'
                  : 'unknown',
            summary: `${row.summary ?? row.message ?? 'Resumo nao informado'}`,
            detail: `${row.detail ?? row.description ?? 'Sem detalhe adicional'}`,
          } as ObservabilityService;
        })
        .slice(0, 5)
    : [];

  const totalRequests = findNumber(overview, ['total_requests', 'request_count', 'requests']);
  const errorRate = findNumber(overview, ['error_rate', 'error_percentage']);
  const avgLatency = findNumber(performance, ['average_latency', 'avg_latency', 'mean_latency']);
  const p95Latency = findNumber(performance, ['p95', 'p95_latency']);
  const dbLatency = findNumber(performance, ['database_latency', 'db_latency', 'query_latency']);
  const totalTokens = findNumber(llm, ['total_tokens', 'tokens_used', 'tokens_total']);
  const tokensPerRequest = findNumber(llm, ['tokens_per_request', 'average_tokens']);
  const estimatedCost = findNumber(llm, ['estimated_cost_usd', 'estimated_cost', 'cost_usd']);
  const cacheHitRate = findNumber(llm, ['cache_hit_rate', 'cache_hit_ratio']);
  const overallScore = normalizeScore(findNumber(quality, ['overall_score', 'quality_score', 'judge_score']));
  const approvalRate = normalizeScore(findNumber(quality, ['approval_rate', 'pass_rate']));
  const approvedCount = findNumber(quality, ['approved_count', 'approved']);
  const rejectedCount = findNumber(quality, ['rejected_count', 'rejected']);

  const insightsArray = findArray(insights, 'insights') ?? findArray(insights, 'recommendations');
  const normalizedInsights: ObservabilityInsight[] = Array.isArray(insightsArray)
    ? insightsArray
        .map((item, index) => ({
          id: `insight-${index}`,
          title: typeof item === 'string' ? `Insight ${index + 1}` : `${(item as Record<string, unknown>).title ?? `Insight ${index + 1}`}`,
          description: typeof item === 'string' ? item : `${(item as Record<string, unknown>).description ?? (item as Record<string, unknown>).message ?? 'Sem descricao adicional.'}`,
          tone: typeof item === 'string' ? 'neutral' : `${(item as Record<string, unknown>).tone ?? 'neutral'}` as ObservabilityTone,
        }))
        .slice(0, 5)
    : [];

  const fallbackQualityMetrics: ObservabilityMetric[] = [
    overallScore != null ? metric('overall-score', 'Score geral', formatPercent(overallScore), 'Score geral informado pelo judge.', toneFromScore(overallScore)) : null,
    approvalRate != null ? metric('approval-rate', 'Taxa de aprovacao', formatPercent(approvalRate), 'Aprovacao agregada do judge.', toneFromScore(approvalRate)) : null,
    approvedCount != null ? metric('approved-count', 'Aprovado', formatCompactNumber(approvedCount), 'Total aprovado.', 'positive') : null,
    rejectedCount != null ? metric('rejected-count', 'Reprovado', formatCompactNumber(rejectedCount), 'Total reprovado.', 'critical') : null,
  ].filter(Boolean) as ObservabilityMetric[];

  const fallbackQualityCriteria = QUALITY_CRITERIA.map((criterion) => {
    const score = normalizeScore(findNumber(quality, [criterion.id]));
    if (score == null) return null;
    return {
      id: criterion.id,
      label: criterion.label,
      value: formatPercent(score),
      classification: classificationFromScore(score),
    };
  }).filter(Boolean) as DeveloperObservabilitySnapshot['qualityCriteria'];

  return {
    generatedAt,
    generatedAtLabel: formatTimestamp(generatedAt),
    source: 'hybrid',
    services,
    performanceMetrics: [
      avgLatency != null ? metric('avg-latency', 'Latencia media', formatDuration(avgLatency), 'Media consolidada pelo backend.', avgLatency >= 1200 ? 'warning' : 'positive') : null,
      p95Latency != null ? metric('p95-latency', 'P95', formatDuration(p95Latency), 'P95 informado pelo backend.', p95Latency >= 1800 ? 'warning' : 'positive') : null,
      dbLatency != null ? metric('db-latency', 'Banco de dados', formatDuration(dbLatency), 'Latencia media do banco.', dbLatency >= 400 ? 'warning' : 'neutral') : null,
    ].filter(Boolean) as ObservabilityMetric[],
    volumeMetrics: [
      totalRequests != null ? metric('total-requests', 'Total de requests', formatCompactNumber(totalRequests), 'Volume consolidado pelo backend.', 'positive') : null,
      errorRate != null ? metric('error-rate', 'Taxa de erro', formatPercent(errorRate), 'Erro percentual informado pelo backend.', (errorRate <= 1 ? errorRate : errorRate / 100) >= 0.05 ? 'critical' : 'positive') : null,
    ].filter(Boolean) as ObservabilityMetric[],
    llmMetrics: [
      totalTokens != null ? metric('total-tokens', 'Tokens totais', formatCompactNumber(totalTokens), 'Uso total de tokens.', 'positive') : null,
      tokensPerRequest != null ? metric('tokens-per-request', 'Tokens por request', formatCompactNumber(tokensPerRequest), 'Media de tokens por chamada.', 'neutral') : null,
      estimatedCost != null ? metric('estimated-cost', 'Custo estimado', formatCurrency(estimatedCost), 'Custo agregado da IA.', 'warning') : null,
      cacheHitRate != null ? metric('cache-hit-rate', 'Cache hit rate', formatPercent(cacheHitRate), 'Aproveitamento do cache informado pelo backend.', 'neutral') : null,
    ].filter(Boolean) as ObservabilityMetric[],
    judgeMetrics: judge?.judgeMetrics ?? [],
    qualityMetrics: judge?.qualityMetrics?.length ? judge.qualityMetrics : fallbackQualityMetrics,
    qualityCriteria: judge?.qualityCriteria?.length ? judge.qualityCriteria : fallbackQualityCriteria,
    insights: normalizedInsights,
    judgeEvaluations: judge?.judgeEvaluations ?? [],
  };
}
