import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Brand, Radii, Shadows, Typography } from '@/constants/theme';
import { ExecutiveSummaryPanel } from '@/features/devtools/executive-summary-panel';
import { NetworkDiagnosticsSection } from '@/features/devtools/network-diagnostics-section';
import { ObservabilityTabs } from '@/features/devtools/observability-tabs';
import type { AdminTelemetryMetricsQuery } from '@/services/admin-telemetry';
import {
  buildDeveloperObservabilitySnapshot,
  type DeveloperObservabilityQuery,
  getDeveloperObservabilitySnapshotOverrides,
  mergeDeveloperObservabilitySnapshot,
} from '@/services/observability';
import {
  buildObservabilityExecutiveSummary,
  type ObservabilityDashboardTab,
  type ObservabilityExecutiveTarget,
} from '@/services/observability-summary';
import type { NetworkInspectorLog } from '@/services/network-inspector';
import type {
  ObservabilityClassification,
  ObservabilityJudgeEvaluation,
  ObservabilityMetric,
  ObservabilityRecentRun,
  ObservabilityService,
  ObservabilityTimelineEvent,
  ObservabilityTone,
} from '@/types/observability';

type Props = {
  logs: NetworkInspectorLog[];
  enabled: boolean;
  initialMode?: 'logs' | null;
  onToggleEnabled: () => void;
  onClearLogs: () => void;
};

type QualityFilterState = {
  feature: string | null;
  status: ObservabilityJudgeEvaluation['status'] | null;
  decision: ObservabilityClassification | null;
};

type SummaryHighlight = {
  id: string;
  title: string;
  value: string;
  description: string;
  tone: ObservabilityTone;
};

type QuickSearchChip = {
  id: string;
  label: string;
  value: string;
};

const DASHBOARD_TABS: Array<{
  id: ObservabilityDashboardTab;
  label: string;
  description: string;
}> = [
  { id: 'overview', label: 'Resumo', description: 'Diagnostico executivo e sinais principais.' },
  { id: 'failures', label: 'Falhas', description: 'Latencia, erros e agrupamentos.' },
  { id: 'quality', label: 'Qualidade', description: 'Judge, score e criterios.' },
  { id: 'investigation', label: 'Investigacao', description: 'Runs, timeline e logs brutos.' },
];
const TELEMETRY_DAY_OPTIONS = [7, 14, 30] as const;
const TELEMETRY_STATUS_OPTIONS: Array<{ label: string; value: string | null }> = [
  { label: 'Todos', value: null },
  { label: 'Sucesso', value: 'success' },
  { label: 'Erro', value: 'error' },
  { label: 'Timeout', value: 'timeout' },
];
const QUALITY_STATUS_OPTIONS: Array<{
  label: string;
  value: ObservabilityJudgeEvaluation['status'] | null;
}> = [
  { label: 'Todos', value: null },
  { label: 'Concluido', value: 'completed' },
  { label: 'Falhou', value: 'failed' },
  { label: 'Pendente', value: 'pending' },
];
const QUALITY_DECISION_OPTIONS: Array<{
  label: string;
  value: ObservabilityClassification | null;
}> = [
  { label: 'Todos', value: null },
  { label: 'Aprovado', value: 'approved' },
  { label: 'Alerta', value: 'alert' },
  { label: 'Reprovado', value: 'rejected' },
];

function normalizeToken(value: string | null | undefined): string {
  return `${value ?? ''}`.trim().toLowerCase();
}

function isPlaceholder(value: string | null | undefined): boolean {
  const normalized = normalizeToken(value);
  return (
    !normalized ||
    normalized === '--' ||
    normalized.startsWith('sem ') ||
    normalized.includes('desconhecido') ||
    normalized === 'nao informado'
  );
}

