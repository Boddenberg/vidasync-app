import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ReturnHomeButton } from '@/components/return-home-button';
import { Brand, Shadows, Typography } from '@/constants/theme';
import { DevtoolsAnalysisCard } from '@/features/devtools/devtools-analysis-card';
import { DevtoolsSearchCard } from '@/features/devtools/devtools-search-card';
import { NetworkDiagnosticsSection } from '@/features/devtools/network-diagnostics-section';
import {
  normalizeModeParam,
  normalizeToolParam,
  type ToolView,
  type Unit,
  UNITS,
} from '@/features/devtools/devtools-utils';
import { useAsync } from '@/hooks/use-async';
import { getNutrition } from '@/services/nutrition';
import {
  clearNetworkInspectorLogs,
  getNetworkInspectorSnapshot,
  setNetworkInspectorEnabled,
  subscribeNetworkInspector,
} from '@/services/network-inspector';
import { setReviewSession } from '@/services/review-session';
import type { AttachmentItem } from '@/types/attachments';
import type { NutritionAnalysisResult } from '@/types/nutrition';
import type { PlanPdfAnalysisResult } from '@/types/plan';

function useNetworkState() {
  const [state, setState] = useState(getNetworkInspectorSnapshot());

  useEffect(() => {
    const unsubscribe = subscribeNetworkInspector((next) => setState(next));
    return unsubscribe;
  }, []);

  return state;
}

