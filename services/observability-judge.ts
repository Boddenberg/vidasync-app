import {
  INTERNAL_ADMIN_API_KEY,
  INTERNAL_ADMIN_USER_ID,
  SUPABASE_ANON_KEY,
  SUPABASE_JUDGE_FEATURE,
  SUPABASE_JUDGE_LIMIT,
  SUPABASE_JUDGE_TABLE,
  SUPABASE_URL,
} from '@/constants/config';
import { getStoredAccessToken } from '@/hooks/use-auth';
import { apiGetJson } from '@/services/api';
import type {
  DeveloperObservabilitySnapshotOverrides,
  ObservabilityClassification,
  ObservabilityJudgeEvaluation,
  ObservabilityJudgeStatus,
  ObservabilityMetric,
  ObservabilityQualityCriterion,
  ObservabilityTone,
} from '@/types/observability';

type JudgeRow = {
  evaluation_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  feature?: string | null;
  judge_status?: string | null;
  request_id?: string | null;
  conversation_id?: string | null;
  message_id?: string | null;
  user_id?: string | null;
  source_model?: string | null;
  source_duration_ms?: number | string | null;
  intencao?: string | null;
  pipeline?: string | null;
  handler?: string | null;
  judge_model?: string | null;
  judge_duration_ms?: number | string | null;
  judge_overall_score?: number | string | null;
  judge_decision?: string | null;
  judge_summary?: string | null;
  judge_scores?: unknown;
  judge_improvements?: unknown;
  judge_rejection_reasons?: unknown;
  judge_result?: unknown;
  judge_error?: string | null;
};

type JudgeApiMetricsPayload = {
  filters?: Record<string, unknown> | null;
  summary?: Record<string, unknown> | null;
  byFeature?: Array<Record<string, unknown>> | null;
  byPipeline?: Array<Record<string, unknown>> | null;
  byHandler?: Array<Record<string, unknown>> | null;
  byIdioma?: Array<Record<string, unknown>> | null;
  bySourceModel?: Array<Record<string, unknown>> | null;
  daily?: Array<Record<string, unknown>> | null;
  topRejectionReasons?: Array<Record<string, unknown>> | null;
  recentEvaluations?: Array<Record<string, unknown>> | null;
};

type JudgeApiMetricsResponse = {
  metrics?: JudgeApiMetricsPayload | null;
};

type NormalizedJudgeSummary = {
  totalEvaluations: number;
  completedCount: number;
  pendingCount: number;
  failedCount: number;
  approvedCount: number;
  rejectedCount: number;
  completionRatePercent: number | null;
  failureRatePercent: number | null;
  approvalRatePercent: number | null;
  averageOverallScore: number | null;
  averageSourceDurationMs: number | null;
  averageJudgeDurationMs: number | null;
  averageSourceTotalTokens: number | null;
  averageJudgeTotalTokens: number | null;
  latestEvaluationAt: string | null;
  oldestEvaluationAt: string | null;
};

type NormalizedRecentEvaluation = {
  evaluationId: string;
  createdAt: string;
  feature: string;
  judgeStatus: ObservabilityJudgeStatus;
  judgeDecision: ObservabilityClassification;
  judgeOverallScore: number | null;
  idioma: string | null;
  pipeline: string | null;
  handler: string | null;
  sourceModel: string | null;
  sourceDurationMs: number | null;
  judgeDurationMs: number | null;
  sourceTotalTokens: number | null;
  judgeTotalTokens: number | null;
};

type ScoreAccumulator = {
  sum: number;
  count: number;
};

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

const SUPABASE_JUDGE_SELECT = [
  'evaluation_id',
  'created_at',
  'updated_at',
  'feature',
  'judge_status',
  'request_id',
  'conversation_id',
  'message_id',
  'user_id',
  'source_model',
  'source_duration_ms',
  'intencao',
  'pipeline',
  'handler',
  'judge_model',
  'judge_duration_ms',
  'judge_overall_score',
  'judge_decision',
  'judge_summary',
  'judge_scores',
  'judge_improvements',
  'judge_rejection_reasons',
  'judge_result',
  'judge_error',
].join(',');