function humanizeToken(value: string): string {
  if (/[0-9./]/.test(value)) return value;
  return value
    .split(/[-_/\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function buildStringOptions(values: Array<string | null | undefined>, fallbackLabel: string) {
  const unique = Array.from(
    new Set(
      values
        .map((value) => `${value ?? ''}`.trim())
        .filter((value) => !isPlaceholder(value)),
    ),
  );

  return [{ label: fallbackLabel, value: null }, ...unique.map((value) => ({ label: humanizeToken(value), value }))];
}

function parseModelLabel(label: string | null | undefined): string | null {
  const normalized = `${label ?? ''}`.trim();
  if (isPlaceholder(normalized)) return null;
  return normalized.replace(/\s+\([^)]*\)\s*$/, '').trim() || null;
}

function parsePercentValue(value: string | null | undefined): number | null {
  const normalized = `${value ?? ''}`.trim();
  if (!normalized || normalized === '--') return null;
  const match = normalized.match(/-?\d+([.,]\d+)?/);
  if (!match) return null;
  const parsed = Number(match[0].replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function matchesSearch(values: Array<string | null | undefined>, query: string): boolean {
  const normalizedQuery = normalizeToken(query);
  if (!normalizedQuery) return true;

  return values.some((value) => normalizeToken(value).includes(normalizedQuery));
}

function toneColors(tone: ObservabilityTone) {
  if (tone === 'positive') return { bg: '#EAF8EE', border: '#C8E7D2', text: Brand.greenDark };
  if (tone === 'warning') return { bg: '#FFF3E3', border: '#F3D2A8', text: '#B96B00' };
  if (tone === 'critical') return { bg: '#FDE7E7', border: '#F5C2C2', text: Brand.danger };
  return { bg: Brand.bg, border: Brand.border, text: Brand.textSecondary };
}

function classificationColors(classification: ObservabilityClassification) {
  if (classification === 'approved') return { bg: '#EAF8EE', border: '#C8E7D2', text: Brand.greenDark };
  if (classification === 'alert') return { bg: '#FFF3E3', border: '#F3D2A8', text: '#B96B00' };
  if (classification === 'rejected') return { bg: '#FDE7E7', border: '#F5C2C2', text: Brand.danger };
  return { bg: Brand.bg, border: Brand.border, text: Brand.textSecondary };
}

function judgeStatusColors(status: ObservabilityJudgeEvaluation['status']) {
  if (status === 'completed') return { bg: '#EAF8EE', border: '#C8E7D2', text: Brand.greenDark };
  if (status === 'failed') return { bg: '#FDE7E7', border: '#F5C2C2', text: Brand.danger };
  if (status === 'pending') return { bg: '#FFF3E3', border: '#F3D2A8', text: '#B96B00' };
  return { bg: Brand.bg, border: Brand.border, text: Brand.textSecondary };
}

function runStatusColors(status: ObservabilityRecentRun['status']) {
  if (status === 'success') return { bg: '#EAF8EE', border: '#C8E7D2', text: Brand.greenDark };
  if (status === 'timeout') return { bg: '#FFF3E3', border: '#F3D2A8', text: '#B96B00' };
  if (status === 'error') return { bg: '#FDE7E7', border: '#F5C2C2', text: Brand.danger };
  return { bg: Brand.bg, border: Brand.border, text: Brand.textSecondary };
}

function sourceLabel(source: 'fallback' | 'hybrid' | 'backend') {
  if (source === 'backend') return 'Backend';
  if (source === 'hybrid') return 'Hibrido';
  return 'Sessao local';
}

function syncErrorMessage(error: unknown): string {
  const fallback = 'Fontes remotas indisponiveis. Exibindo a telemetria local da sessao.';
  if (!(error instanceof Error)) return fallback;

  const normalized = error.message.toLowerCase();
  if (
    normalized.includes('404') ||
    normalized.includes('not found') ||
    normalized.includes('nao localizado') ||
    normalized.includes('não localizado')
  ) {
    return 'O host configurado ainda nao expoe as rotas remotas de observabilidade. Exibindo a telemetria local da sessao.';
  }

  return error.message || fallback;
}

export function DeveloperObservabilityDashboard({
  logs,
  enabled,
  initialMode,
  onToggleEnabled,
  onClearLogs,
}: Props) {
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ObservabilityDashboardTab>(
    initialMode === 'logs' ? 'investigation' : 'overview',
  );
  const [telemetryFilters, setTelemetryFilters] = useState<AdminTelemetryMetricsQuery>({
    days: 7,
    agent: 'chat',
    model: null,
    status: null,
  });
  const [qualityFilters, setQualityFilters] = useState<QualityFilterState>({
    feature: 'chat',
    status: null,
    decision: null,
  });
  const [investigationSearch, setInvestigationSearch] = useState('');
  const [remoteSnapshot, setRemoteSnapshot] = useState<Awaited<
    ReturnType<typeof getDeveloperObservabilitySnapshotOverrides>
  > | null>(null);
  const refreshRequestId = useRef(0);

  const fallbackSnapshot = useMemo(() => buildDeveloperObservabilitySnapshot(logs), [logs]);
  const remoteQuery = useMemo<DeveloperObservabilityQuery>(
    () => ({
      ...telemetryFilters,
      feature: qualityFilters.feature ?? telemetryFilters.agent ?? null,
    }),
    [qualityFilters.feature, telemetryFilters],
  );
  const snapshot = useMemo(
    () => mergeDeveloperObservabilitySnapshot(fallbackSnapshot, remoteSnapshot),
    [fallbackSnapshot, remoteSnapshot],
  );
  const executiveSummary = useMemo(
    () => buildObservabilityExecutiveSummary(snapshot),
    [snapshot],
  );
  const telemetryAgentOptions = useMemo(
    () =>
      buildStringOptions(
        ['chat', telemetryFilters.agent, ...snapshot.recentRuns.map((item) => item.agent)],
        'Todos',
      ),
    [snapshot.recentRuns, telemetryFilters.agent],
  );
  const telemetryModelOptions = useMemo(
    () =>
      buildStringOptions(
        [
          telemetryFilters.model,
          ...snapshot.errorEndpoints.map((item) => parseModelLabel(item.label)),
          ...snapshot.judgeEvaluations.map((item) => item.sourceModel),
        ],
        'Todos',
      ),
    [snapshot.errorEndpoints, snapshot.judgeEvaluations, telemetryFilters.model],
  );
  const qualityFeatureOptions = useMemo(
    () =>
      buildStringOptions(
        [qualityFilters.feature, telemetryFilters.agent, ...snapshot.judgeEvaluations.map((item) => item.feature)],
        'Todas',
      ),
    [qualityFilters.feature, snapshot.judgeEvaluations, telemetryFilters.agent],
  );
  const overviewMetrics = useMemo(
    () => [
      ...snapshot.volumeMetrics.slice(0, 2),
      ...snapshot.performanceMetrics.slice(0, 2),
      ...snapshot.qualityMetrics.slice(0, 2),
    ],
    [snapshot.performanceMetrics, snapshot.qualityMetrics, snapshot.volumeMetrics],
  );
  const heroMetaItems = useMemo(
    () =>
      [
        { label: 'Fonte', value: sourceLabel(snapshot.source) },
        { label: 'Atualizado', value: snapshot.generatedAtLabel },
        snapshot.periodLabel ? { label: 'Periodo', value: snapshot.periodLabel } : null,
        snapshot.scopeLabel ? { label: 'Escopo', value: snapshot.scopeLabel } : null,
      ].filter(Boolean) as Array<{ label: string; value: string }>,
    [snapshot.generatedAtLabel, snapshot.periodLabel, snapshot.scopeLabel, snapshot.source],
  );
  const filteredJudgeEvaluations = useMemo(
    () =>
      snapshot.judgeEvaluations.filter((evaluation) => {
        if (qualityFilters.feature && evaluation.feature !== qualityFilters.feature) return false;
        if (qualityFilters.status && evaluation.status !== qualityFilters.status) return false;
        if (qualityFilters.decision && evaluation.decision !== qualityFilters.decision) return false;
        return true;
      }),
    [qualityFilters.decision, qualityFilters.feature, qualityFilters.status, snapshot.judgeEvaluations],
  );
  const investigationSearchSuggestions = useMemo<QuickSearchChip[]>(() => {
    const items: QuickSearchChip[] = [];
    const recentRun = snapshot.recentRuns.find((item) => item.status !== 'success') ?? snapshot.recentRuns[0];

    if (recentRun?.requestPath && recentRun.requestPath !== '--') {
      items.push({ id: 'path', label: 'Path', value: recentRun.requestPath });
    }
    if (recentRun?.traceId && recentRun.traceId !== '--') {
      items.push({ id: 'trace', label: 'Trace', value: recentRun.traceId });
    }
    if (recentRun?.requestId && recentRun.requestId !== '--') {
      items.push({ id: 'request', label: 'Request', value: recentRun.requestId });
    }
    const recentJudge = snapshot.judgeEvaluations.find((item) => item.requestId !== '--');
    if (recentJudge?.requestId && recentJudge.requestId !== '--') {
      items.push({ id: 'judge-request', label: 'Judge', value: recentJudge.requestId });
    }

    return items.slice(0, 4);
  }, [snapshot.judgeEvaluations, snapshot.recentRuns]);
  const filteredRuns = useMemo(
    () =>
      snapshot.recentRuns.filter((run) =>
        matchesSearch(
          [run.runId, run.requestId, run.traceId, run.requestPath, run.endpoint, run.errorMessage, run.agent],
          investigationSearch,
        ),
      ),
    [investigationSearch, snapshot.recentRuns],
  );
  const filteredTimeline = useMemo(
    () =>
      snapshot.timeline.filter((event) =>
        matchesSearch([event.title, event.description, event.timestampLabel], investigationSearch),
      ),
    [investigationSearch, snapshot.timeline],
  );
  const filteredLogs = useMemo(
    () =>
      logs.filter((log) =>
        matchesSearch(
          [log.id, log.url, log.method, `${log.statusCode ?? ''}`, log.error, log.requestBody, log.responseBody],
          investigationSearch,
        ),
      ),
    [investigationSearch, logs],
  );
  const failureHighlights = useMemo<SummaryHighlight[]>(() => {
    const failingRuns = snapshot.recentRuns.filter((item) => item.status !== 'success');
    const leadFinding =
      executiveSummary.primaryFinding?.tab === 'failures' || executiveSummary.primaryFinding?.tab === 'investigation'
        ? executiveSummary.primaryFinding
        : null;
    const slowest = snapshot.topEndpoints[0];
    const failureRun = failingRuns[0];

    return [
      {
        id: 'dominant-issue',
        title: 'Sintoma dominante',
        value: leadFinding?.title ?? 'Sem alerta forte',
        description: executiveSummary.impactSummary,
        tone: leadFinding?.tone ?? 'neutral',
      },
      {
        id: 'slowest',
        title: 'Recorte mais lento',
        value: slowest?.label ?? 'Sem ranking',
        description:
          slowest && !isPlaceholder(slowest.label)
            ? `Avg ${slowest.avgLatency} e P95 ${slowest.p95Latency} no agrupamento lider.`
            : 'Ainda nao ha agrupamento suficiente para apontar um lider de latencia.',
        tone: executiveSummary.primaryFinding?.id === 'latency' ? 'critical' : 'warning',
      },
      {
        id: 'recent-failures',
        title: 'Runs com falha',
        value: `${failingRuns.length}`,
        description:
          failureRun && failureRun.requestPath !== '--'
            ? `${failureRun.statusLabel} recente em ${failureRun.requestPath}.`
            : 'Sem runs recentes com erro ou timeout no recorte atual.',
        tone: failingRuns.length > 0 ? (failureRun?.status === 'error' ? 'critical' : 'warning') : 'positive',
      },
    ];
  }, [executiveSummary.impactSummary, executiveSummary.primaryFinding, snapshot.recentRuns, snapshot.topEndpoints]);
  const qualityHighlights = useMemo<SummaryHighlight[]>(() => {
    const weakestCriterion = [...snapshot.qualityCriteria]
      .map((criterion) => ({ criterion, score: parsePercentValue(criterion.value) }))
      .filter((item) => item.score != null)
      .sort((left, right) => (left.score ?? 0) - (right.score ?? 0))[0]?.criterion;
    const rejectionCounts = new Map<string, number>();
    const featureCounts = new Map<string, number>();

    for (const evaluation of filteredJudgeEvaluations) {
      if (evaluation.decision === 'rejected' || evaluation.status === 'failed') {
        featureCounts.set(evaluation.feature, (featureCounts.get(evaluation.feature) ?? 0) + 1);
      }
      for (const reason of evaluation.rejectionReasons) {
        rejectionCounts.set(reason, (rejectionCounts.get(reason) ?? 0) + 1);
      }
    }

    const topRejectionReason =
      [...rejectionCounts.entries()].sort((left, right) => right[1] - left[1])[0] ?? null;
    const topRejectedFeature =
      [...featureCounts.entries()].sort((left, right) => right[1] - left[1])[0] ?? null;
    const failedCount = filteredJudgeEvaluations.filter((item) => item.status === 'failed').length;

    return [
      {
        id: 'quality-criterion',
        title: 'Criterio mais fraco',
        value: weakestCriterion?.label ?? 'Sem score',
        description:
          weakestCriterion != null
            ? `${weakestCriterion.value} no recorte atual.`
            : 'Os criterios ainda nao trouxeram score suficiente neste recorte.',
        tone:
          weakestCriterion?.classification === 'rejected'
            ? 'critical'
            : weakestCriterion?.classification === 'alert'
              ? 'warning'
              : 'neutral',
      },
      {
        id: 'quality-rejection',
        title: 'Motivo dominante',
        value: topRejectionReason?.[0] ?? 'Sem motivo recorrente',
        description:
          topRejectionReason != null
            ? `${topRejectionReason[1]} ocorrencia(s) no recorte filtrado.`
            : 'As reprovacoes ainda nao concentraram um motivo dominante.',
        tone: topRejectionReason != null ? 'critical' : 'neutral',
      },
      {
        id: 'quality-failures',
        title: 'Feature mais critica',
        value: topRejectedFeature?.[0] ?? 'Sem feature dominante',
        description:
          topRejectedFeature != null
            ? `${topRejectedFeature[1]} avaliacao(oes) reprovadas ou falhas, com ${failedCount} falha(s) de pipeline.`
            : `Filtro atual com ${filteredJudgeEvaluations.length} avaliacao(oes) visiveis.`,
        tone: topRejectedFeature != null || failedCount > 0 ? 'warning' : 'positive',
      },
    ];
  }, [filteredJudgeEvaluations, snapshot.qualityCriteria]);
  const investigationHighlights = useMemo<SummaryHighlight[]>(() => {
    const traceableRuns = filteredRuns.filter((item) => item.traceId !== '--').length;
    const requestCounts = new Map<string, number>();

    for (const run of filteredRuns) {
      requestCounts.set(run.requestPath, (requestCounts.get(run.requestPath) ?? 0) + 1);
    }

    const dominantPath = [...requestCounts.entries()].sort((left, right) => right[1] - left[1])[0] ?? null;

    return [
      {
        id: 'investigation-runs',
        title: 'Runs no filtro',
        value: `${filteredRuns.length}`,
        description: `${traceableRuns} run(s) com traceId pronto para drill-down rapido.`,
        tone: filteredRuns.some((item) => item.status === 'error')
          ? 'critical'
          : filteredRuns.some((item) => item.status === 'timeout')
            ? 'warning'
            : filteredRuns.length > 0
              ? 'positive'
              : 'neutral',
      },
      {
        id: 'investigation-path',
        title: 'Path dominante',
        value: dominantPath?.[0] ?? 'Sem path recorrente',
        description:
          dominantPath != null
            ? `${dominantPath[1]} ocorrencia(s) no conjunto filtrado.`
            : 'A busca atual nao concentrou um path dominante.',
        tone: dominantPath != null ? 'warning' : 'neutral',
      },
      {
        id: 'investigation-logs',
        title: 'Logs encontrados',
        value: `${filteredLogs.length}`,
        description:
          investigationSearch.trim().length > 0
            ? `Busca atual: "${investigationSearch.trim()}".`
            : 'Use a busca para cruzar requestId, traceId, path ou erro.',
        tone: filteredLogs.length > 0 ? 'positive' : 'neutral',
      },
    ];
  }, [filteredLogs.length, filteredRuns, investigationSearch]);

  useEffect(() => {
    if (initialMode === 'logs') {
      setActiveTab('investigation');
    }
  }, [initialMode]);

  useEffect(() => {
    void refreshDashboard(remoteQuery);
  }, [remoteQuery]);

  async function refreshDashboard(nextFilters: DeveloperObservabilityQuery = remoteQuery) {
    const requestId = refreshRequestId.current + 1;
    refreshRequestId.current = requestId;
    setLoading(true);

    try {
      const next = await getDeveloperObservabilitySnapshotOverrides(nextFilters);
      if (requestId !== refreshRequestId.current) return;

      setRemoteSnapshot(next);
      setSyncMessage(
        next
          ? `Dados sincronizados em ${next.generatedAtLabel ?? fallbackSnapshot.generatedAtLabel}.`
          : 'Fontes remotas indisponiveis. Exibindo a telemetria local da sessao.',
      );
    } catch (error) {
      if (requestId !== refreshRequestId.current) return;
      setRemoteSnapshot(null);
      setSyncMessage(syncErrorMessage(error));
    } finally {
      if (requestId === refreshRequestId.current) {
        setLoading(false);
      }
    }
  }

  function toggleExpand(id: string) {
    setExpandedIds((current) => ({ ...current, [id]: !current[id] }));
  }

  function applyExecutiveTarget(target: ObservabilityExecutiveTarget) {
    setActiveTab(target.tab);

    if (target.telemetry) {
      setTelemetryFilters((current) => ({ ...current, ...target.telemetry }));
      if (Object.prototype.hasOwnProperty.call(target.telemetry, 'agent')) {
        setQualityFilters((current) => ({
          ...current,
          feature: target.telemetry?.agent ?? null,
        }));
      }
    }

    if (target.quality) {
      setQualityFilters((current) => ({
        ...current,
        ...target.quality,
      }));
    }

    if (target.investigation?.search != null) {
      setInvestigationSearch(target.investigation.search);
    }
  }

  return (
    <>
      <View style={s.heroCard}>
        <View style={s.heroTopRow}>
          <View style={s.heroPill}>
            <Ionicons name="code-slash-outline" size={14} color={Brand.greenDark} />
            <Text style={s.heroPillText}>Dev Mode</Text>
          </View>

          <Pressable style={({ pressed }) => [s.refreshButton, pressed && s.pressed]} onPress={() => void refreshDashboard()}>
            <Ionicons name="refresh" size={15} color={Brand.greenDark} />
            <Text style={s.refreshButtonText}>{loading ? 'Atualizando...' : 'Atualizar'}</Text>
          </Pressable>
        </View>

        <Text style={s.heroTitle}>Observabilidade</Text>
        <Text style={s.heroSubtitle}>
          Comece pelo resumo executivo e aprofunde so no eixo que explicar melhor o problema.
        </Text>

        <View style={s.heroMetaRow}>
          {heroMetaItems.map((item) => (
            <HeroMeta key={`${item.label}-${item.value}`} label={item.label} value={item.value} />
          ))}
        </View>

        <View style={s.filterPanel}>
          <FilterChipGroup
            label="Janela"
            options={TELEMETRY_DAY_OPTIONS.map((days) => ({ label: `${days}d`, value: days }))}
            value={telemetryFilters.days ?? 7}
            onChange={(days) => setTelemetryFilters((current) => ({ ...current, days }))}
          />

          <FilterChipGroup
            label="Agente"
            options={telemetryAgentOptions}
            value={telemetryFilters.agent ?? null}
            onChange={(agent) => {
              setTelemetryFilters((current) => ({
                ...current,
                agent,
              }));
              setQualityFilters((current) => ({
                ...current,
                feature: agent ?? null,
              }));
            }}
          />

          <FilterChipGroup
            label="Status"
            options={TELEMETRY_STATUS_OPTIONS}
            value={telemetryFilters.status ?? null}
            onChange={(status) => setTelemetryFilters((current) => ({ ...current, status }))}
          />

          <FilterChipGroup
            label="Modelo"
            options={telemetryModelOptions}
            value={telemetryFilters.model ?? null}
            onChange={(model) => setTelemetryFilters((current) => ({ ...current, model }))}
          />
        </View>

        {syncMessage ? <Text style={s.syncMessage}>{syncMessage}</Text> : null}
      </View>

      <ExecutiveSummaryPanel summary={executiveSummary} onSelectTarget={applyExecutiveTarget} />

      <SectionCard
        title="Modo de leitura"
        subtitle="Troque de aba conforme a pergunta que voce quer responder agora.">
        <ObservabilityTabs activeTab={activeTab} tabs={DASHBOARD_TABS} onChange={setActiveTab} />
      </SectionCard>

      {activeTab === 'overview' ? (
        <>
          <SectionCard
            title="Painel rapido"
            subtitle="Resumo condensado de volume, latencia e qualidade para este recorte.">
            <MetricGrid metrics={overviewMetrics} />
          </SectionCard>

          <SectionCard title="Saude atual" subtitle="Visao rapida do app, BFF e IA atual.">
            {snapshot.services.map((service) => (
              <ServiceRow key={service.id} service={service} />
            ))}
          </SectionCard>

          <SectionCard title="IA / LLM" subtitle="Tokens, custo estimado e sinais tecnicos disponiveis.">
            <MetricGrid metrics={snapshot.llmMetrics} />
          </SectionCard>

          <SectionCard
            title="Sinais adicionais"
            subtitle="Observacoes complementares para validar ou refinar o diagnostico principal.">
            {snapshot.insights.length > 0 ? (
              snapshot.insights.map((insight) => (
                <InsightRow
                  key={insight.id}
                  title={insight.title}
                  description={insight.description}
                  tone={insight.tone}
                />
              ))
            ) : (
              <Text style={s.emptyText}>Sem sinais adicionais relevantes no recorte atual.</Text>
            )}
          </SectionCard>
        </>
      ) : null}

      {activeTab === 'failures' ? (
        <>
          <SectionCard
            title="Sintese de falhas"
            subtitle="Leitura orientada a causa para sair desta aba com uma suspeita dominante.">
            <HighlightGrid items={failureHighlights} />
          </SectionCard>

          <SectionCard title="Latencia e timeouts" subtitle="Picos, distribuicao e agrupamentos mais lentos do recorte.">
            <MetricGrid metrics={snapshot.performanceMetrics} />
            <RankingList title={snapshot.topEndpointsTitle ?? 'Latencia por endpoint'} rows={snapshot.topEndpoints} />
          </SectionCard>

          <SectionCard
            title="Concentradores do recorte"
            subtitle="Volume, falhas e agrupamentos que mais merecem comparacao agora.">
            <MetricGrid metrics={snapshot.volumeMetrics} />
            <RankingList title={snapshot.errorEndpointsTitle ?? 'Erros por endpoint'} rows={snapshot.errorEndpoints} />
          </SectionCard>
        </>
      ) : null}

      {activeTab === 'quality' ? (
        <>
          <SectionCard
            title="Recorte do judge"
            subtitle="Refine por feature, status e decisao antes de abrir as avaliacoes detalhadas.">
            <FilterChipGroup
              label="Feature"
              options={qualityFeatureOptions}
              value={qualityFilters.feature ?? null}
              onChange={(feature) => setQualityFilters((current) => ({ ...current, feature }))}
            />

            <FilterChipGroup
              label="Status do judge"
              options={QUALITY_STATUS_OPTIONS}
              value={qualityFilters.status ?? null}
              onChange={(status) => setQualityFilters((current) => ({ ...current, status }))}
            />

            <FilterChipGroup
              label="Decisao"
              options={QUALITY_DECISION_OPTIONS}
              value={qualityFilters.decision ?? null}
              onChange={(decision) => setQualityFilters((current) => ({ ...current, decision }))}
            />
          </SectionCard>

          <SectionCard
            title="Leitura da qualidade"
            subtitle="Os tres sinais que mais ajudam a explicar a queda ou estabilidade do judge.">
            <HighlightGrid items={qualityHighlights} />
          </SectionCard>

          <SectionCard
            title="LLM as Judge"
            subtitle="Metricas do judge com fila async, score e diagnostico por avaliacao.">
            <MetricGrid metrics={snapshot.judgeMetrics} />
            {qualityFilters.status || qualityFilters.decision || qualityFilters.feature ? (
              <Text style={s.inlineHint}>
                {filteredJudgeEvaluations.length} avaliacao(oes) no filtro atual.
              </Text>
            ) : null}
            {filteredJudgeEvaluations.length > 0 ? (
              <View style={s.judgeList}>
                {filteredJudgeEvaluations.map((evaluation) => (
                  <JudgeEvaluationCard key={evaluation.id} evaluation={evaluation} />
                ))}
              </View>
            ) : (
              <Text style={s.emptyText}>
                Nenhuma avaliacao do judge bateu com o filtro atual.
              </Text>
            )}
          </SectionCard>

          <SectionCard title="Qualidade" subtitle="Score geral, aprovacao e criterios do judge.">
            <MetricGrid metrics={snapshot.qualityMetrics} />
            <View style={s.criteriaWrap}>
              {snapshot.qualityCriteria.map((criterion) => (
                <CriterionChip
                  key={criterion.id}
                  label={criterion.label}
                  value={criterion.value}
                  classification={criterion.classification}
                />
              ))}
            </View>
          </SectionCard>
        </>
      ) : null}

      {activeTab === 'investigation' ? (
        <>
          <SectionCard
            title="Busca de investigacao"
            subtitle="Cruze requestId, traceId, path ou texto de erro para reduzir o ruido antes de abrir logs.">
            <TextInput
              value={investigationSearch}
              onChangeText={setInvestigationSearch}
              placeholder="Ex.: trace-1, req-7, /chat, timeout"
              placeholderTextColor={Brand.textMuted}
              style={s.searchInput}
              autoCapitalize="none"
              autoCorrect={false}
            />

            {investigationSearchSuggestions.length > 0 ? (
              <View style={s.quickSearchWrap}>
                {investigationSearchSuggestions.map((item) => (
                  <Pressable
                    key={item.id}
                    style={({ pressed }) => [s.quickSearchChip, pressed && s.pressed]}
                    onPress={() => setInvestigationSearch(item.value)}>
                    <Text style={s.quickSearchLabel}>{item.label}</Text>
                    <Text style={s.quickSearchValue}>{item.value}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </SectionCard>

          <SectionCard
            title="Leitura de investigacao"
            subtitle="Um atalho para saber se o recorte atual ja tem evidencia suficiente para debugging.">
            <HighlightGrid items={investigationHighlights} />
          </SectionCard>

          <SectionCard title="Runs recentes" subtitle="Execucoes recentes do backend para tracing rapido por request.">
            {filteredRuns.length > 0 ? (
              <View style={s.judgeList}>
                {filteredRuns.map((run) => (
                  <RecentRunCard key={run.id} run={run} />
                ))}
              </View>
            ) : (
              <Text style={s.emptyText}>
                Nenhum run bateu com a busca atual.
              </Text>
            )}
          </SectionCard>

          <SectionCard
            title="Timeline de eventos"
            subtitle="Sequencia recente para facilitar tracing basico antes de abrir logs brutos.">
            {filteredTimeline.length > 0 ? (
              filteredTimeline.map((event) => <TimelineRow key={event.id} event={event} />)
            ) : (
              <Text style={s.emptyText}>Nenhum evento da timeline bateu com a busca atual.</Text>
            )}
          </SectionCard>

          <NetworkDiagnosticsSection
            logs={filteredLogs}
            enabled={enabled}
            expandedIds={expandedIds}
            title="Logs de rede"
            subtitle="Base em tempo real para drill-down, debugging e comparacao com as metricas agregadas."
            emptyTitle={investigationSearch.trim() ? 'Nenhum log bateu com a busca atual.' : 'Sem logs ainda.'}
            emptyHint={
              investigationSearch.trim()
                ? 'Limpe a busca ou use outro requestId, traceId, path ou erro para ampliar o recorte.'
                : 'Faca chamadas de API para acompanhar trafego e performance aqui.'
            }
            onToggleEnabled={onToggleEnabled}
            onClear={onClearLogs}
            onToggleExpand={toggleExpand}
          />
        </>
      ) : null}
    </>
  );
}

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <View style={s.card}>
      <Text style={s.sectionTitle}>{title}</Text>
      <Text style={s.sectionSubtitle}>{subtitle}</Text>
      <View style={s.sectionBody}>{children}</View>
    </View>
  );
}

function HeroMeta({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.heroMetaCard}>
      <Text style={s.heroMetaLabel}>{label}</Text>
      <Text style={s.heroMetaValue}>{value}</Text>
    </View>
  );
}

function FilterChipGroup<T extends string | number | null>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<{ label: string; value: T }>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View style={s.filterGroup}>
      <Text style={s.filterLabel}>{label}</Text>
      <View style={s.filterChipWrap}>
        {options.map((option) => {
          const active = option.value === value;
          return (
            <Pressable
              key={`${label}-${option.label}-${option.value ?? 'all'}`}
              style={({ pressed }) => [s.filterChip, active && s.filterChipActive, pressed && s.pressed]}
              onPress={() => onChange(option.value)}>
              <Text style={[s.filterChipText, active && s.filterChipTextActive]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function HighlightGrid({ items }: { items: SummaryHighlight[] }) {
  return (
    <View style={s.highlightGrid}>
      {items.map((item) => {
        const colors = toneColors(item.tone);
        return (
          <View
            key={item.id}
            style={[s.highlightCard, { backgroundColor: colors.bg, borderColor: colors.border }]}>
            <Text style={s.highlightTitle}>{item.title}</Text>
            <Text style={[s.highlightValue, { color: colors.text }]}>{item.value}</Text>
            <Text style={s.highlightDescription}>{item.description}</Text>
          </View>
        );
      })}
    </View>
  );
}

function MetricGrid({ metrics }: { metrics: ObservabilityMetric[] }) {
  return (
    <View style={s.metricGrid}>
      {metrics.map((item) => {
        const colors = toneColors(item.tone);
        return (
          <View key={item.id} style={[s.metricCard, { backgroundColor: colors.bg, borderColor: colors.border }]}>
            <Text style={s.metricLabel}>{item.label}</Text>
            <Text style={[s.metricValue, { color: colors.text }]}>{item.value}</Text>
            <Text style={s.metricHint}>{item.hint}</Text>
          </View>
        );
      })}
    </View>
  );
}

function ServiceRow({ service }: { service: ObservabilityService }) {
  const colors =
    service.status === 'healthy'
      ? { bg: '#EAF8EE', dot: Brand.greenDark, label: 'Saudavel' }
      : service.status === 'warning'
        ? { bg: '#FFF3E3', dot: '#B96B00', label: 'Alerta' }
        : service.status === 'critical'
          ? { bg: '#FDE7E7', dot: Brand.danger, label: 'Critico' }
          : { bg: Brand.bg, dot: Brand.textMuted, label: 'Sem dados' };

  return (
    <View style={s.serviceRow}>
      <View style={[s.serviceDot, { backgroundColor: colors.dot }]} />
      <View style={s.serviceCopy}>
        <Text style={s.serviceLabel}>{service.label}</Text>
        <Text style={s.serviceSummary}>{service.summary}</Text>
        <Text style={s.serviceDetail}>{service.detail}</Text>
      </View>
      <View style={[s.serviceBadge, { backgroundColor: colors.bg }]}>
        <Text style={[s.serviceBadgeText, { color: colors.dot }]}>{colors.label}</Text>
      </View>
    </View>
  );
}

function RankingList({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ id: string; label: string; avgLatency: string; p95Latency: string; volume: string; errors: string }>;
}) {
  return (
    <View style={s.rankWrap}>
      <Text style={s.rankTitle}>{title}</Text>
      {rows.map((row) => (
        <View key={row.id} style={s.rankRow}>
          <View style={s.rankCopy}>
            <Text style={s.rankLabel}>{row.label}</Text>
            <Text style={s.rankMeta}>
              Avg {row.avgLatency} - P95 {row.p95Latency}
            </Text>
          </View>
          <View style={s.rankStats}>
            <Text style={s.rankStatText}>{row.volume}</Text>
            <Text style={s.rankStatText}>{row.errors}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function CriterionChip({
  label,
  value,
  classification,
}: {
  label: string;
  value: string;
  classification: ObservabilityClassification;
}) {
  const colors = classificationColors(classification);

  return (
    <View style={[s.criterionChip, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      <Text style={[s.criterionValue, { color: colors.text }]}>{value}</Text>
      <Text style={s.criterionLabel}>{label}</Text>
    </View>
  );
}

function InsightRow({
  title,
  description,
  tone,
}: {
  title: string;
  description: string;
  tone: ObservabilityTone;
}) {
  const colors = toneColors(tone);

  return (
    <View style={[s.insightRow, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      <Ionicons name="sparkles-outline" size={16} color={colors.text} />
      <View style={s.insightCopy}>
        <Text style={[s.insightTitle, { color: colors.text }]}>{title}</Text>
        <Text style={s.insightDescription}>{description}</Text>
      </View>
    </View>
  );
}

function JudgeEvaluationCard({ evaluation }: { evaluation: ObservabilityJudgeEvaluation }) {
  const statusColors = judgeStatusColors(evaluation.status);
  const decisionColors = classificationColors(evaluation.decision);
  const tone = toneColors(evaluation.tone);

  return (
    <View style={s.judgeCard}>
      <View style={s.judgeHeader}>
        <View style={s.judgeBadgeRow}>
          <Badge
            label={evaluation.feature.toUpperCase()}
            backgroundColor={Brand.bg}
            borderColor={Brand.border}
            textColor={Brand.textSecondary}
          />
          <Badge
            label={evaluation.statusLabel}
            backgroundColor={statusColors.bg}
            borderColor={statusColors.border}
            textColor={statusColors.text}
          />
          <Badge
            label={evaluation.decisionLabel}
            backgroundColor={decisionColors.bg}
            borderColor={decisionColors.border}
            textColor={decisionColors.text}
          />
        </View>
        <Text style={s.judgeTimestamp}>{evaluation.createdAtLabel}</Text>
      </View>

      <Text style={s.judgeSummary}>{evaluation.summary}</Text>

      <View style={s.judgeStatRow}>
        <JudgeStatCard label="Score" value={evaluation.score} tone={tone} />
        <JudgeStatCard
          label="Source"
          value={evaluation.sourceDuration}
          tone={{ bg: Brand.bg, border: Brand.border, text: Brand.text }}
        />
        <JudgeStatCard
          label="Judge"
          value={evaluation.judgeDuration}
          tone={{ bg: Brand.bg, border: Brand.border, text: Brand.text }}
        />
      </View>

      <View style={s.metaWrap}>
        <MetaChip label="Pipeline" value={evaluation.pipeline} />
        <MetaChip label="Handler" value={evaluation.handler} />
        <MetaChip label="Modelos" value={`${evaluation.sourceModel} -> ${evaluation.judgeModel}`} />
        <MetaChip label="Atualizado" value={evaluation.updatedAtLabel} />
        {evaluation.requestId !== '--' ? <MetaChip label="Request" value={evaluation.requestId} /> : null}
        {evaluation.messageId !== '--' ? <MetaChip label="Mensagem" value={evaluation.messageId} /> : null}
        {evaluation.conversationId !== '--' ? (
          <MetaChip label="Conversa" value={evaluation.conversationId} />
        ) : null}
        {evaluation.userId !== '--' ? <MetaChip label="Usuario" value={evaluation.userId} /> : null}
      </View>

      {evaluation.improvements.length > 0 ? (
        <InfoGroup title="Melhorias sugeridas" items={evaluation.improvements} tone="warning" />
      ) : null}

      {evaluation.rejectionReasons.length > 0 ? (
        <InfoGroup title="Motivos de reprovacao" items={evaluation.rejectionReasons} tone="critical" />
      ) : null}

      {evaluation.error ? (
        <View style={[s.judgeErrorBox, { backgroundColor: '#FDE7E7', borderColor: '#F5C2C2' }]}>
          <Text style={s.judgeErrorTitle}>Erro do judge</Text>
          <Text style={s.judgeErrorText}>{evaluation.error}</Text>
        </View>
      ) : null}
    </View>
  );
}

function RecentRunCard({ run }: { run: ObservabilityRecentRun }) {
  const statusColors = runStatusColors(run.status);

  return (
    <View style={s.judgeCard}>
      <View style={s.judgeHeader}>
        <View style={s.judgeBadgeRow}>
          <Badge
            label={run.agent.toUpperCase()}
            backgroundColor={Brand.bg}
            borderColor={Brand.border}
            textColor={Brand.textSecondary}
          />
          <Badge
            label={run.statusLabel}
            backgroundColor={statusColors.bg}
            borderColor={statusColors.border}
            textColor={statusColors.text}
          />
          <Badge
            label={run.httpMethod}
            backgroundColor={Brand.bg}
            borderColor={Brand.border}
            textColor={Brand.textSecondary}
          />
          <Badge
            label={run.httpStatusLabel}
            backgroundColor={Brand.bg}
            borderColor={Brand.border}
            textColor={Brand.textSecondary}
          />
          {run.timeout ? (
            <Badge
              label={run.timeoutLabel}
              backgroundColor="#FFF3E3"
              borderColor="#F3D2A8"
              textColor="#B96B00"
            />
          ) : null}
        </View>
        <Text style={s.judgeTimestamp}>{run.startedAtLabel}</Text>
      </View>

      <Text style={s.judgeSummary}>{`${run.httpMethod} ${run.requestPath}`}</Text>

      <View style={s.judgeStatRow}>
        <JudgeStatCard
          label="Duracao"
          value={run.duration}
          tone={{ bg: statusColors.bg, border: statusColors.border, text: statusColors.text }}
        />
        <JudgeStatCard
          label="Tokens"
          value={run.totalTokens}
          tone={{ bg: Brand.bg, border: Brand.border, text: Brand.text }}
        />
        <JudgeStatCard
          label="Custo"
          value={run.totalCost}
          tone={{ bg: Brand.bg, border: Brand.border, text: Brand.text }}
        />
      </View>

      <View style={s.metaWrap}>
        <MetaChip label="Run" value={run.runId} />
        {run.requestId !== '--' ? <MetaChip label="Request" value={run.requestId} /> : null}
        {run.traceId !== '--' ? <MetaChip label="Trace" value={run.traceId} /> : null}
        <MetaChip label="Endpoint" value={run.endpoint} />
        <MetaChip label="Finalizado" value={run.finishedAtLabel} />
        <MetaChip label="LLM calls" value={run.llmCallCount} />
        <MetaChip label="Tool calls" value={run.toolCallCount} />
        <MetaChip label="Stages" value={run.stageEventCount} />
      </View>

      {run.errorMessage ? (
        <View style={[s.judgeErrorBox, { backgroundColor: '#FDE7E7', borderColor: '#F5C2C2' }]}>
          <Text style={s.judgeErrorTitle}>Erro da execucao</Text>
          <Text style={s.judgeErrorText}>{run.errorMessage}</Text>
        </View>
      ) : null}
    </View>
  );
}

function Badge({
  label,
  backgroundColor,
  borderColor,
  textColor,
}: {
  label: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
}) {
  return (
    <View style={[s.badge, { backgroundColor, borderColor }]}>
      <Text style={[s.badgeText, { color: textColor }]}>{label}</Text>
    </View>
  );
}

function JudgeStatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: { bg: string; border: string; text: string };
}) {
  return (
    <View style={[s.judgeStatCard, { backgroundColor: tone.bg, borderColor: tone.border }]}>
      <Text style={s.judgeStatLabel}>{label}</Text>
      <Text style={[s.judgeStatValue, { color: tone.text }]}>{value}</Text>
    </View>
  );
}

function MetaChip({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.metaChip}>
      <Text style={s.metaChipLabel}>{label}</Text>
      <Text style={s.metaChipValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

function InfoGroup({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: ObservabilityTone;
}) {
  const colors = toneColors(tone);

  return (
    <View style={s.infoGroup}>
      <Text style={s.infoGroupTitle}>{title}</Text>
      <View style={s.infoGroupWrap}>
        {items.map((item, index) => (
          <View
            key={`${title}-${index}-${item}`}
            style={[s.infoChip, { backgroundColor: colors.bg, borderColor: colors.border }]}>
            <Text style={[s.infoChipText, { color: colors.text }]}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function TimelineRow({ event }: { event: ObservabilityTimelineEvent }) {
  const colors = toneColors(event.tone);

  return (
    <View style={s.timelineRow}>
      <View style={[s.timelineDot, { backgroundColor: colors.text }]} />
      <View style={s.timelineCopy}>
        <Text style={s.timelineTime}>{event.timestampLabel}</Text>
        <Text style={s.timelineTitle}>{event.title}</Text>
        <Text style={s.timelineDescription}>{event.description}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  heroCard: {
    borderRadius: Radii.xl,
    backgroundColor: '#F3FAF5',
    borderWidth: 1,
    borderColor: '#D8EAD9',
    padding: 18,
    gap: 14,
    ...Shadows.card,
  },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: Radii.pill,
    backgroundColor: '#EAF8EE',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  heroPillText: { ...Typography.caption, color: Brand.greenDark, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: Radii.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Brand.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  refreshButtonText: { ...Typography.caption, color: Brand.greenDark, fontWeight: '800' },
  heroTitle: { ...Typography.title, color: Brand.text, fontWeight: '800' },
  heroSubtitle: { ...Typography.body, color: Brand.textSecondary },
  heroMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  heroMetaCard: {
    minWidth: 110,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Brand.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  heroMetaLabel: { ...Typography.caption, color: Brand.textSecondary, fontWeight: '700' },
  heroMetaValue: { ...Typography.body, color: Brand.text, fontWeight: '700' },
  syncMessage: { ...Typography.caption, color: Brand.textSecondary },
  filterPanel: { gap: 12 },
  filterGroup: { gap: 8 },
  filterLabel: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  filterChipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChip: {
    borderRadius: Radii.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Brand.border,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  filterChipActive: {
    backgroundColor: '#EAF8EE',
    borderColor: '#C8E7D2',
  },
  filterChipText: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: Brand.greenDark,
  },
  inlineHint: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '700',
  },
  searchInput: {
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Brand.border,
    backgroundColor: Brand.bg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    ...Typography.body,
    color: Brand.text,
  },
  quickSearchWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickSearchChip: {
    minWidth: 120,
    flexGrow: 1,
    flexBasis: 120,
    borderRadius: Radii.lg,
    backgroundColor: Brand.bg,
    borderWidth: 1,
    borderColor: Brand.border,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 4,
  },
  quickSearchLabel: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  quickSearchValue: {
    ...Typography.caption,
    color: Brand.text,
    fontWeight: '700',
  },
  card: {
    borderRadius: Radii.xl,
    backgroundColor: Brand.card,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: 18,
    gap: 14,
    ...Shadows.card,
  },
  sectionTitle: { ...Typography.subtitle, color: Brand.text, fontWeight: '800' },
  sectionSubtitle: { ...Typography.body, color: Brand.textSecondary },
  sectionBody: { gap: 12 },
  blockWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  blockChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: Radii.pill,
    backgroundColor: Brand.bg,
    borderWidth: 1,
    borderColor: Brand.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  blockChipActive: { backgroundColor: '#EAF8EE', borderColor: '#C8E7D2' },
  blockChipText: { ...Typography.caption, color: Brand.textMuted, fontWeight: '700' },
  blockChipTextActive: { color: Brand.greenDark },
  highlightGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  highlightCard: {
    minWidth: 150,
    flexGrow: 1,
    flexBasis: 150,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 6,
  },
  highlightTitle: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  highlightValue: {
    ...Typography.body,
    fontWeight: '800',
  },
  highlightDescription: {
    ...Typography.caption,
    color: Brand.textSecondary,
  },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metricCard: { minWidth: 150, flexGrow: 1, flexBasis: 148, borderRadius: 20, borderWidth: 1, padding: 14, gap: 8 },
  metricLabel: { ...Typography.caption, color: Brand.textSecondary, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  metricValue: { fontSize: 24, lineHeight: 28, fontWeight: '800' },
  metricHint: { ...Typography.caption, color: Brand.textSecondary },
  serviceRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderRadius: 18, backgroundColor: Brand.bg, padding: 14 },
  serviceDot: { width: 10, height: 10, borderRadius: 5, marginTop: 6 },
  serviceCopy: { flex: 1, gap: 3 },
  serviceLabel: { ...Typography.body, color: Brand.text, fontWeight: '800' },
  serviceSummary: { ...Typography.caption, color: Brand.text, fontWeight: '700' },
  serviceDetail: { ...Typography.caption, color: Brand.textSecondary },
  serviceBadge: { borderRadius: Radii.pill, paddingHorizontal: 12, paddingVertical: 8 },
  serviceBadgeText: { ...Typography.caption, fontWeight: '800' },
  rankWrap: { gap: 10 },
  rankTitle: { ...Typography.body, color: Brand.text, fontWeight: '800' },
  rankRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, borderRadius: 18, backgroundColor: Brand.bg, padding: 14 },
  rankCopy: { flex: 1, gap: 4 },
  rankLabel: { ...Typography.body, color: Brand.text, fontWeight: '700' },
  rankMeta: { ...Typography.caption, color: Brand.textSecondary },
  rankStats: { alignItems: 'flex-end', gap: 4 },
  rankStatText: { ...Typography.caption, color: Brand.textSecondary, fontWeight: '700' },
  judgeList: { gap: 12 },
  judgeCard: {
    borderRadius: 22,
    backgroundColor: '#FCFDFB',
    borderWidth: 1,
    borderColor: Brand.border,
    padding: 16,
    gap: 12,
  },
  judgeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  judgeBadgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, flex: 1 },
  badge: {
    borderRadius: Radii.pill,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  badgeText: { ...Typography.caption, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },
  judgeTimestamp: { ...Typography.caption, color: Brand.textSecondary, fontWeight: '700' },
  judgeSummary: { ...Typography.body, color: Brand.text, fontWeight: '700' },
  judgeStatRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  judgeStatCard: {
    minWidth: 92,
    flexGrow: 1,
    flexBasis: 96,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 4,
  },
  judgeStatLabel: { ...Typography.caption, color: Brand.textSecondary, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  judgeStatValue: { ...Typography.body, fontWeight: '800' },
  metaWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metaChip: {
    minWidth: 130,
    flexGrow: 1,
    flexBasis: 150,
    borderRadius: 18,
    backgroundColor: Brand.bg,
    borderWidth: 1,
    borderColor: Brand.border,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 4,
  },
  metaChipLabel: { ...Typography.caption, color: Brand.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  metaChipValue: { ...Typography.caption, color: Brand.text, fontWeight: '700' },
  infoGroup: { gap: 8 },
  infoGroupTitle: { ...Typography.caption, color: Brand.text, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },
  infoGroupWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  infoChip: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  infoChipText: { ...Typography.caption, fontWeight: '700' },
  judgeErrorBox: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 4,
  },
  judgeErrorTitle: { ...Typography.caption, color: Brand.danger, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },
  judgeErrorText: { ...Typography.caption, color: Brand.danger },
  criteriaWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  criterionChip: { minWidth: 110, borderRadius: 18, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 12, gap: 4 },
  criterionValue: { ...Typography.body, fontWeight: '800' },
  criterionLabel: { ...Typography.caption, color: Brand.textSecondary, fontWeight: '700' },
  insightRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderRadius: 18, borderWidth: 1, padding: 14 },
  insightCopy: { flex: 1, gap: 4 },
  insightTitle: { ...Typography.body, fontWeight: '800' },
  insightDescription: { ...Typography.caption, color: Brand.textSecondary },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  timelineDot: { width: 10, height: 10, borderRadius: 5, marginTop: 5 },
  timelineCopy: { flex: 1, borderLeftWidth: 1, borderLeftColor: Brand.border, paddingLeft: 12, gap: 3 },
  timelineTime: { ...Typography.caption, color: Brand.textSecondary, fontWeight: '700' },
  timelineTitle: { ...Typography.body, color: Brand.text, fontWeight: '700' },
  timelineDescription: { ...Typography.caption, color: Brand.textSecondary },
  emptyText: { ...Typography.body, color: Brand.textSecondary },
  pressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },
});
