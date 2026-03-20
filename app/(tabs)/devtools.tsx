import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ReturnHomeButton } from '@/components/return-home-button';
import { Brand, Shadows, Typography } from '@/constants/theme';
import { DevtoolsAnalysisCard } from '@/features/devtools/devtools-analysis-card';
import { DeveloperObservabilityDashboard } from '@/features/devtools/developer-observability-dashboard';
import { DevtoolsSearchCard } from '@/features/devtools/devtools-search-card';
import {
  normalizeModeParam,
  normalizeToolParam,
  type ToolView,
  type Unit,
  UNITS,
} from '@/features/devtools/devtools-utils';
import { useAsync } from '@/hooks/use-async';
import { useAuth } from '@/hooks/use-auth';
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
  const { user } = useAuth();
  const params = useLocalSearchParams<{
    tool?: string | string[];
    mode?: string | string[];
    from?: string | string[];
    date?: string | string[];
  }>();
  const networkState = useNetworkState();

  const [view, setView] = useState<ToolView>('search');
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
  const dateParam = Array.isArray(params.date) ? params.date[0] : params.date;
  const hasAppliedInitialParam = useRef(false);
  const showLogsOnly = diagnosticsMode === 'logs';
  const isFromHome = fromParam === 'home';
  const isDeveloper = Boolean(user?.isDeveloper);
  const wantsDeveloperHub = showLogsOnly || normalizedTool == null;
  const wantsRestrictedTool = normalizedTool === 'audio' || normalizedTool === 'plan';
  const showDeveloperHub = wantsDeveloperHub && isDeveloper;
  const showRestrictedState = (wantsDeveloperHub || wantsRestrictedTool) && !isDeveloper;
  const showReturnHomeButton = isFromHome || showDeveloperHub || showRestrictedState;

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
      targetDate: dateParam ?? null,
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

  const screenTitle = showRestrictedState
    ? 'Acesso restrito'
    : isFromHome
      ? view === 'photo'
        ? 'Registrar por foto'
        : 'Buscar alimento'
      : 'Consultas e analise';
  const screenSubtitle = showRestrictedState
    ? 'Esta area so aparece para usuarios com permissao de desenvolvedor liberada pelo backend.'
    : isFromHome
      ? view === 'photo'
        ? 'Envie uma imagem para analisar a refeicao e, se precisar, revise antes de salvar.'
        : 'Digite o nome do alimento para estimar os macros automaticamente.'
      : 'Busque alimentos ou envie uma foto para analisar sua refeicao.';

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={Brand.bg} />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {showReturnHomeButton ? <ReturnHomeButton onPress={() => router.replace('/(tabs)' as any)} /> : null}

        {!showDeveloperHub ? <Text style={s.title}>{screenTitle}</Text> : null}
        {!showDeveloperHub ? <Text style={s.subtitle}>{screenSubtitle}</Text> : null}

        {showDeveloperHub ? (
          <DeveloperObservabilityDashboard
            logs={logs}
            enabled={networkState.enabled}
            initialMode={diagnosticsMode}
            onToggleEnabled={() => setNetworkInspectorEnabled(!networkState.enabled)}
            onClearLogs={clearNetworkInspectorLogs}
          />
        ) : null}

        {showRestrictedState ? (
          <View style={s.restrictedCard}>
            <Text style={s.restrictedTitle}>Observabilidade bloqueada</Text>
            <Text style={s.restrictedText}>
              O app ja esta preparado para receber o campo `isDeveloper` vindo do backend. Quando ele vier como `true`,
              o botao e a tela passam a aparecer automaticamente para esse usuario.
            </Text>
          </View>
        ) : null}

        {!showLogsOnly && !showDeveloperHub && !showRestrictedState ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.toolTabs}>
            <ToolTab label={isFromHome ? 'Buscar' : 'Consultar'} active={view === 'search'} onPress={() => setView('search')} />
            <ToolTab label="Foto" active={view === 'photo'} onPress={() => setView('photo')} />
            {isDeveloper ? <ToolTab label="Voz" active={view === 'audio'} onPress={() => setView('audio')} /> : null}
            {isDeveloper ? <ToolTab label="Plano" active={view === 'plan'} onPress={() => setView('plan')} /> : null}
          </ScrollView>
        ) : null}

        {!showLogsOnly && !showDeveloperHub && !showRestrictedState && view === 'search' ? (
          <DevtoolsSearchCard
            query={query}
            queryWeight={queryWeight}
            queryUnit={queryUnit}
            units={UNITS}
            initialDate={dateParam}
            loading={nutrition.loading}
            error={nutrition.error}
            result={nutrition.data}
            onChangeQuery={(text) => setQuery(text.replace(/[^a-zA-ZÀ-ÿ\s]/g, ''))}
            onChangeWeight={(text) => setQueryWeight(text.replace(/[^0-9.,]/g, ''))}
            onChangeUnit={setQueryUnit}
            onSubmit={handleQuery}
            onClear={handleClearQuery}
            onResetError={() => nutrition.reset()}
            onMealSaved={() => {
              handleClearQuery();
              if (isFromHome) {
                router.replace('/(tabs)' as any);
              }
            }}
          />
        ) : null}

        {!showLogsOnly && !showDeveloperHub && !showRestrictedState && (view === 'photo' || view === 'audio' || view === 'plan') ? (
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
  restrictedCard: {
    borderRadius: 24,
    backgroundColor: Brand.card,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: 18,
    gap: 8,
    ...Shadows.card,
  },
  restrictedTitle: {
    ...Typography.subtitle,
    color: Brand.text,
    fontWeight: '800',
  },
  restrictedText: {
    ...Typography.body,
    color: Brand.textSecondary,
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
