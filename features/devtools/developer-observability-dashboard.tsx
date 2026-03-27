import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Brand, Radii, Shadows, Typography } from '@/constants/theme';
import { NetworkDiagnosticsSection } from '@/features/devtools/network-diagnostics-section';
import type { AdminTelemetryMetricsQuery } from '@/services/admin-telemetry';
import {
  buildDeveloperObservabilitySnapshot,
  getDeveloperObservabilitySnapshotOverrides,
  mergeDeveloperObservabilitySnapshot,
} from '@/services/observability';
import type { NetworkInspectorLog } from '@/services/network-inspector';
import type {
  ObservabilityClassification,
  ObservabilityJudgeEvaluation,
  ObservabilityMetric,
  ObservabilityService,
  ObservabilityTimelineEvent,
  ObservabilityTone,
} from '@/types/observability';

type DashboardBlockId =
  | 'services'
  | 'performance'
  | 'volume'
  | 'llm'
  | 'judge'
  | 'quality'
  | 'insights'
  | 'timeline'
  | 'logs';

type Props = {
  logs: NetworkInspectorLog[];
  enabled: boolean;
  initialMode?: 'logs' | null;
  onToggleEnabled: () => void;
  onClearLogs: () => void;
};

const STORAGE_KEY_HIDDEN_BLOCKS = '@vidasync:developerDashboard:hiddenBlocks';
const BLOCKS: Array<{ id: DashboardBlockId; label: string }> = [
  { id: 'services', label: 'Saude' },
  { id: 'performance', label: 'Performance' },
  { id: 'volume', label: 'Volume' },
  { id: 'llm', label: 'IA / LLM' },
  { id: 'judge', label: 'Judge' },
  { id: 'quality', label: 'Qualidade' },
  { id: 'insights', label: 'Insights' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'logs', label: 'Logs' },
];
const TELEMETRY_DAY_OPTIONS = [7, 14, 30] as const;
const TELEMETRY_AGENT_OPTIONS: Array<{ label: string; value: string | null }> = [
  { label: 'Chat', value: 'chat' },
  { label: 'Todos', value: null },
];

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

function sourceLabel(source: 'fallback' | 'hybrid' | 'backend') {
  if (source === 'backend') return 'Backend';
  if (source === 'hybrid') return 'Hibrido';
  return 'Sessao local';
}

function orderedBlocks(initialMode?: 'logs' | null) {
  if (initialMode !== 'logs') return BLOCKS;
  const logsBlock = BLOCKS.find((item) => item.id === 'logs');
  return logsBlock ? [logsBlock, ...BLOCKS.filter((item) => item.id !== 'logs')] : BLOCKS;
}

