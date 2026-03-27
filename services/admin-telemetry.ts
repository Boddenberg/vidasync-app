import { INTERNAL_ADMIN_API_KEY, INTERNAL_ADMIN_USER_ID } from '@/constants/config';
import { apiGetJson } from '@/services/api';
import type {
  DeveloperObservabilitySnapshotOverrides,
  ObservabilityEndpointRow,
  ObservabilityInsight,
  ObservabilityMetric,
  ObservabilityService,
  ObservabilityServiceStatus,
  ObservabilityTimelineEvent,
  ObservabilityTone,
} from '@/types/observability';

export type AdminTelemetryMetricsQuery = {
  days?: number;
  agent?: string | null;
  model?: string | null;
  status?: string | null;
};

export type AdminTelemetryMetricsPayload = {
  filters?: Record<string, unknown> | null;
  summary?: Record<string, unknown> | null;
  daily?: Array<Record<string, unknown>> | null;
  byAgent?: Array<Record<string, unknown>> | null;
  byModel?: Array<Record<string, unknown>> | null;
};

type AdminTelemetryMetricsResponse = {
  metrics?: AdminTelemetryMetricsPayload | null;
};

type NormalizedFilters = {
  startDate: string | null;
  endDate: string | null;
  days: number;
  agent: string | null;
  model: string | null;
  status: string | null;
};

type NormalizedSummary = {
  totalRuns: number;
  successCount: number;
  errorCount: number;
  timeoutCount: number;
  totalCostUsd: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  averageDurationMs: number | null;
  p95DurationMs: number | null;
  latestRunAt: string | null;
  oldestRunAt: string | null;
};

type NormalizedDailyRow = {
  dayUtc: string;
  runCount: number;
  successCount: number;
  errorCount: number;
  timeoutCount: number;
  totalCostUsd: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  averageDurationMs: number | null;
  p95DurationMs: number | null;
};

type NormalizedByAgentRow = {
  agent: string;
  runCount: number;
  successCount: number;
  errorCount: number;
  timeoutCount: number;
  totalCostUsd: number;
  totalTokens: number;
  averageDurationMs: number | null;
  p95DurationMs: number | null;
};

type NormalizedByModelRow = {
  model: string;
  agent: string | null;
  llmCallCount: number;
  totalCostUsd: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  averageDurationMs: number | null;
  p95DurationMs: number | null;
};

const METRICS_PATH = '/internal/admin/telemetry/metrics';
const DEFAULT_DAYS = 7;

function asTrimmedString(value: unknown): string {
  return `${value ?? ''}`.trim();
}

function parseNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string') return null;
  const match = value.replace(',', '.').match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function normalizeDays(value: number | null | undefined): number {
  const normalized = parseNumber(value) ?? DEFAULT_DAYS;
  if (!Number.isFinite(normalized) || normalized <= 0) return DEFAULT_DAYS;
  return Math.min(Math.round(normalized), 90);
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

function formatDateOnly(value: string | null | undefined): string | null {
  const trimmed = asTrimmedString(value);
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return trimmed || null;
  return `${match[3]}/${match[2]}`;
}

function formatTimestamp(value: string | null | undefined): string {
  const trimmed = asTrimmedString(value);
  const date = trimmed ? new Date(trimmed) : null;
  if (!date || Number.isNaN(date.getTime())) return '--';
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function toneFromThreshold(value: number | null, warningThreshold: number, criticalThreshold: number): ObservabilityTone {
  if (value == null) return 'neutral';
  if (value >= criticalThreshold) return 'critical';
  if (value >= warningThreshold) return 'warning';
  return 'positive';
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

function emptyRankingRow(id: string, label: string, volume: string, errors: string): ObservabilityEndpointRow {
  return {
    id,
    label,
    avgLatency: '--',
    p95Latency: '--',
    volume,
    errors,
  };
}

function normalizeFilters(value: Record<string, unknown> | null | undefined): NormalizedFilters {
  return {
    startDate: asTrimmedString(value?.startDate) || null,
    endDate: asTrimmedString(value?.endDate) || null,
    days: normalizeDays(parseNumber(value?.days)),
    agent: asTrimmedString(value?.agent) || null,
    model: asTrimmedString(value?.model) || null,
    status: asTrimmedString(value?.status) || null,
  };
}

function normalizeSummary(value: Record<string, unknown> | null | undefined): NormalizedSummary {
  return {
    totalRuns: parseNumber(value?.totalRuns) ?? 0,
    successCount: parseNumber(value?.successCount) ?? 0,
    errorCount: parseNumber(value?.errorCount) ?? 0,
    timeoutCount: parseNumber(value?.timeoutCount) ?? 0,
    totalCostUsd: parseNumber(value?.totalCostUsd) ?? 0,
    inputTokens: parseNumber(value?.inputTokens) ?? 0,
    outputTokens: parseNumber(value?.outputTokens) ?? 0,
    totalTokens: parseNumber(value?.totalTokens) ?? 0,
    averageDurationMs: parseNumber(value?.averageDurationMs),
    p95DurationMs: parseNumber(value?.p95DurationMs),
    latestRunAt: asTrimmedString(value?.latestRunAt) || null,
    oldestRunAt: asTrimmedString(value?.oldestRunAt) || null,
  };
}

function normalizeDailyRow(value: Record<string, unknown>, index: number): NormalizedDailyRow {
  return {
    dayUtc: asTrimmedString(value.dayUtc) || `day-${index + 1}`,
    runCount: parseNumber(value.runCount) ?? 0,
    successCount: parseNumber(value.successCount) ?? 0,
    errorCount: parseNumber(value.errorCount) ?? 0,
    timeoutCount: parseNumber(value.timeoutCount) ?? 0,
    totalCostUsd: parseNumber(value.totalCostUsd) ?? 0,
    inputTokens: parseNumber(value.inputTokens) ?? 0,
    outputTokens: parseNumber(value.outputTokens) ?? 0,
    totalTokens: parseNumber(value.totalTokens) ?? 0,
    averageDurationMs: parseNumber(value.averageDurationMs),
    p95DurationMs: parseNumber(value.p95DurationMs),
  };
}

function normalizeByAgentRow(value: Record<string, unknown>, index: number): NormalizedByAgentRow {
  return {
    agent: asTrimmedString(value.agent) || `agente-${index + 1}`,
    runCount: parseNumber(value.runCount) ?? 0,
    successCount: parseNumber(value.successCount) ?? 0,
    errorCount: parseNumber(value.errorCount) ?? 0,
    timeoutCount: parseNumber(value.timeoutCount) ?? 0,
    totalCostUsd: parseNumber(value.totalCostUsd) ?? 0,
    totalTokens: parseNumber(value.totalTokens) ?? 0,
    averageDurationMs: parseNumber(value.averageDurationMs),
    p95DurationMs: parseNumber(value.p95DurationMs),
  };
}

function normalizeByModelRow(value: Record<string, unknown>, index: number): NormalizedByModelRow {
  return {
    model: asTrimmedString(value.model) || `modelo-${index + 1}`,
    agent: asTrimmedString(value.agent) || null,
    llmCallCount: parseNumber(value.llmCallCount) ?? 0,
    totalCostUsd: parseNumber(value.totalCostUsd) ?? 0,
    inputTokens: parseNumber(value.inputTokens) ?? 0,
    outputTokens: parseNumber(value.outputTokens) ?? 0,
    totalTokens: parseNumber(value.totalTokens) ?? 0,
    averageDurationMs: parseNumber(value.averageDurationMs),
    p95DurationMs: parseNumber(value.p95DurationMs),
  };
}

function serviceStatusFromSummary(summary: NormalizedSummary): ObservabilityServiceStatus {
  if (summary.totalRuns <= 0) return 'unknown';

  const errorRate = summary.errorCount / summary.totalRuns;
  if (errorRate >= 0.2 || (summary.p95DurationMs ?? 0) >= 5000) return 'critical';
  if (errorRate >= 0.05 || (summary.p95DurationMs ?? 0) >= 2500 || summary.timeoutCount > 0) return 'warning';
  return 'healthy';
}

function buildPeriodLabel(filters: NormalizedFilters): string | null {
  const startLabel = formatDateOnly(filters.startDate);
  const endLabel = formatDateOnly(filters.endDate);

  if (startLabel && endLabel) {
    return startLabel === endLabel ? startLabel : `${startLabel} a ${endLabel}`;
  }

  return filters.days > 0 ? `Ultimos ${filters.days} dias` : null;
}

function buildScopeLabel(filters: NormalizedFilters): string | null {
  const parts = [filters.agent ? `Agente ${filters.agent}` : 'Todos os agentes'];
  if (filters.model) parts.push(`Modelo ${filters.model}`);
  if (filters.status) parts.push(`Status ${filters.status}`);
  return parts.join(' - ');
}

function buildServices(
  summary: NormalizedSummary,
  filters: NormalizedFilters,
  byAgent: NormalizedByAgentRow[],
  byModel: NormalizedByModelRow[],
): ObservabilityService[] {
  const overallStatus = serviceStatusFromSummary(summary);
  const successRate = summary.totalRuns > 0 ? summary.successCount / summary.totalRuns : null;
  const topAgent = byAgent[0] ?? null;
  const topModel = byModel[0] ?? null;
  const periodLabel = buildPeriodLabel(filters);

  return [
    {
      id: 'telemetry-backend',
      label: 'Backend',
      status: overallStatus,
      summary:
        summary.totalRuns > 0
          ? `${formatCompactNumber(summary.totalRuns)} execucoes no recorte`
          : 'Sem execucoes no recorte',
      detail:
        summary.totalRuns > 0
          ? `${formatPercent(successRate)} de sucesso, P95 ${formatDuration(summary.p95DurationMs)}`
          : `Recorte ${periodLabel ?? 'selecionado'} ainda sem trafego.`,
    },
    {
      id: 'telemetry-scope',
      label: filters.agent ? `Agente ${filters.agent}` : 'Agentes',
      status: topAgent
        ? serviceStatusFromSummary({
            ...summary,
            totalRuns: topAgent.runCount,
            successCount: topAgent.successCount,
            errorCount: topAgent.errorCount,
            timeoutCount: topAgent.timeoutCount,
            p95DurationMs: topAgent.p95DurationMs,
          })
        : 'unknown',
      summary: topAgent
        ? `${topAgent.agent} lidera o volume com ${formatCompactNumber(topAgent.runCount)} execucoes`
        : 'Sem breakdown por agente',
      detail: topAgent
        ? `${formatCurrency(topAgent.totalCostUsd)} em custo e ${formatCompactNumber(topAgent.totalTokens)} tokens`
        : 'O endpoint nao retornou agrupamento por agente neste recorte.',
    },
    {
      id: 'telemetry-models',
      label: 'Modelos LLM',
      status:
        byModel.length === 0
          ? 'unknown'
          : summary.totalCostUsd >= 5
            ? 'warning'
            : overallStatus,
      summary: topModel
        ? `${topModel.model} puxa o recorte atual`
        : 'Sem chamadas de modelo no recorte',
      detail: topModel
        ? `${formatCurrency(topModel.totalCostUsd)} e ${formatCompactNumber(topModel.totalTokens)} tokens no modelo lider`
        : 'Nenhum modelo apareceu no agrupamento remoto.',
    },
  ];
}

function buildPerformanceMetrics(summary: NormalizedSummary): ObservabilityMetric[] {
  const timeoutRate = summary.totalRuns > 0 ? summary.timeoutCount / summary.totalRuns : null;

  return [
    metric(
      'avg-duration',
      'Latencia media',
      formatDuration(summary.averageDurationMs),
      summary.totalRuns > 0
        ? 'Media consolidada de execucao no recorte remoto.'
        : 'Sem execucoes para calcular latencia.',
      toneFromThreshold(summary.averageDurationMs, 1200, 2500),
    ),
    metric(
      'p95-duration',
      'P95',
      formatDuration(summary.p95DurationMs),
      summary.totalRuns > 0
        ? 'P95 consolidado para localizar picos de latencia.'
        : 'Sem execucoes para calcular P95.',
      toneFromThreshold(summary.p95DurationMs, 1800, 4000),
    ),
    metric(
      'timeout-count',
      'Timeouts',
      formatCompactNumber(summary.timeoutCount),
      summary.totalRuns > 0
        ? `${formatPercent(timeoutRate)} das execucoes chegaram ao timeout.`
        : 'Sem execucoes no recorte remoto.',
      summary.timeoutCount > 0 ? 'warning' : 'positive',
    ),
    metric(
      'latest-run',
      'Ultima execucao',
      summary.latestRunAt ? formatTimestamp(summary.latestRunAt) : '--',
      summary.oldestRunAt
        ? `Primeira execucao do recorte em ${formatTimestamp(summary.oldestRunAt)}.`
        : 'Sem execucoes no recorte remoto.',
      'neutral',
    ),
  ];
}

function buildVolumeMetrics(summary: NormalizedSummary, daily: NormalizedDailyRow[]): ObservabilityMetric[] {
  const successRate = summary.totalRuns > 0 ? summary.successCount / summary.totalRuns : null;
  const activeDays = daily.filter((item) => item.runCount > 0).length;

  return [
    metric(
      'total-runs',
      'Total de runs',
      formatCompactNumber(summary.totalRuns),
      summary.totalRuns > 0
        ? 'Volume consolidado pelo endpoint remoto.'
        : 'Ainda nao houve execucoes no recorte selecionado.',
      summary.totalRuns > 0 ? 'positive' : 'neutral',
    ),
    metric(
      'success-rate',
      'Taxa de sucesso',
      formatPercent(successRate),
      summary.totalRuns > 0
        ? `${formatCompactNumber(summary.successCount)} runs concluiram com sucesso.`
        : 'Sem volume suficiente para comparar.',
      successRate == null ? 'neutral' : successRate >= 0.95 ? 'positive' : successRate >= 0.85 ? 'warning' : 'critical',
    ),
    metric(
      'error-count',
      'Erros',
      formatCompactNumber(summary.errorCount),
      summary.errorCount > 0
        ? 'Runs que finalizaram com erro no recorte remoto.'
        : 'Nenhum erro registrado no recorte remoto.',
      summary.errorCount > 0 ? 'critical' : 'positive',
    ),
    metric(
      'active-days',
      'Dias ativos',
      formatCompactNumber(activeDays),
      daily.length > 0
        ? `${daily.length} dias vieram no agrupamento diario do endpoint.`
        : 'Sem consolidado diario para exibir.',
      activeDays > 0 ? 'positive' : 'neutral',
    ),
  ];
}

function buildLlmMetrics(summary: NormalizedSummary): ObservabilityMetric[] {
  return [
    metric(
      'total-tokens',
      'Tokens totais',
      summary.totalTokens > 0 ? formatCompactNumber(summary.totalTokens) : '--',
      summary.totalTokens > 0
        ? 'Somatorio de input + output tokens no recorte.'
        : 'Sem tokens registrados no recorte remoto.',
      summary.totalTokens > 0 ? 'positive' : 'neutral',
    ),
    metric(
      'input-tokens',
      'Input tokens',
      summary.inputTokens > 0 ? formatCompactNumber(summary.inputTokens) : '--',
      summary.inputTokens > 0
        ? 'Volume de tokens de entrada enviados aos modelos.'
        : 'Sem tokens de entrada no recorte remoto.',
      'neutral',
    ),
    metric(
      'output-tokens',
      'Output tokens',
      summary.outputTokens > 0 ? formatCompactNumber(summary.outputTokens) : '--',
      summary.outputTokens > 0
        ? 'Volume de tokens gerados pelos modelos.'
        : 'Sem tokens de saida no recorte remoto.',
      'neutral',
    ),
    metric(
      'total-cost',
      'Custo total',
      summary.totalCostUsd > 0 ? formatCurrency(summary.totalCostUsd) : '--',
      summary.totalCostUsd > 0
        ? 'Custo agregado em USD no recorte remoto.'
        : 'Nenhum custo informado pelo endpoint.',
      summary.totalCostUsd > 0 ? 'warning' : 'neutral',
    ),
  ];
}

function buildInsights(
  summary: NormalizedSummary,
  byAgent: NormalizedByAgentRow[],
  byModel: NormalizedByModelRow[],
): ObservabilityInsight[] {
  const items: ObservabilityInsight[] = [];
  const errorRate = summary.totalRuns > 0 ? summary.errorCount / summary.totalRuns : null;
  const topAgent = byAgent[0] ?? null;
  const topModel = byModel[0] ?? null;

  if (summary.totalRuns <= 0) {
    return [
      {
        id: 'telemetry-empty',
        title: 'Sem runs no recorte remoto',
        description: 'A telemetria admin respondeu, mas ainda nao ha execucoes consolidadas para a janela atual.',
        tone: 'neutral',
      },
    ];
  }

  if ((errorRate ?? 0) >= 0.05) {
    items.push({
      id: 'telemetry-errors',
      title: 'Taxa de erro acima do ideal',
      description: `O recorte atual esta em ${formatPercent(errorRate)} de erro agregado.`,
      tone: (errorRate ?? 0) >= 0.12 ? 'critical' : 'warning',
    });
  }

  if (summary.timeoutCount > 0) {
    items.push({
      id: 'telemetry-timeouts',
      title: 'Timeouts detectados',
      description: `${formatCompactNumber(summary.timeoutCount)} execucoes estouraram o timeout no periodo.`,
      tone: summary.timeoutCount >= 3 ? 'critical' : 'warning',
    });
  }

  if ((summary.p95DurationMs ?? 0) >= 1800) {
    items.push({
      id: 'telemetry-latency',
      title: 'P95 pede investigacao',
      description: `O P95 consolidado chegou em ${formatDuration(summary.p95DurationMs)}.`,
      tone: (summary.p95DurationMs ?? 0) >= 4000 ? 'critical' : 'warning',
    });
  }

  if (topAgent) {
    items.push({
      id: 'telemetry-agent',
      title: 'Agente dominante no recorte',
      description: `${topAgent.agent} concentrou ${formatCompactNumber(topAgent.runCount)} execucoes no periodo.`,
      tone: 'neutral',
    });
  }

  if (topModel && topModel.totalCostUsd > 0) {
    items.push({
      id: 'telemetry-model',
      title: 'Modelo com maior custo',
      description: `${topModel.model} acumulou ${formatCurrency(topModel.totalCostUsd)} no recorte atual.`,
      tone: topModel.totalCostUsd >= 3 ? 'warning' : 'neutral',
    });
  }

  if (items.length === 0) {
    items.push({
      id: 'telemetry-stable',
      title: 'Recorte remoto sem alertas fortes',
      description: 'Os sinais agregados estao estaveis para custo, latencia e erro no periodo atual.',
      tone: 'positive',
    });
  }

  return items.slice(0, 5);
}

function buildTopEndpoints(byAgent: NormalizedByAgentRow[]): ObservabilityEndpointRow[] {
  if (byAgent.length === 0) {
    return [emptyRankingRow('agent-empty', 'Sem agentes no recorte', '0 execs', '--')];
  }

  return [...byAgent]
    .sort((left, right) => (right.p95DurationMs ?? 0) - (left.p95DurationMs ?? 0))
    .slice(0, 5)
    .map((item) => ({
      id: `agent-${item.agent}`,
      label: item.agent,
      avgLatency: formatDuration(item.averageDurationMs),
      p95Latency: formatDuration(item.p95DurationMs),
      volume: `${formatCompactNumber(item.runCount)} execs`,
      errors:
        item.timeoutCount > 0
          ? `${formatCompactNumber(item.errorCount)} erros - ${formatCompactNumber(item.timeoutCount)} t/o`
          : `${formatCompactNumber(item.errorCount)} erros`,
    }));
}

function buildModelRows(byModel: NormalizedByModelRow[]): ObservabilityEndpointRow[] {
  if (byModel.length === 0) {
    return [emptyRankingRow('model-empty', 'Sem modelos no recorte', '0 calls', '--')];
  }

  return [...byModel]
    .sort((left, right) => right.totalCostUsd - left.totalCostUsd || right.totalTokens - left.totalTokens)
    .slice(0, 5)
    .map((item) => ({
      id: `model-${item.model}-${item.agent ?? 'all'}`,
      label: item.agent ? `${item.model} (${item.agent})` : item.model,
      avgLatency: formatDuration(item.averageDurationMs),
      p95Latency: formatDuration(item.p95DurationMs),
      volume: `${formatCompactNumber(item.llmCallCount)} calls`,
      errors: `${formatCurrency(item.totalCostUsd)} - ${formatCompactNumber(item.totalTokens)} tok`,
    }));
}

function buildTimeline(daily: NormalizedDailyRow[], periodLabel: string | null): ObservabilityTimelineEvent[] {
  if (daily.length === 0) {
    return [
      {
        id: 'daily-empty',
        timestampLabel: periodLabel ?? 'Recorte atual',
        title: 'Sem execucoes no consolidado diario',
        description: 'O endpoint respondeu sem linhas no agrupamento por dia.',
        tone: 'neutral',
      },
    ];
  }

  return [...daily]
    .sort((left, right) => right.dayUtc.localeCompare(left.dayUtc))
    .slice(0, 7)
    .map((item) => ({
      id: `day-${item.dayUtc}`,
      timestampLabel: formatDateOnly(item.dayUtc) ?? item.dayUtc,
      title: `${formatCompactNumber(item.runCount)} execucoes no dia`,
      description: `${formatCompactNumber(item.successCount)} ok - ${formatCompactNumber(item.errorCount)} erros - P95 ${formatDuration(item.p95DurationMs)}`,
      tone:
        item.errorCount > 0
          ? 'critical'
          : item.timeoutCount > 0 || (item.p95DurationMs ?? 0) >= 1800
            ? 'warning'
            : 'neutral',
    }));
}

function buildMetricsPath(query: AdminTelemetryMetricsQuery): string {
  const params = new URLSearchParams();
  params.set('days', `${normalizeDays(query.days)}`);

  const agent = asTrimmedString(query.agent);
  const model = asTrimmedString(query.model);
  const status = asTrimmedString(query.status);

  if (agent) params.set('agent', agent);
  if (model) params.set('model', model);
  if (status) params.set('status', status);

  return `${METRICS_PATH}?${params.toString()}`;
}

export function buildAdminTelemetryMetricsSnapshotOverrides(
  payload: AdminTelemetryMetricsPayload,
): DeveloperObservabilitySnapshotOverrides {
  const filters = normalizeFilters(payload.filters);
  const summary = normalizeSummary(payload.summary);
  const daily = Array.isArray(payload.daily) ? payload.daily.map(normalizeDailyRow) : [];
  const byAgent = Array.isArray(payload.byAgent) ? payload.byAgent.map(normalizeByAgentRow) : [];
  const byModel = Array.isArray(payload.byModel) ? payload.byModel.map(normalizeByModelRow) : [];
  const generatedAt = new Date().toISOString();
  const periodLabel = buildPeriodLabel(filters);

  return {
    generatedAt,
    generatedAtLabel: formatTimestamp(generatedAt),
    source: 'backend',
    periodLabel,
    scopeLabel: buildScopeLabel(filters),
    services: buildServices(summary, filters, byAgent, byModel),
    performanceMetrics: buildPerformanceMetrics(summary),
    volumeMetrics: buildVolumeMetrics(summary, daily),
    llmMetrics: buildLlmMetrics(summary),
    insights: buildInsights(summary, byAgent, byModel),
    topEndpointsTitle: 'Latencia por agente',
    topEndpoints: buildTopEndpoints(byAgent),
    errorEndpointsTitle: 'Modelos por custo',
    errorEndpoints: buildModelRows(byModel),
    timeline: buildTimeline(daily, periodLabel),
  };
}

export async function getAdminTelemetryMetricsSnapshotOverrides(
  query: AdminTelemetryMetricsQuery = {},
): Promise<DeveloperObservabilitySnapshotOverrides> {
  const headers: Record<string, string> = {};

  if (INTERNAL_ADMIN_API_KEY) {
    headers['X-Internal-Api-Key'] = INTERNAL_ADMIN_API_KEY;
  }

  if (INTERNAL_ADMIN_USER_ID) {
    headers['X-User-Id'] = INTERNAL_ADMIN_USER_ID;
  }

  const data = await apiGetJson<AdminTelemetryMetricsResponse>(
    buildMetricsPath(query),
    Object.keys(headers).length > 0 ? headers : undefined,
  );
  if (!data?.metrics) {
    throw new Error('Resposta invalida do endpoint /internal/admin/telemetry/metrics.');
  }

  return buildAdminTelemetryMetricsSnapshotOverrides(data.metrics);
}
