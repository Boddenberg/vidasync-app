import type { AdminTelemetryMetricsQuery } from '@/services/admin-telemetry';
import type {
  DeveloperObservabilitySnapshot,
  ObservabilityClassification,
  ObservabilityJudgeStatus,
  ObservabilityServiceStatus,
  ObservabilityTone,
} from '@/types/observability';

export type ObservabilityDashboardTab = 'overview' | 'failures' | 'quality' | 'investigation';

export type ObservabilityExecutiveTarget = {
  tab: ObservabilityDashboardTab;
  telemetry?: Partial<Pick<AdminTelemetryMetricsQuery, 'agent' | 'model' | 'status'>>;
  quality?: {
    feature?: string | null;
    status?: ObservabilityJudgeStatus | null;
    decision?: ObservabilityClassification | null;
  };
  investigation?: {
    search?: string;
  };
};

export type ObservabilityExecutiveFinding = {
  id: string;
  title: string;
  description: string;
  tone: ObservabilityTone;
  tab: ObservabilityDashboardTab;
  target: ObservabilityExecutiveTarget;
};

export type ObservabilityExecutiveAction = {
  id: string;
  label: string;
  description: string;
  tab: ObservabilityDashboardTab;
  target: ObservabilityExecutiveTarget;
};

export type ObservabilityExecutiveDataQuality = {
  title: string;
  description: string;
  tone: ObservabilityTone;
};

export type ObservabilityExecutiveSummary = {
  overallStatus: ObservabilityServiceStatus;
  headline: string;
  subheadline: string;
  impactSummary: string;
  suspectedCause: string;
  primaryFinding: ObservabilityExecutiveFinding | null;
  topFindings: ObservabilityExecutiveFinding[];
  recommendedActions: ObservabilityExecutiveAction[];
  dataQuality: ObservabilityExecutiveDataQuality;
};

type SeverityRank = 0 | 1 | 2 | 3;

function findMetricValue(
  snapshot: DeveloperObservabilitySnapshot,
  ids: string[],
): string | null {
  const groups = [
    snapshot.performanceMetrics,
    snapshot.volumeMetrics,
    snapshot.llmMetrics,
    snapshot.judgeMetrics,
    snapshot.qualityMetrics,
  ];

  for (const group of groups) {
    for (const id of ids) {
      const metric = group.find((item) => item.id === id);
      if (metric?.value) return metric.value;
    }
  }

  return null;
}

function parseCount(value: string | null | undefined): number | null {
  const normalized = `${value ?? ''}`.trim().toLowerCase();
  if (!normalized || normalized === '--') return null;

  const match = normalized.match(/-?\d+([.,]\d+)?/);
  if (!match) return null;

  const base = Number(match[0].replace(',', '.'));
  if (!Number.isFinite(base)) return null;

  if (normalized.includes('k')) return base * 1000;
  return base;
}