export function DeveloperObservabilityDashboard({
  logs,
  enabled,
  initialMode,
  onToggleEnabled,
  onClearLogs,
}: Props) {
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [hiddenBlocks, setHiddenBlocks] = useState<DashboardBlockId[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [telemetryFilters, setTelemetryFilters] = useState<AdminTelemetryMetricsQuery>({
    days: 7,
    agent: 'chat',
  });
  const [remoteSnapshot, setRemoteSnapshot] = useState<Awaited<
    ReturnType<typeof getDeveloperObservabilitySnapshotOverrides>
  > | null>(null);
  const refreshRequestId = useRef(0);

  const fallbackSnapshot = useMemo(() => buildDeveloperObservabilitySnapshot(logs), [logs]);
  const snapshot = useMemo(
    () => mergeDeveloperObservabilitySnapshot(fallbackSnapshot, remoteSnapshot),
    [fallbackSnapshot, remoteSnapshot],
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

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY_HIDDEN_BLOCKS);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return;
        setHiddenBlocks(parsed.filter((item) => BLOCKS.some((block) => block.id === item)));
      } catch {
        // Ignore invalid local preferences.
      }
    })();
  }, []);

  useEffect(() => {
    void refreshDashboard(telemetryFilters);
  }, [telemetryFilters.agent, telemetryFilters.days]);

  async function refreshDashboard(nextFilters: AdminTelemetryMetricsQuery = telemetryFilters) {
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
      setSyncMessage(
        error instanceof Error
          ? error.message
          : 'Fontes remotas indisponiveis. Exibindo a telemetria local da sessao.',
      );
    } finally {
      if (requestId === refreshRequestId.current) {
        setLoading(false);
      }
    }
  }

  async function toggleBlock(id: DashboardBlockId) {
    const next = hiddenBlocks.includes(id)
      ? hiddenBlocks.filter((item) => item !== id)
      : [...hiddenBlocks, id];

    setHiddenBlocks(next);

    try {
      await AsyncStorage.setItem(STORAGE_KEY_HIDDEN_BLOCKS, JSON.stringify(next));
    } catch {
      // Ignore storage write failures for preferences.
    }
  }

  function isVisible(id: DashboardBlockId) {
    return !hiddenBlocks.includes(id);
  }

  function toggleExpand(id: string) {
    setExpandedIds((current) => ({ ...current, [id]: !current[id] }));
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
          Central tecnica com saude dos servicos, performance, custo de IA e sinais de qualidade.
        </Text>

        <View style={s.heroMetaRow}>
          {heroMetaItems.map((item) => (
            <HeroMeta key={`${item.label}-${item.value}`} label={item.label} value={item.value} />
          ))}
        </View>

        <View style={s.filterPanel}>
          <View style={s.filterGroup}>
            <Text style={s.filterLabel}>Janela</Text>
            <View style={s.filterChipWrap}>
              {TELEMETRY_DAY_OPTIONS.map((days) => {
                const active = telemetryFilters.days === days;
                return (
                  <Pressable
                    key={`days-${days}`}
                    style={({ pressed }) => [s.filterChip, active && s.filterChipActive, pressed && s.pressed]}
                    onPress={() => setTelemetryFilters((current) => ({ ...current, days }))}>
                    <Text style={[s.filterChipText, active && s.filterChipTextActive]}>{days}d</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={s.filterGroup}>
            <Text style={s.filterLabel}>Agente</Text>
            <View style={s.filterChipWrap}>
              {TELEMETRY_AGENT_OPTIONS.map((option) => {
                const active = telemetryFilters.agent === option.value;
                return (
                  <Pressable
                    key={`agent-${option.value ?? 'all'}`}
                    style={({ pressed }) => [s.filterChip, active && s.filterChipActive, pressed && s.pressed]}
                    onPress={() =>
                      setTelemetryFilters((current) => ({
                        ...current,
                        agent: option.value,
                      }))
                    }>
                    <Text style={[s.filterChipText, active && s.filterChipTextActive]}>{option.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        {syncMessage ? <Text style={s.syncMessage}>{syncMessage}</Text> : null}
      </View>

      <View style={s.card}>
        <Text style={s.sectionTitle}>Dashboard modular</Text>
        <Text style={s.sectionSubtitle}>Ligue ou esconda blocos conforme o foco tecnico da sessao.</Text>

        <View style={s.blockWrap}>
          {orderedBlocks(initialMode).map((block) => {
            const active = isVisible(block.id);
            return (
              <Pressable
                key={block.id}
                style={({ pressed }) => [s.blockChip, active && s.blockChipActive, pressed && s.pressed]}
                onPress={() => void toggleBlock(block.id)}>
                <Ionicons
                  name={active ? 'eye-outline' : 'eye-off-outline'}
                  size={14}
                  color={active ? Brand.greenDark : Brand.textMuted}
                />
                <Text style={[s.blockChipText, active && s.blockChipTextActive]}>{block.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {isVisible('services') ? (
        <SectionCard title="Saude dos servicos" subtitle="Visao rapida do app, BFF e IA atual.">
          {snapshot.services.map((service) => (
            <ServiceRow key={service.id} service={service} />
          ))}
        </SectionCard>
      ) : null}

      {isVisible('performance') ? (
        <SectionCard title="Performance" subtitle="Latencia consolidada e distribuicao do recorte atual.">
          <MetricGrid metrics={snapshot.performanceMetrics} />
          <RankingList title={snapshot.topEndpointsTitle ?? 'Latencia por endpoint'} rows={snapshot.topEndpoints} />
        </SectionCard>
      ) : null}

      {isVisible('volume') ? (
        <SectionCard title="Volume e erros" subtitle="Volume total, falhas e agrupamentos do escopo selecionado.">
          <MetricGrid metrics={snapshot.volumeMetrics} />
          <RankingList title={snapshot.errorEndpointsTitle ?? 'Erros por endpoint'} rows={snapshot.errorEndpoints} />
        </SectionCard>
      ) : null}

      {isVisible('llm') ? (
        <SectionCard title="IA / LLM metrics" subtitle="Tokens, custo estimado e sinais de cache.">
          <MetricGrid metrics={snapshot.llmMetrics} />
        </SectionCard>
      ) : null}

      {isVisible('judge') ? (
        <SectionCard
          title="LLM as Judge"
          subtitle="Leitura direta do banco com fila async, score e diagnostico por avaliacao.">
          <MetricGrid metrics={snapshot.judgeMetrics} />
          {snapshot.judgeEvaluations.length > 0 ? (
            <View style={s.judgeList}>
              {snapshot.judgeEvaluations.map((evaluation) => (
                <JudgeEvaluationCard key={evaluation.id} evaluation={evaluation} />
              ))}
            </View>
          ) : (
            <Text style={s.emptyText}>
              As avaliacoes recentes do judge aparecem aqui assim que a tabela do Supabase estiver
              acessivel para o app.
            </Text>
          )}
        </SectionCard>
      ) : null}

      {isVisible('quality') ? (
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
      ) : null}

      {isVisible('insights') ? (
        <SectionCard title="Insights automaticos" subtitle="Sugestoes e possiveis problemas detectados pelo painel.">
          {snapshot.insights.map((insight) => (
            <InsightRow key={insight.id} title={insight.title} description={insight.description} tone={insight.tone} />
          ))}
        </SectionCard>
      ) : null}

      {isVisible('timeline') ? (
        <SectionCard title="Timeline de eventos" subtitle="Eventos recentes da sessao para facilitar o tracing basico.">
          {snapshot.timeline.length > 0 ? (
            snapshot.timeline.map((event) => <TimelineRow key={event.id} event={event} />)
          ) : (
            <Text style={s.emptyText}>Sem eventos suficientes para montar a timeline ainda.</Text>
          )}
        </SectionCard>
      ) : null}

      {isVisible('logs') ? (
        <NetworkDiagnosticsSection
          logs={logs}
          enabled={enabled}
          expandedIds={expandedIds}
          title="Logs de rede"
          subtitle="Base em tempo real para drill-down, debugging e comparacao com as metricas agregadas."
          onToggleEnabled={onToggleEnabled}
          onClear={onClearLogs}
          onToggleExpand={toggleExpand}
        />
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