export default function ToolsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ tool?: string | string[]; mode?: string | string[]; from?: string | string[] }>();
  const networkState = useNetworkState();

  const [view, setView] = useState<ToolView>('search');
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState('');
  const [queryWeight, setQueryWeight] = useState('');
  const [queryUnit, setQueryUnit] = useState<Unit>('g');
  const [photoAttachments, setPhotoAttachments] = useState<AttachmentItem[]>([]);
  const [planPdfAttachments, setPlanPdfAttachments] = useState<AttachmentItem[]>([]);

  const nutrition = useAsync(getNutrition);
  const logs = useMemo(() => networkState.logs, [networkState.logs]);
  const normalizedTool = normalizeToolParam(params.tool);
  const diagnosticsMode = normalizeModeParam(params.mode);
  const fromParam = Array.isArray(params.from) ? params.from[0] : params.from;
  const hasAppliedInitialParam = useRef(false);
  const showLogsOnly = diagnosticsMode === 'logs';
  const showDeveloperDiagnostics = showLogsOnly || normalizedTool == null;
  const isFromHome = fromParam === 'home';

  useFocusEffect(
    useCallback(() => {
      if (normalizedTool && !showLogsOnly) {
        setView(normalizedTool);
      }
    }, [normalizedTool, showLogsOnly]),
  );

  useEffect(() => {
    if (hasAppliedInitialParam.current) return;
    if (!normalizedTool || showLogsOnly) return;

    setView(normalizedTool);
    hasAppliedInitialParam.current = true;
  }, [normalizedTool, showLogsOnly]);

  function handleQuery() {
    const name = query.trim();
    if (!name) return;

    Keyboard.dismiss();
    const weight = queryWeight.trim();
    const text = weight ? `${weight}${queryUnit} de ${name}` : name;
    nutrition.execute(text);
  }

  function handleClearQuery() {
    setQuery('');
    setQueryWeight('');
    setQueryUnit('g');
    nutrition.reset();
  }

  function handleNutritionNeedsReview(
    source: 'photo' | 'audio',
    result: NutritionAnalysisResult,
    payload?: { photoPreviewUri?: string | null; photoPayload?: string | null },
  ) {
    setReviewSession({
      kind: 'nutrition',
      source,
      createdAt: new Date().toISOString(),
      result,
      photoPreviewUri: payload?.photoPreviewUri ?? null,
      photoPayload: payload?.photoPayload ?? null,
    });
    router.push('/review/assistida' as any);
  }

  function handlePlanPdfNeedsReview(result: PlanPdfAnalysisResult) {
    setReviewSession({
      kind: 'plan',
      source: 'pdf',
      createdAt: new Date().toISOString(),
      result,
    });
    router.push('/review/assistida' as any);
  }

  function toggleExpand(id: string) {
    setExpandedIds((current) => ({ ...current, [id]: !current[id] }));
  }

  const screenTitle = showLogsOnly
    ? 'Logs de rede'
    : showDeveloperDiagnostics
      ? 'Ferramentas internas'
      : isFromHome
        ? view === 'photo'
          ? 'Registrar por foto'
          : 'Buscar alimento'
        : 'Consultas e análise';
  const screenSubtitle = showLogsOnly
    ? 'Acompanhe requests, respostas e erros do app em um só lugar.'
    : showDeveloperDiagnostics
      ? 'Use esta área apenas para fluxos internos, diagnóstico e análise avançada.'
      : isFromHome
        ? view === 'photo'
          ? 'Envie uma imagem para analisar a refeição e, se precisar, revise antes de salvar.'
          : 'Digite o nome do alimento para estimar os macros automaticamente.'
        : 'Busque alimentos ou envie uma foto para analisar sua refeição.';

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={Brand.bg} />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {isFromHome ? <ReturnHomeButton onPress={() => router.replace('/(tabs)' as any)} /> : null}
        <Text style={s.title}>{screenTitle}</Text>
        <Text style={s.subtitle}>{screenSubtitle}</Text>

        {!showLogsOnly ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.toolTabs}>
            <ToolTab label={isFromHome ? 'Buscar' : 'Consultar'} active={view === 'search'} onPress={() => setView('search')} />
            <ToolTab label="Foto" active={view === 'photo'} onPress={() => setView('photo')} />
            {showDeveloperDiagnostics ? <ToolTab label="Voz" active={view === 'audio'} onPress={() => setView('audio')} /> : null}
            {showDeveloperDiagnostics ? <ToolTab label="Plano" active={view === 'plan'} onPress={() => setView('plan')} /> : null}
          </ScrollView>
        ) : null}

        {!showLogsOnly && view === 'search' ? (
          <DevtoolsSearchCard
            query={query}
            queryWeight={queryWeight}
            queryUnit={queryUnit}
            units={UNITS}
            loading={nutrition.loading}
            error={nutrition.error}
            result={nutrition.data}
            onChangeQuery={(text) => setQuery(text.replace(/[^a-zA-ZÀ-ÿ\s]/g, ''))}
            onChangeWeight={(text) => setQueryWeight(text.replace(/[^0-9.,]/g, ''))}
            onChangeUnit={setQueryUnit}
            onSubmit={handleQuery}
            onClear={handleClearQuery}
            onResetError={() => nutrition.reset()}
          />
        ) : null}

        {!showLogsOnly && (view === 'photo' || view === 'audio' || view === 'plan') ? (
          <DevtoolsAnalysisCard
            view={view}
            photoAttachments={photoAttachments}
            planPdfAttachments={planPdfAttachments}
            onChangePhotoAttachments={setPhotoAttachments}
            onChangePlanPdfAttachments={setPlanPdfAttachments}
            onSelectView={setView}
            onNutritionNeedsReview={handleNutritionNeedsReview}
            onPlanNeedsReview={handlePlanPdfNeedsReview}
          />
        ) : null}

        {showDeveloperDiagnostics ? (
          <NetworkDiagnosticsSection
            logs={logs}
            enabled={networkState.enabled}
            expandedIds={expandedIds}
            title="Diagnóstico de rede"
            subtitle={
              showLogsOnly
                ? 'Use este bloco para acompanhar o tráfego real do app.'
                : 'Use este bloco para depurar requests, respostas e performance.'
            }
            onToggleEnabled={() => setNetworkInspectorEnabled(!networkState.enabled)}
            onClear={clearNetworkInspectorLogs}
            onToggleExpand={toggleExpand}
          />
        ) : null}
      </ScrollView>
    </View>
  );
}

function ToolTab({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[s.toolTab, active && s.toolTabActive]} onPress={onPress}>
      <Text style={[s.toolTabText, active && s.toolTabTextActive]}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Brand.bg,
  },
  scroll: {
    paddingHorizontal: 18,
    paddingBottom: 160,
    gap: 14,
  },
  title: {
    ...Typography.title,
    color: Brand.text,
    fontWeight: '800',
  },
  subtitle: {
    ...Typography.body,
    color: Brand.textSecondary,
    marginTop: -8,
  },
  toolTabs: {
    flexDirection: 'row',
    gap: 8,
  },
  toolTab: {
    borderRadius: 999,
    backgroundColor: Brand.card,
    borderWidth: 1,
    borderColor: Brand.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    ...Shadows.card,
  },
  toolTabActive: {
    backgroundColor: '#E7F6EC',
    borderColor: '#B7DCC2',
  },
  toolTabText: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '700',
  },
  toolTabTextActive: {
    color: Brand.greenDark,
  },
});