const JUDGE_METRICS_PATH = '/internal/admin/llm-judge/metrics';
const DEFAULT_JUDGE_DAYS = 7;

function normalizeKey(value: string): string {
  return value.replace(/[^a-z0-9]+/gi, '').toLowerCase();
}

function asTrimmedString(value: unknown): string {
  return `${value ?? ''}`.trim();
}

function parseNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string') return null;
  const match = value.replace(',', '.').match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function normalizeScore(value: unknown): number | null {
  const parsed = parseNumber(value);
  if (parsed == null) return null;
  if (parsed > 1 && parsed <= 100) return parsed / 100;
  return parsed;
}

function formatTimestamp(value: string | null | undefined): string {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return 'Agora';
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

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, item) => sum + item, 0) / values.length;
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

function statusFromValue(value: unknown): ObservabilityJudgeStatus {
  const normalized = normalizeKey(asTrimmedString(value));
  if (normalized === 'pending') return 'pending';
  if (normalized === 'completed') return 'completed';
  if (normalized === 'failed') return 'failed';
  return 'unknown';
}

function statusLabel(status: ObservabilityJudgeStatus): string {
  if (status === 'pending') return 'Pendente';
  if (status === 'completed') return 'Concluido';
  if (status === 'failed') return 'Falhou';
  return 'Sem status';
}

function decisionFromValue(
  value: unknown,
  score: number | null,
  status: ObservabilityJudgeStatus,
): ObservabilityClassification {
  const normalized = normalizeKey(asTrimmedString(value));
  if (['approved', 'approve', 'pass', 'passed', 'ok'].includes(normalized)) return 'approved';
  if (['alert', 'warning', 'review'].includes(normalized)) return 'alert';
  if (['rejected', 'reject', 'fail', 'failed'].includes(normalized)) return 'rejected';
  if (status === 'failed') return 'unknown';
  return classificationFromScore(score);
}

function decisionLabel(decision: ObservabilityClassification): string {
  if (decision === 'approved') return 'Aprovado';
  if (decision === 'alert') return 'Alerta';
  if (decision === 'rejected') return 'Reprovado';
  return 'Sem score';
}

function toneFromDecision(
  decision: ObservabilityClassification,
  status: ObservabilityJudgeStatus,
  score: number | null,
): ObservabilityTone {
  if (status === 'failed') return 'critical';
  if (status === 'pending') return 'neutral';
  if (decision === 'approved') return 'positive';
  if (decision === 'alert') return 'warning';
  if (decision === 'rejected') return 'critical';
  return toneFromScore(score);
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

function parseJsonish(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    return JSON.parse(trimmed);
  } catch {
    return trimmed;
  }
}