function parsePercent(value: string | null | undefined): number | null {
  const normalized = `${value ?? ''}`.trim();
  if (!normalized || normalized === '--') return null;
  const match = normalized.match(/-?\d+([.,]\d+)?/);
  if (!match) return null;

  const parsed = Number(match[0].replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function parseDurationMs(value: string | null | undefined): number | null {
  const normalized = `${value ?? ''}`.trim().toLowerCase();
  if (!normalized || normalized === '--') return null;

  const match = normalized.match(/-?\d+([.,]\d+)?/);
  if (!match) return null;

  const parsed = Number(match[0].replace(',', '.'));
  if (!Number.isFinite(parsed)) return null;

  if (normalized.includes('ms')) return parsed;
  if (normalized.includes('s')) return parsed * 1000;
  return parsed;
}

function rankFromTone(tone: ObservabilityTone): SeverityRank {
  if (tone === 'critical') return 3;
  if (tone === 'warning') return 2;
  if (tone === 'neutral') return 1;
  return 0;
}

function toneFromServiceStatus(status: ObservabilityServiceStatus): ObservabilityTone {
  if (status === 'critical') return 'critical';
  if (status === 'warning') return 'warning';
  if (status === 'healthy') return 'positive';
  return 'neutral';
}

function hasMeaningfulTraffic(snapshot: DeveloperObservabilitySnapshot): boolean {
  const localRequests = parseCount(findMetricValue(snapshot, ['total-requests'])) ?? 0;
  const totalRuns = parseCount(findMetricValue(snapshot, ['total-runs'])) ?? 0;
  const totalJudge = parseCount(findMetricValue(snapshot, ['judge-total'])) ?? 0;

  return (
    localRequests > 0 ||
    totalRuns > 0 ||
    totalJudge > 0 ||
    snapshot.recentRuns.length > 0 ||
    snapshot.judgeEvaluations.length > 0
  );
}

function buildDataQuality(snapshot: DeveloperObservabilitySnapshot): ObservabilityExecutiveDataQuality {
  if (!hasMeaningfulTraffic(snapshot)) {
    return {
      title: 'Sem trafego suficiente',
      description: 'Ainda nao ha volume no recorte atual para tirar conclusoes confiaveis.',
      tone: 'neutral',
    };
  }

  if (snapshot.source === 'backend') {
    return {
      title: 'Fontes remotas sincronizadas',
      description: 'Voce esta vendo o consolidado remoto com runs e sinais de qualidade disponiveis.',
      tone: 'positive',
    };
  }

  if (snapshot.source === 'hybrid') {
    return {
      title: 'Fonte hibrida',
      description: 'Parte das fontes remotas respondeu, mas ainda ha lacunas no recorte mostrado.',
      tone: 'warning',
    };
  }

  return {
    title: 'Somente sessao local',
    description: 'Runs, custos agregados e parte do judge podem estar incompletos enquanto o remoto nao responde.',
    tone: 'warning',
  };
}

function buildHeadline(
  overallStatus: ObservabilityServiceStatus,
  primaryFinding: ObservabilityExecutiveFinding | null,
): string {
  if (!primaryFinding) {
    if (overallStatus === 'unknown') return 'Painel sem trafego suficiente';
    return 'Sem alertas fortes no recorte atual';
  }

  return primaryFinding.title;
}

function buildSubheadline(
  snapshot: DeveloperObservabilitySnapshot,
  primaryFinding: ObservabilityExecutiveFinding | null,
): string {
  if (!primaryFinding) {
    return snapshot.source === 'backend'
      ? 'As fontes remotas responderam sem destacar incidentes relevantes agora.'
      : 'A telemetria atual ainda nao mostra volume suficiente para um diagnostico forte.';
  }

  return primaryFinding.description;
}

function buildImpactSummary(
  snapshot: DeveloperObservabilitySnapshot,
  primaryFinding: ObservabilityExecutiveFinding | null,
): string {
  const errorRate = parsePercent(findMetricValue(snapshot, ['error-rate']));
  const p95 = findMetricValue(snapshot, ['p95-latency', 'p95-duration']) ?? '--';
  const approvalRate = findMetricValue(snapshot, ['approval-rate']) ?? '--';
  const failedJudge = parseCount(findMetricValue(snapshot, ['judge-failed'])) ?? 0;
  const timeouts = parseCount(findMetricValue(snapshot, ['timeout-count'])) ?? 0;

  if (!primaryFinding) {
    return hasMeaningfulTraffic(snapshot)
      ? `P95 em ${p95}, aprovacao em ${approvalRate} e sem sinais criticos acima dos thresholds atuais.`
      : 'Use o app ou amplie a janela do recorte para gerar sinais mais confiaveis.';
  }

  if (primaryFinding.tab === 'failures') {
    return `${errorRate != null ? `${errorRate.toFixed(1)}% de erro` : 'Falhas detectadas'} e P95 em ${p95}${timeouts > 0 ? ` com ${timeouts} timeout(s)` : ''}.`;
  }

  if (primaryFinding.tab === 'quality') {
    return `Score geral em ${findMetricValue(snapshot, ['overall-score']) ?? '--'}, aprovacao em ${approvalRate}${failedJudge > 0 ? ` e ${failedJudge} falha(s) do judge` : ''}.`;
  }

  if (primaryFinding.tab === 'investigation') {
    return `${snapshot.recentRuns.length} run(s) recente(s) e ${snapshot.timeline.length} evento(s) disponiveis para tracing rapido.`;
  }

  return primaryFinding.description;
}

function buildSuspectedCause(
  snapshot: DeveloperObservabilitySnapshot,
  primaryFinding: ObservabilityExecutiveFinding | null,
): string {
  if (!primaryFinding) {
    return snapshot.source === 'fallback'
      ? 'A principal limitacao agora e a falta de dados remotos ou de trafego suficiente.'
      : 'Nao ha uma causa predominante evidente no recorte atual.';
  }

  if (primaryFinding.id === 'latency') {
    const topEndpoint = snapshot.topEndpoints[0];
    if (topEndpoint && !topEndpoint.label.toLowerCase().includes('sem ')) {
      return `Maior suspeita atual: ${topEndpoint.label} lidera a latencia observada neste recorte.`;
    }
  }

  if (primaryFinding.id === 'errors') {
    const topError = snapshot.errorEndpoints[0];
    if (topError && !topError.label.toLowerCase().includes('sem ')) {
      return `Maior suspeita atual: ${topError.label} concentra o pior agrupamento de falhas mostrado pelo painel.`;
    }
  }

  if (primaryFinding.id === 'quality') {
    const failedEvaluation = snapshot.judgeEvaluations.find((item) => item.error);
    if (failedEvaluation?.error) {
      return `Maior suspeita atual: o judge falhou em parte do recorte e reportou "${failedEvaluation.error}".`;
    }

    const rejected = snapshot.judgeEvaluations.find((item) => item.rejectionReasons.length > 0);
    if (rejected?.rejectionReasons[0]) {
      return `Maior suspeita atual: as reprovacoes do judge estao puxadas por "${rejected.rejectionReasons[0]}".`;
    }
  }

  if (primaryFinding.id === 'timeouts') {
    const timeoutRun = snapshot.recentRuns.find((item) => item.timeout);
    if (timeoutRun) {
      return `Maior suspeita atual: o endpoint ${timeoutRun.requestPath} estourou timeout nas execucoes recentes.`;
    }
  }

  return 'Abra a aba sugerida para ver o recorte detalhado e confirmar a causa dominante.';
}

function buildActions(
  primaryFinding: ObservabilityExecutiveFinding | null,
  snapshot: DeveloperObservabilitySnapshot,
): ObservabilityExecutiveAction[] {
  const actions: ObservabilityExecutiveAction[] = [];
  const topFailurePath = snapshot.recentRuns.find((item) => item.status !== 'success')?.requestPath;
  const qualityFeature = primaryFinding?.tab === 'quality'
    ? snapshot.judgeEvaluations[0]?.feature ?? null
    : snapshot.judgeEvaluations[0]?.feature ?? null;

  function pushAction(action: ObservabilityExecutiveAction) {
    if (actions.some((item) => item.id === action.id)) return;
    actions.push(action);
  }

  if (primaryFinding?.tab === 'failures') {
    pushAction({
      id: 'open-failures',
      label: 'Abrir falhas',
      description: 'Veja latencia, taxa de erro e os rankings do recorte atual.',
      tab: 'failures',
      target: {
        tab: 'failures',
        telemetry: primaryFinding.id === 'errors' ? { status: 'error' } : undefined,
      },
    });
    pushAction({
      id: 'open-investigation',
      label: 'Investigar runs',
      description: 'Use runs, timeline e logs para confirmar a causa do incidente.',
      tab: 'investigation',
      target: {
        tab: 'investigation',
        telemetry:
          primaryFinding.id === 'timeouts'
            ? { status: 'timeout' }
            : primaryFinding.id === 'errors'
              ? { status: 'error' }
              : undefined,
        investigation: topFailurePath ? { search: topFailurePath } : undefined,
      },
    });
  }

  if (primaryFinding?.tab === 'quality') {
    pushAction({
      id: 'open-quality',
      label: 'Abrir qualidade',
      description: 'Veja score, criterios e avaliacoes do judge no mesmo recorte.',
      tab: 'quality',
      target: {
        tab: 'quality',
        quality: {
          feature: qualityFeature,
          status: primaryFinding.id === 'judge-failures' ? 'failed' : null,
          decision: primaryFinding.id === 'quality' ? 'rejected' : null,
        },
      },
    });
    pushAction({
      id: 'open-investigation',
      label: 'Cruzar com runs',
      description: 'Compare avaliacoes ruins com runs recentes e erros de execucao.',
      tab: 'investigation',
      target: {
        tab: 'investigation',
        telemetry: primaryFinding.id === 'judge-failures' ? { status: 'error' } : undefined,
        investigation:
          snapshot.judgeEvaluations[0]?.requestId && snapshot.judgeEvaluations[0]?.requestId !== '--'
            ? { search: snapshot.judgeEvaluations[0].requestId }
            : undefined,
      },
    });
  }

  if (primaryFinding?.tab === 'investigation') {
    pushAction({
      id: 'open-investigation',
      label: 'Abrir investigacao',
      description: 'Veja runs recentes, timeline e logs brutos do recorte atual.',
      tab: 'investigation',
      target: {
        tab: 'investigation',
        telemetry:
          primaryFinding.id === 'timeouts'
            ? { status: 'timeout' }
            : primaryFinding.id === 'judge-failures'
              ? { status: 'error' }
              : undefined,
        investigation: topFailurePath ? { search: topFailurePath } : undefined,
      },
    });
  }

  if (!primaryFinding || primaryFinding.tab === 'overview') {
    pushAction({
      id: 'open-overview',
      label: 'Manter no resumo',
      description: 'Acompanhe o estado geral e os principais achados do recorte.',
      tab: 'overview',
      target: {
        tab: 'overview',
      },
    });
  }

  if (snapshot.judgeEvaluations.length > 0 || snapshot.qualityCriteria.some((item) => item.value !== '--')) {
    pushAction({
      id: 'open-quality',
      label: 'Checar qualidade',
      description: 'Confirme se a queda esta em score, aprovacao ou criterios do judge.',
      tab: 'quality',
      target: {
        tab: 'quality',
        quality: {
          feature: qualityFeature,
        },
      },
    });
  }

  if (snapshot.recentRuns.length > 0 || snapshot.timeline.length > 0 || hasMeaningfulTraffic(snapshot)) {
    pushAction({
      id: 'open-investigation',
      label: 'Ver investigacao',
      description: 'Abra runs, timeline e logs para validar a hipotese principal.',
      tab: 'investigation',
      target: {
        tab: 'investigation',
        investigation: topFailurePath ? { search: topFailurePath } : undefined,
      },
    });
  }

  if (actions.length < 3) {
    pushAction({
      id: 'open-failures',
      label: 'Comparar falhas',
      description: 'Use a aba de falhas para revisar latencia, erro e agrupamentos.',
      tab: 'failures',
      target: {
        tab: 'failures',
      },
    });
  }

  if (actions.length < 3) {
    pushAction({
      id: 'open-quality',
      label: 'Comparar qualidade',
      description: 'Confira se a qualidade acompanha ou contradiz os sinais tecnicos.',
      tab: 'quality',
      target: {
        tab: 'quality',
        quality: {
          feature: qualityFeature,
        },
      },
    });
  }

  return actions.slice(0, 3);
}

function determineOverallStatus(
  findings: ObservabilityExecutiveFinding[],
  snapshot: DeveloperObservabilitySnapshot,
): ObservabilityServiceStatus {
  const highestRank = findings.reduce<SeverityRank>((current, item) => {
    const next = rankFromTone(item.tone);
    return next > current ? next : current;
  }, 0);

  if (highestRank >= 3) return 'critical';
  if (highestRank >= 2) return 'warning';

  if (!hasMeaningfulTraffic(snapshot)) return 'unknown';
  return 'healthy';
}

export function buildObservabilityExecutiveSummary(
  snapshot: DeveloperObservabilitySnapshot,
): ObservabilityExecutiveSummary {
  const findings: ObservabilityExecutiveFinding[] = [];
  const errorRate = parsePercent(findMetricValue(snapshot, ['error-rate']));
  const timeoutCount = parseCount(findMetricValue(snapshot, ['timeout-count'])) ?? 0;
  const p95Ms = parseDurationMs(findMetricValue(snapshot, ['p95-latency', 'p95-duration']));
  const approvalRate = parsePercent(findMetricValue(snapshot, ['approval-rate']));
  const overallScore = parsePercent(findMetricValue(snapshot, ['overall-score']));
  const judgeFailed = parseCount(findMetricValue(snapshot, ['judge-failed'])) ?? 0;
  const warningServices = snapshot.services.filter((item) => item.status === 'warning');
  const criticalServices = snapshot.services.filter((item) => item.status === 'critical');

  if (!hasMeaningfulTraffic(snapshot)) {
    findings.push({
      id: 'empty-traffic',
      title: 'Sem trafego suficiente para concluir',
      description: 'Ainda nao ha volume no recorte atual para apontar um problema dominante com confianca.',
      tone: 'neutral',
      tab: 'overview',
      target: {
        tab: 'overview',
      },
    });
  }

  if (criticalServices.length > 0) {
    findings.push({
      id: 'service-health',
      title: 'Saude critica em servicos observados',
      description: `${criticalServices.map((item) => item.label).join(', ')} aparecem como criticos no recorte atual.`,
      tone: 'critical',
      tab: 'failures',
      target: {
        tab: 'failures',
      },
    });
  } else if (warningServices.length > 0) {
    findings.push({
      id: 'service-health',
      title: 'Servicos sob observacao',
      description: `${warningServices.map((item) => item.label).join(', ')} merecem revisao por estarem em alerta.`,
      tone: 'warning',
      tab: 'failures',
      target: {
        tab: 'failures',
      },
    });
  }

  if (errorRate != null && errorRate >= 10) {
    findings.push({
      id: 'errors',
      title: 'Taxa de erro critica no recorte',
      description: `A taxa de erro esta em ${errorRate.toFixed(1)}%, acima do nivel esperado para o fluxo atual.`,
      tone: 'critical',
      tab: 'failures',
      target: {
        tab: 'failures',
        telemetry: { status: 'error' },
      },
    });
  } else if (errorRate != null && errorRate >= 5) {
    findings.push({
      id: 'errors',
      title: 'Taxa de erro acima do ideal',
      description: `A taxa de erro esta em ${errorRate.toFixed(1)}%, pedindo revisao dos endpoints mais afetados.`,
      tone: 'warning',
      tab: 'failures',
      target: {
        tab: 'failures',
        telemetry: { status: 'error' },
      },
    });
  }

  if (timeoutCount >= 3) {
    findings.push({
      id: 'timeouts',
      title: 'Timeouts repetidos nas execucoes',
      description: `${timeoutCount} timeout(s) apareceram no recorte e aumentam o risco de incidente percebido pelo usuario.`,
      tone: 'critical',
      tab: 'investigation',
      target: {
        tab: 'investigation',
        telemetry: { status: 'timeout' },
      },
    });
  } else if (timeoutCount > 0) {
    findings.push({
      id: 'timeouts',
      title: 'Timeouts recentes detectados',
      description: `${timeoutCount} timeout(s) apareceram no recorte e pedem revisao das execucoes recentes.`,
      tone: 'warning',
      tab: 'investigation',
      target: {
        tab: 'investigation',
        telemetry: { status: 'timeout' },
      },
    });
  }

  if (p95Ms != null && p95Ms >= 4000) {
    findings.push({
      id: 'latency',
      title: 'Latencia critica no P95',
      description: `O P95 passou de ${(p95Ms / 1000).toFixed(1)}s e indica gargalo relevante no fluxo observado.`,
      tone: 'critical',
      tab: 'failures',
      target: {
        tab: 'failures',
      },
    });
  } else if (p95Ms != null && p95Ms >= 1800) {
    findings.push({
      id: 'latency',
      title: 'Latencia acima do esperado',
      description: `O P95 esta em ${(p95Ms / 1000).toFixed(1)}s e merece analise dos endpoints mais lentos.`,
      tone: 'warning',
      tab: 'failures',
      target: {
        tab: 'failures',
      },
    });
  }

  if (judgeFailed > 0) {
    findings.push({
      id: 'judge-failures',
      title: 'Falhas no pipeline do judge',
      description: `${judgeFailed} avaliacao(oes) do judge falharam antes de concluir o processamento.`,
      tone: judgeFailed >= 3 ? 'critical' : 'warning',
      tab: 'quality',
      target: {
        tab: 'quality',
        quality: { status: 'failed' },
      },
    });
  }

  if (
    (approvalRate != null && approvalRate < 70) ||
    (overallScore != null && overallScore < 75)
  ) {
    findings.push({
      id: 'quality',
      title: 'Qualidade abaixo do objetivo',
      description: `Score geral em ${findMetricValue(snapshot, ['overall-score']) ?? '--'} e aprovacao em ${findMetricValue(snapshot, ['approval-rate']) ?? '--'}.`,
      tone: approvalRate != null && approvalRate < 60 ? 'critical' : 'warning',
      tab: 'quality',
      target: {
        tab: 'quality',
        quality: { decision: 'rejected' },
      },
    });
  }

  const sortedFindings = [...findings].sort((left, right) => {
    const toneDelta = rankFromTone(right.tone) - rankFromTone(left.tone);
    if (toneDelta !== 0) return toneDelta;
    return left.title.localeCompare(right.title);
  });
  const primaryFinding = sortedFindings[0] ?? null;
  const overallStatus = determineOverallStatus(sortedFindings, snapshot);

  return {
    overallStatus,
    headline: buildHeadline(overallStatus, primaryFinding),
    subheadline: buildSubheadline(snapshot, primaryFinding),
    impactSummary: buildImpactSummary(snapshot, primaryFinding),
    suspectedCause: buildSuspectedCause(snapshot, primaryFinding),
    primaryFinding,
    topFindings: sortedFindings.slice(0, 3),
    recommendedActions: buildActions(primaryFinding, snapshot),
    dataQuality: buildDataQuality(snapshot),
  };
}

export function executiveStatusTone(status: ObservabilityServiceStatus): ObservabilityTone {
  return toneFromServiceStatus(status);
}