function flattenStringList(value: unknown): string[] {
  const parsed = parseJsonish(value);
  if (parsed == null) return [];

  if (typeof parsed === 'string') {
    return parsed
      .split(/\r?\n|;/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (!Array.isArray(parsed)) {
    if (typeof parsed === 'object' && parsed != null) {
      return [JSON.stringify(parsed)];
    }
    const text = asTrimmedString(parsed);
    return text ? [text] : [];
  }

  return parsed
    .map((item) => {
      if (typeof item === 'string') return item.trim();
      if (typeof item === 'object' && item != null) {
        const row = item as Record<string, unknown>;
        return (
          asTrimmedString(row.title) ||
          asTrimmedString(row.message) ||
          asTrimmedString(row.reason) ||
          asTrimmedString(row.description) ||
          JSON.stringify(row)
        );
      }
      return asTrimmedString(item);
    })
    .filter(Boolean);
}

function readScoreMap(value: unknown): Record<string, unknown> | null {
  const parsed = parseJsonish(value);
  return typeof parsed === 'object' && parsed != null && !Array.isArray(parsed)
    ? (parsed as Record<string, unknown>)
    : null;
}

function extractCriterionScore(scoreMap: Record<string, unknown>, names: string[]): number | null {
  const normalizedNames = names.map(normalizeKey);

  for (const [key, value] of Object.entries(scoreMap)) {
    if (normalizedNames.includes(normalizeKey(key))) {
      return normalizeScore(value);
    }

    if (typeof value === 'object' && value != null && !Array.isArray(value)) {
      const nested = extractCriterionScore(value as Record<string, unknown>, names);
      if (nested != null) return nested;
    }
  }

  return null;
}

function emptyQualityCriteria(): ObservabilityQualityCriterion[] {
  return QUALITY_CRITERIA.map((criterion) => ({
    id: criterion.id,
    label: criterion.label,
    value: '--',
    classification: 'unknown',
  }));
}

function normalizeJudgeRow(row: JudgeRow, index: number): ObservabilityJudgeEvaluation {
  const createdAt = asTrimmedString(row.created_at) || new Date().toISOString();
  const updatedAt = asTrimmedString(row.updated_at) || createdAt;
  const status = statusFromValue(row.judge_status);
  const score = normalizeScore(row.judge_overall_score);
  const decision = decisionFromValue(row.judge_decision, score, status);
  const sourceDurationMs = parseNumber(row.source_duration_ms);
  const judgeDurationMs = parseNumber(row.judge_duration_ms);
  const improvements = flattenStringList(row.judge_improvements);
  const rejectionReasons = flattenStringList(row.judge_rejection_reasons);
  const summary =
    asTrimmedString(row.judge_summary) ||
    asTrimmedString(row.judge_error) ||
    (status === 'pending'
      ? 'Avaliacao agendada e aguardando processamento.'
      : status === 'failed'
        ? 'A avaliacao falhou antes de produzir um resumo.'
        : 'Sem resumo informado pelo judge.');

  return {
    id: asTrimmedString(row.evaluation_id) || `judge-evaluation-${index + 1}`,
    createdAt,
    createdAtLabel: formatTimestamp(createdAt),
    updatedAtLabel: formatTimestamp(updatedAt),
    feature: asTrimmedString(row.feature) || SUPABASE_JUDGE_FEATURE || 'chat',
    status,
    statusLabel: statusLabel(status),
    decision,
    decisionLabel: decisionLabel(decision),
    tone: toneFromDecision(decision, status, score),
    score: score != null ? formatPercent(score) : '--',
    summary,
    pipeline: asTrimmedString(row.pipeline) || asTrimmedString(row.intencao) || 'Nao informado',
    handler: asTrimmedString(row.handler) || 'Nao informado',
    requestId: asTrimmedString(row.request_id) || '--',
    conversationId: asTrimmedString(row.conversation_id) || '--',
    messageId: asTrimmedString(row.message_id) || '--',
    userId: asTrimmedString(row.user_id) || '--',
    sourceModel: asTrimmedString(row.source_model) || '--',
    judgeModel: asTrimmedString(row.judge_model) || '--',
    sourceDuration: formatDuration(sourceDurationMs),
    judgeDuration: formatDuration(judgeDurationMs),
    improvements,
    rejectionReasons,
    error: asTrimmedString(row.judge_error) || null,
  };
}

function buildJudgeCriteria(rows: JudgeRow[]): ObservabilityQualityCriterion[] {
  const totals = new Map<string, ScoreAccumulator>();
  QUALITY_CRITERIA.forEach((criterion) => totals.set(criterion.id, { sum: 0, count: 0 }));

  rows.forEach((row) => {
    const scoreMap = readScoreMap(row.judge_scores) ?? readScoreMap(row.judge_result);
    if (!scoreMap) return;

    QUALITY_CRITERIA.forEach((criterion) => {
      const score = extractCriterionScore(scoreMap, [criterion.id]);
      if (score == null) return;
      const current = totals.get(criterion.id);
      if (!current) return;
      current.sum += score;
      current.count += 1;
    });
  });

  return QUALITY_CRITERIA.map((criterion) => {
    const total = totals.get(criterion.id);
    const score = total && total.count > 0 ? total.sum / total.count : null;
    return {
      id: criterion.id,
      label: criterion.label,
      value: score != null ? formatPercent(score) : '--',
      classification: classificationFromScore(score),
    };
  });
}

function buildJudgeMetricsFromRows(rows: JudgeRow[]): Pick<
  DeveloperObservabilitySnapshotOverrides,
  'judgeMetrics' | 'qualityMetrics' | 'qualityCriteria' | 'judgeEvaluations'
> {
  const normalizedRows = rows.map(normalizeJudgeRow);
  const totalRows = rows.length;
  const pendingCount = normalizedRows.filter((row) => row.status === 'pending').length;
  const failedCount = normalizedRows.filter((row) => row.status === 'failed').length;
  const completedRows = normalizedRows.filter((row) => row.status === 'completed');
  const approvedCount = completedRows.filter((row) => row.decision === 'approved').length;
  const rejectedCount = completedRows.filter((row) => row.decision === 'rejected').length;
  const scoredRows = normalizedRows.filter((row) => row.score !== '--');
  const averageScore =
    scoredRows.length > 0
      ? average(
          scoredRows.map((row) => {
            const parsed = parseNumber(row.score);
            return parsed == null ? 0 : parsed / 100;
          }),
        )
      : null;
  const approvalRate = completedRows.length > 0 ? approvedCount / completedRows.length : null;
  const judgeDurations = rows
    .map((row) => parseNumber(row.judge_duration_ms))
    .filter((value): value is number => value != null);
  const averageJudgeDuration = average(judgeDurations);

  return {
    judgeMetrics: [
      metric(
        'judge-total',
        'Avaliacoes',
        formatCompactNumber(totalRows),
        `Leitura das ultimas ${totalRows} linhas disponiveis do judge.`,
        totalRows > 0 ? 'positive' : 'neutral',
      ),
      metric(
        'judge-pending',
        'Pendentes',
        formatCompactNumber(pendingCount),
        pendingCount > 0
          ? 'Aguardando finalizacao do processamento assincrono.'
          : 'Fila do judge sem pendencias agora.',
        pendingCount > 0 ? 'warning' : 'positive',
      ),
      metric(
        'judge-failed',
        'Falhas',
        formatCompactNumber(failedCount),
        failedCount > 0
          ? 'Avaliacoes que falharam antes de concluir.'
          : 'Nenhuma falha do judge no recorte atual.',
        failedCount > 0 ? 'critical' : 'positive',
      ),
      metric(
        'judge-latency',
        'Tempo medio',
        formatDuration(averageJudgeDuration),
        averageJudgeDuration != null
          ? 'Tempo medio do processamento do judge.'
          : 'Sem duracao suficiente para consolidar ainda.',
        averageJudgeDuration == null
          ? 'neutral'
          : averageJudgeDuration >= 5000
            ? 'warning'
            : 'positive',
      ),
    ],
    qualityMetrics: [
      metric(
        'overall-score',
        'Score geral',
        averageScore != null ? formatPercent(averageScore) : '--',
        averageScore != null
          ? 'Media consolidada das avaliacoes do judge.'
          : 'Sem scores finalizados no banco ainda.',
        toneFromScore(averageScore),
      ),
      metric(
        'approval-rate',
        'Taxa de aprovacao',
        approvalRate != null ? formatPercent(approvalRate) : '--',
        approvalRate != null
          ? 'Share de respostas aprovadas entre os jobs concluidos.'
          : 'Sem jobs concluidos o suficiente para calcular.',
        toneFromScore(approvalRate),
      ),
      metric(
        'approved-count',
        'Aprovado',
        formatCompactNumber(approvedCount),
        'Total de respostas aprovadas no recorte atual.',
        approvedCount > 0 ? 'positive' : 'neutral',
      ),
      metric(
        'rejected-count',
        'Reprovado',
        formatCompactNumber(rejectedCount),
        'Total de respostas reprovadas pelo judge.',
        rejectedCount > 0 ? 'critical' : 'neutral',
      ),
    ],
    qualityCriteria: buildJudgeCriteria(rows),
    judgeEvaluations: normalizedRows,
  };
}

function normalizeJudgeSummary(value: Record<string, unknown> | null | undefined): NormalizedJudgeSummary {
  return {
    totalEvaluations: parseNumber(value?.totalEvaluations) ?? 0,
    completedCount: parseNumber(value?.completedCount) ?? 0,
    pendingCount: parseNumber(value?.pendingCount) ?? 0,
    failedCount: parseNumber(value?.failedCount) ?? 0,
    approvedCount: parseNumber(value?.approvedCount) ?? 0,
    rejectedCount: parseNumber(value?.rejectedCount) ?? 0,
    completionRatePercent: parseNumber(value?.completionRatePercent),
    failureRatePercent: parseNumber(value?.failureRatePercent),
    approvalRatePercent: parseNumber(value?.approvalRatePercent),
    averageOverallScore: normalizeScore(value?.averageOverallScore),
    averageSourceDurationMs: parseNumber(value?.averageSourceDurationMs),
    averageJudgeDurationMs: parseNumber(value?.averageJudgeDurationMs),
    averageSourceTotalTokens: parseNumber(value?.averageSourceTotalTokens),
    averageJudgeTotalTokens: parseNumber(value?.averageJudgeTotalTokens),
    latestEvaluationAt: asTrimmedString(value?.latestEvaluationAt) || null,
    oldestEvaluationAt: asTrimmedString(value?.oldestEvaluationAt) || null,
  };
}

function normalizeRecentEvaluation(value: Record<string, unknown>, index: number): NormalizedRecentEvaluation {
  const score = normalizeScore(value.judgeOverallScore);
  const status = statusFromValue(value.judgeStatus);

  return {
    evaluationId: asTrimmedString(value.evaluationId) || `judge-metric-eval-${index + 1}`,
    createdAt: asTrimmedString(value.createdAt) || new Date().toISOString(),
    feature: asTrimmedString(value.feature) || 'chat',
    judgeStatus: status,
    judgeDecision: decisionFromValue(value.judgeDecision, score, status),
    judgeOverallScore: score,
    idioma: asTrimmedString(value.idioma) || null,
    pipeline: asTrimmedString(value.pipeline) || null,
    handler: asTrimmedString(value.handler) || null,
    sourceModel: asTrimmedString(value.sourceModel) || null,
    sourceDurationMs: parseNumber(value.sourceDurationMs),
    judgeDurationMs: parseNumber(value.judgeDurationMs),
    sourceTotalTokens: parseNumber(value.sourceTotalTokens),
    judgeTotalTokens: parseNumber(value.judgeTotalTokens),
  };
}

function buildApiEvaluationSummary(value: NormalizedRecentEvaluation): string {
  if (value.judgeStatus === 'pending') {
    return 'Avaliacao agendada e aguardando processamento.';
  }

  if (value.judgeStatus === 'failed') {
    return 'A avaliacao falhou antes de produzir detalhes adicionais.';
  }

  if (value.judgeDecision === 'approved') {
    return 'Avaliacao concluida e aprovada pelo judge.';
  }

  if (value.judgeDecision === 'rejected') {
    return 'Avaliacao concluida e reprovada pelo judge.';
  }

  if (value.judgeDecision === 'alert') {
    return 'Avaliacao concluida com alerta do judge.';
  }

  return 'Avaliacao concluida sem detalhes adicionais.';
}

function normalizeApiEvaluations(
  rows: Array<Record<string, unknown>> | null | undefined,
): ObservabilityJudgeEvaluation[] {
  if (!Array.isArray(rows)) return [];

  return rows.map((row, index) => {
    const value = normalizeRecentEvaluation(row, index);
    const pipeline =
      value.pipeline && value.idioma ? `${value.pipeline} - ${value.idioma}` : value.pipeline ?? 'Nao informado';

    return {
      id: value.evaluationId,
      createdAt: value.createdAt,
      createdAtLabel: formatTimestamp(value.createdAt),
      updatedAtLabel: formatTimestamp(value.createdAt),
      feature: value.feature,
      status: value.judgeStatus,
      statusLabel: statusLabel(value.judgeStatus),
      decision: value.judgeDecision,
      decisionLabel: decisionLabel(value.judgeDecision),
      tone: toneFromDecision(value.judgeDecision, value.judgeStatus, value.judgeOverallScore),
      score: value.judgeOverallScore != null ? formatPercent(value.judgeOverallScore) : '--',
      summary: buildApiEvaluationSummary(value),
      pipeline,
      handler: value.handler ?? 'Nao informado',
      requestId: '--',
      conversationId: '--',
      messageId: '--',
      userId: '--',
      sourceModel: value.sourceModel ?? '--',
      judgeModel: '--',
      sourceDuration: formatDuration(value.sourceDurationMs),
      judgeDuration: formatDuration(value.judgeDurationMs),
      improvements: [],
      rejectionReasons: [],
      error: value.judgeStatus === 'failed' ? 'Falha registrada pelo judge.' : null,
    };
  });
}

function buildJudgeMetricsFromApi(
  payload: JudgeApiMetricsPayload,
): Pick<DeveloperObservabilitySnapshotOverrides, 'judgeMetrics' | 'qualityMetrics' | 'qualityCriteria' | 'judgeEvaluations'> {
  const summary = normalizeJudgeSummary(payload.summary);

  return {
    judgeMetrics: [
      metric(
        'judge-total',
        'Avaliacoes',
        formatCompactNumber(summary.totalEvaluations),
        summary.totalEvaluations > 0
          ? 'Volume consolidado pelo endpoint interno do judge.'
          : 'Sem avaliacoes no recorte remoto atual.',
        summary.totalEvaluations > 0 ? 'positive' : 'neutral',
      ),
      metric(
        'judge-pending',
        'Pendentes',
        formatCompactNumber(summary.pendingCount),
        summary.pendingCount > 0
          ? 'Avaliacoes aguardando processamento do judge.'
          : 'Nenhuma avaliacao pendente no recorte atual.',
        summary.pendingCount > 0 ? 'warning' : 'positive',
      ),
      metric(
        'judge-failed',
        'Falhas',
        formatCompactNumber(summary.failedCount),
        summary.failedCount > 0
          ? `${formatPercent(summary.failureRatePercent)} de falha no recorte atual.`
          : 'Nenhuma falha do judge no recorte atual.',
        summary.failedCount > 0 ? 'critical' : 'positive',
      ),
      metric(
        'judge-latency',
        'Tempo medio',
        formatDuration(summary.averageJudgeDurationMs),
        summary.averageSourceDurationMs != null
          ? `Fonte ${formatDuration(summary.averageSourceDurationMs)} e judge ${formatDuration(summary.averageJudgeDurationMs)}.`
          : 'Sem duracao suficiente para consolidar ainda.',
        summary.averageJudgeDurationMs == null
          ? 'neutral'
          : summary.averageJudgeDurationMs >= 1000
            ? 'warning'
            : 'positive',
      ),
    ],
    qualityMetrics: [
      metric(
        'overall-score',
        'Score geral',
        summary.averageOverallScore != null ? formatPercent(summary.averageOverallScore) : '--',
        summary.averageOverallScore != null
          ? 'Score medio consolidado pelo endpoint remoto.'
          : 'Sem score medio disponivel no recorte atual.',
        toneFromScore(summary.averageOverallScore),
      ),
      metric(
        'approval-rate',
        'Taxa de aprovacao',
        summary.approvalRatePercent != null ? formatPercent(summary.approvalRatePercent) : '--',
        summary.approvalRatePercent != null
          ? `${formatCompactNumber(summary.approvedCount)} aprovadas e ${formatCompactNumber(summary.rejectedCount)} reprovadas.`
          : 'Sem aprovacoes suficientes para calcular.',
        summary.approvalRatePercent == null
          ? 'neutral'
          : summary.approvalRatePercent >= 80
            ? 'positive'
            : summary.approvalRatePercent >= 60
              ? 'warning'
              : 'critical',
      ),
      metric(
        'approved-count',
        'Aprovado',
        formatCompactNumber(summary.approvedCount),
        'Total aprovado no recorte do endpoint interno.',
        summary.approvedCount > 0 ? 'positive' : 'neutral',
      ),
      metric(
        'rejected-count',
        'Reprovado',
        formatCompactNumber(summary.rejectedCount),
        'Total reprovado no recorte do endpoint interno.',
        summary.rejectedCount > 0 ? 'critical' : 'neutral',
      ),
    ],
    qualityCriteria: emptyQualityCriteria(),
    judgeEvaluations: normalizeApiEvaluations(payload.recentEvaluations),
  };
}

function buildJudgeMetricsPath(): string {
  const params = new URLSearchParams();
  params.set('days', `${DEFAULT_JUDGE_DAYS}`);

  return `${JUDGE_METRICS_PATH}?${params.toString()}`;
}

async function fetchJudgeApiMetrics(): Promise<JudgeApiMetricsPayload | null> {
  const headers: Record<string, string> = {};

  if (INTERNAL_ADMIN_API_KEY) {
    headers['X-Internal-Api-Key'] = INTERNAL_ADMIN_API_KEY;
  }

  if (INTERNAL_ADMIN_USER_ID) {
    headers['X-User-Id'] = INTERNAL_ADMIN_USER_ID;
  }

  const data = await apiGetJson<JudgeApiMetricsResponse>(
    buildJudgeMetricsPath(),
    Object.keys(headers).length > 0 ? headers : undefined,
  );
  if (!data?.metrics) {
    throw new Error('Resposta invalida do endpoint /internal/admin/llm-judge/metrics.');
  }

  return data.metrics;
}

async function fetchJudgeRows(): Promise<JudgeRow[] | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;

  const url = new URL(`${SUPABASE_URL}/rest/v1/${SUPABASE_JUDGE_TABLE}`);
  url.searchParams.set('select', SUPABASE_JUDGE_SELECT);
  if (SUPABASE_JUDGE_FEATURE) {
    url.searchParams.set('feature', `eq.${SUPABASE_JUDGE_FEATURE}`);
  }
  url.searchParams.set('order', 'created_at.desc');
  url.searchParams.set('limit', `${SUPABASE_JUDGE_LIMIT}`);

  const accessToken = asTrimmedString(await getStoredAccessToken());
  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Supabase judge query failed with status ${response.status}.`);
  }

  const payload = await response.json();
  return Array.isArray(payload) ? (payload as JudgeRow[]) : [];
}

export async function getDeveloperJudgeSnapshotOverrides(): Promise<DeveloperObservabilitySnapshotOverrides | null> {
  const [apiResult, rowsResult] = await Promise.allSettled([
    fetchJudgeApiMetrics(),
    fetchJudgeRows(),
  ]);

  const apiPayload = apiResult.status === 'fulfilled' ? apiResult.value : null;
  const rows = rowsResult.status === 'fulfilled' ? rowsResult.value : null;

  const apiSnapshot = apiPayload ? buildJudgeMetricsFromApi(apiPayload) : null;
  const rowSnapshot = rows?.length ? buildJudgeMetricsFromRows(rows) : null;

  if (!apiSnapshot && !rowSnapshot) {
    if (apiResult.status === 'rejected') throw apiResult.reason;
    if (rowsResult.status === 'rejected') throw rowsResult.reason;
    return null;
  }

  if (!apiSnapshot) {
    return rowSnapshot;
  }

  if (!rowSnapshot) {
    return apiSnapshot;
  }

  return {
    ...apiSnapshot,
    qualityCriteria: rowSnapshot.qualityCriteria,
    judgeEvaluations: rowSnapshot.judgeEvaluations,
  };
}
