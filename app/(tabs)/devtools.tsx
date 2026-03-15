import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { AppInput } from '@/components/app-input';
import { AudioNutritionAnalyzer } from '@/components/nutrition/audio-nutrition-analyzer';
import { PdfPlanAnalyzer } from '@/components/nutrition/pdf-plan-analyzer';
import { PhotoNutritionAnalyzer } from '@/components/nutrition/photo-nutrition-analyzer';
import { NutritionErrorModal } from '@/components/nutrition-error-modal';
import { Brand, Radii, Shadows, Typography } from '@/constants/theme';
import { useAsync } from '@/hooks/use-async';
import { getNutrition } from '@/services/nutrition';
import {
  clearNetworkInspectorLogs,
  getNetworkInspectorSnapshot,
  setNetworkInspectorEnabled,
  subscribeNetworkInspector,
  type NetworkInspectorLog,
} from '@/services/network-inspector';
import { setReviewSession } from '@/services/review-session';
import type { AttachmentItem } from '@/types/attachments';
import type { NutritionAnalysisResult } from '@/types/nutrition';
import type { PlanPdfAnalysisResult } from '@/types/plan';

type ToolView = 'search' | 'photo' | 'audio' | 'plan';
type Unit = 'g' | 'ml' | 'un';

const TOOL_ORDER: ToolView[] = ['search', 'photo', 'audio', 'plan'];
const UNITS: Unit[] = ['g', 'ml', 'un'];
const FOOD_CATEGORIES = [
  { id: 'frutas', label: 'Frutas', icon: 'nutrition-outline', tint: '#EAF8EE', query: 'banana' },
  { id: 'carnes', label: 'Carnes', icon: 'barbell-outline', tint: '#FFF0EB', query: 'frango grelhado' },
  { id: 'laticinios', label: 'Laticínios', icon: 'cafe-outline', tint: '#EEF4FF', query: 'iogurte natural' },
  { id: 'vegetais', label: 'Vegetais', icon: 'leaf-outline', tint: '#EAF7EA', query: 'brocolis cozido' },
  { id: 'graos', label: 'Grãos', icon: 'flower-outline', tint: '#FFF6E1', query: 'arroz integral' },
  { id: 'snacks', label: 'Snacks', icon: 'fast-food-outline', tint: '#F8EFE4', query: 'mix de castanhas' },
] as const;

function prettyText(value: string | null): string {
  if (!value) return '-';
  const text = value.trim();
  if (!text) return '-';
  try {
    const parsed = JSON.parse(text);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return value;
  }
}

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString();
}

function statusColor(log: NetworkInspectorLog): string {
  if (log.error) return Brand.danger;
  if (log.statusCode == null) return Brand.textSecondary;
  if (log.statusCode >= 500) return Brand.danger;
  if (log.statusCode >= 400) return '#D97706';
  return Brand.greenDark;
}

function useNetworkState() {
  const [state, setState] = useState(getNetworkInspectorSnapshot());
  useEffect(() => {
    const unsubscribe = subscribeNetworkInspector((next) => setState(next));
    return unsubscribe;
  }, []);
  return state;
}

function normalizeToolParam(raw: string | string[] | undefined): ToolView | null {
  const tool = Array.isArray(raw) ? raw[0] : raw;
  if (!tool) return null;
  if (TOOL_ORDER.includes(tool as ToolView)) {
    return tool as ToolView;
  }
  return null;
}

function DetailBlock({ title, value }: { title: string; value: string }) {
  return (
    <View style={s.detailBlock}>
      <Text style={s.detailTitle}>{title}</Text>
      <Text style={s.detailValue}>{value}</Text>
    </View>
  );
}

export default function ToolsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ tool?: string | string[] }>();
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
  const hasAppliedInitialParam = useRef(false);
  const showDeveloperDiagnostics = normalizedTool == null;

  useFocusEffect(
    useCallback(() => {
      if (normalizedTool) {
        setView(normalizedTool);
      }
    }, [normalizedTool]),
  );

  useEffect(() => {
    if (hasAppliedInitialParam.current) return;
    if (!normalizedTool) return;
    setView(normalizedTool);
    hasAppliedInitialParam.current = true;
  }, [normalizedTool]);

  function toggleExpand(id: string) {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  }

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

  function renderLogCard(item: NetworkInspectorLog) {
    const expanded = !!expandedIds[item.id];
    const statusLabel = item.error ? 'ERR' : item.statusCode != null ? `${item.statusCode}` : '-';
    const requestBodyLabel = item.requestBodyTruncated
      ? `${prettyText(item.requestBody)}\n\n[request body truncated]`
      : prettyText(item.requestBody);
    const responseBodyLabel = item.responseBodyTruncated
      ? `${prettyText(item.responseBody)}\n\n[response body truncated]`
      : prettyText(item.responseBody);

    return (
      <Pressable key={item.id} style={s.logCard} onPress={() => toggleExpand(item.id)}>
        <View style={s.cardTopRow}>
          <View style={s.methodBadge}>
            <Text style={s.methodBadgeText}>{item.method}</Text>
          </View>
          <Text style={[s.statusText, { color: statusColor(item) }]}>{statusLabel}</Text>
          <Text style={s.metaText}>{item.durationMs}ms</Text>
          <Text style={s.metaText}>{timeLabel(item.timestamp)}</Text>
        </View>

        <Text style={s.urlText} numberOfLines={expanded ? undefined : 2}>
          {item.url}
        </Text>

        {item.error ? <Text style={s.errorText}>{item.error}</Text> : null}

        {expanded ? (
          <View style={s.detailsWrap}>
            <DetailBlock title="request headers" value={prettyText(JSON.stringify(item.requestHeaders))} />
            <DetailBlock title="request body" value={requestBodyLabel} />
            <DetailBlock title="response headers" value={prettyText(JSON.stringify(item.responseHeaders))} />
            <DetailBlock title="response body" value={responseBodyLabel} />
          </View>
        ) : null}
      </Pressable>
    );
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={Brand.bg} />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={s.title}>{showDeveloperDiagnostics ? 'Ferramentas internas' : 'Consultas e análise'}</Text>
        <Text style={s.subtitle}>
          {showDeveloperDiagnostics
            ? 'Use esta área apenas para fluxos internos, diagnóstico e análise avançada.'
            : 'Busque alimentos ou envie uma foto para analisar sua refeição.'}
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.toolTabs}>
          <ToolTab label="Consultar" active={view === 'search'} onPress={() => setView('search')} />
          <ToolTab label="Foto" active={view === 'photo'} onPress={() => setView('photo')} />
          {showDeveloperDiagnostics ? <ToolTab label="Voz" active={view === 'audio'} onPress={() => setView('audio')} /> : null}
          {showDeveloperDiagnostics ? <ToolTab label="Plano" active={view === 'plan'} onPress={() => setView('plan')} /> : null}
        </ScrollView>

        {view === 'search' ? (
          <View style={s.card}>
            <Text style={s.sectionTitle}>Consulta de alimentos</Text>
            <Text style={s.sectionSubtitle}>Busque rapidamente e consulte calorias e macros.</Text>

            <View style={s.searchInputWrap}>
              <Ionicons style={s.searchIcon} name="search-outline" size={18} color={Brand.textSecondary} />
              <AppInput
                placeholder="Buscar banana, arroz, frango..."
                value={query}
                onChangeText={(text: string) => setQuery(text.replace(/[^a-zA-Z\s]/g, ''))}
                maxLength={50}
                style={s.searchInput}
              />
            </View>

            <View style={s.categoryRow}>
              {FOOD_CATEGORIES.map((item) => (
                <Pressable
                  key={item.id}
                  style={({ pressed }) => [s.categoryChip, { backgroundColor: item.tint }, pressed && s.categoryChipPressed]}
                  onPress={() => {
                    setQuery(item.query);
                    setQueryWeight('');
                    setQueryUnit('g');
                    nutrition.reset();
                  }}>
                  <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={14} color={Brand.text} />
                  <Text style={s.categoryChipLabel}>{item.label}</Text>
                </Pressable>
              ))}
            </View>

            <View style={s.queryWeightRow}>
              <View style={{ flex: 1 }}>
                <AppInput
                  placeholder="Quantidade"
                  value={queryWeight}
                  onChangeText={(text: string) => setQueryWeight(text.replace(/[^0-9.,]/g, ''))}
                  keyboardType="numeric"
                  maxLength={7}
                />
              </View>
              <View style={s.queryUnitRow}>
                {UNITS.map((unit) => (
                  <Pressable key={unit} style={[s.queryUnitBtn, queryUnit === unit && s.queryUnitBtnActive]} onPress={() => setQueryUnit(unit)}>
                    <Text style={[s.queryUnitText, queryUnit === unit && s.queryUnitTextActive]}>{unit}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <AppButton title="Consultar calorias" onPress={handleQuery} loading={nutrition.loading} disabled={!query.trim()} />

            {nutrition.data ? (
              <View style={s.resultBox}>
                <Text style={s.resultCal}>{nutrition.data.calories}</Text>
                <View style={s.resultMacros}>
                  <MacroPill label="proteina" value={nutrition.data.protein} color={Brand.macroProtein} bg={Brand.macroProteinBg} />
                  <MacroPill label="carboidrato" value={nutrition.data.carbs} color={Brand.macroCarb} bg={Brand.macroCarbBg} />
                  <MacroPill label="gordura" value={nutrition.data.fat} color={Brand.macroFat} bg={Brand.macroFatBg} />
                </View>
                <Pressable onPress={handleClearQuery}>
                  <Text style={s.resultClear}>Limpar consulta</Text>
                </Pressable>
              </View>
            ) : null}

            {nutrition.error ? (
              <NutritionErrorModal visible={!!nutrition.error} message={nutrition.error} onClose={() => nutrition.reset()} />
            ) : null}
          </View>
        ) : null}

        {view === 'photo' || view === 'audio' || view === 'plan' ? (
          <View style={s.analysisCard}>
            <View style={s.analysisGlowTop} />
            <View style={s.sectionHeader}>
              <View>
                <Text style={s.sectionTitle}>Analisar refeição</Text>
                <Text style={s.analysisSubtitle}>Envie uma foto para estimar calorias e macros da refeição.</Text>
              </View>
              <View style={s.analysisBadge}>
                <Ionicons name="sparkles-outline" size={14} color={Brand.greenDark} />
              </View>
            </View>

            <View style={s.analyzerTabRow}>
              <ToolTab label="Foto" active={view === 'photo'} onPress={() => setView('photo')} />
              {view === 'audio' ? <ToolTab label="Voz" active onPress={() => setView('audio')} /> : null}
              {view === 'plan' ? <ToolTab label="Plano alimentar" active onPress={() => setView('plan')} /> : null}
            </View>

            {view === 'photo' ? (
              <PhotoNutritionAnalyzer
                attachments={photoAttachments}
                onChangeAttachments={setPhotoAttachments}
                onRequiresReview={(result, payload) => handleNutritionNeedsReview('photo', result, payload)}
              />
            ) : null}
            {view === 'audio' ? (
              <AudioNutritionAnalyzer onRequiresReview={(result) => handleNutritionNeedsReview('audio', result)} />
            ) : null}
            {view === 'plan' ? (
              <PdfPlanAnalyzer
                attachments={planPdfAttachments}
                onChangeAttachments={setPlanPdfAttachments}
                onRequiresReview={handlePlanPdfNeedsReview}
              />
            ) : null}
          </View>
        ) : null}

        {showDeveloperDiagnostics ? (
          <>
            <View style={s.card}>
              <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>Diagnóstico de rede</Text>
                <Text style={s.counterText}>{logs.length} logs</Text>
              </View>
              <Text style={s.sectionSubtitle}>Use este bloco para depurar requests, respostas e performance.</Text>

              <View style={s.controlItem}>
                <Text style={s.controlLabel}>Capturar logs</Text>
                <Pressable
                  style={({ pressed }) => [s.toggleBtn, networkState.enabled && s.toggleBtnActive, pressed && s.toggleBtnPressed]}
                  onPress={() => setNetworkInspectorEnabled(!networkState.enabled)}>
                  <Text style={[s.toggleBtnText, networkState.enabled && s.toggleBtnTextActive]}>
                    {networkState.enabled ? 'Ligado' : 'Desligado'}
                  </Text>
                </Pressable>
              </View>

              <Pressable style={({ pressed }) => [s.clearBtn, pressed && s.clearBtnPressed]} onPress={clearNetworkInspectorLogs}>
                <Text style={s.clearBtnText}>Limpar logs</Text>
              </Pressable>
            </View>

            {logs.length === 0 ? (
              <View style={s.emptyWrap}>
                <Text style={s.emptyText}>Sem logs ainda.</Text>
                <Text style={s.emptyHint}>Faça chamadas de API para acompanhar tráfego e performance aqui.</Text>
              </View>
            ) : (
              <View style={s.logsWrap}>{logs.map((item) => renderLogCard(item))}</View>
            )}
          </>
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

function MacroPill({
  label,
  value,
  color,
  bg,
}: {
  label: string;
  value: string;
  color: string;
  bg: string;
}) {
  return (
    <View style={[s.pill, { backgroundColor: bg }]}>
      <Text style={[s.pillLabel, { color }]}>{label}</Text>
      <Text style={[s.pillValue, { color }]}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Brand.bg,
  },
  scroll: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 160,
    gap: 12,
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
    gap: 8,
    paddingRight: 10,
  },
  toolTab: {
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: '#D5E6D9',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  toolTabActive: {
    backgroundColor: '#E3F3E8',
    borderColor: '#BFDCC8',
  },
  toolTabText: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '700',
  },
  toolTabTextActive: {
    color: Brand.greenDeeper,
  },
  card: {
    backgroundColor: Brand.card,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: 16,
    gap: 12,
    ...Shadows.card,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    ...Typography.subtitle,
    color: Brand.text,
    fontWeight: '800',
  },
  sectionSubtitle: {
    ...Typography.helper,
    color: Brand.textSecondary,
    marginTop: -4,
  },
  searchInputWrap: {
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    left: 14,
    top: 18,
    zIndex: 1,
  },
  searchInput: {
    paddingLeft: 40,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: Brand.border,
    paddingVertical: 8,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryChipPressed: {
    opacity: 0.82,
  },
  categoryChipLabel: {
    ...Typography.caption,
    color: Brand.text,
    fontWeight: '700',
  },
  queryWeightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  queryUnitRow: {
    flexDirection: 'row',
    borderRadius: Radii.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Brand.border,
    backgroundColor: Brand.surfaceAlt,
  },
  queryUnitBtn: {
    minWidth: 42,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  queryUnitBtnActive: {
    backgroundColor: Brand.green,
  },
  queryUnitText: {
    ...Typography.body,
    fontSize: 13,
    color: Brand.textSecondary,
    fontWeight: '600',
  },
  queryUnitTextActive: {
    color: '#FFFFFF',
  },
  resultBox: {
    borderRadius: Radii.md,
    backgroundColor: Brand.surfaceSoft,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: 14,
    alignItems: 'center',
    gap: 10,
  },
  resultCal: {
    ...Typography.title,
    color: Brand.greenDark,
    fontSize: 27,
  },
  resultMacros: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  resultClear: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '700',
  },
  analysisCard: {
    backgroundColor: '#F8FBF7',
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: '#DFEBDD',
    padding: 16,
    gap: 12,
    overflow: 'hidden',
    ...Shadows.card,
  },
  analysisGlowTop: {
    position: 'absolute',
    top: -42,
    right: -32,
    width: 140,
    height: 140,
    borderRadius: 140,
    backgroundColor: '#E4F4E9',
  },
  analysisSubtitle: {
    ...Typography.caption,
    color: Brand.textSecondary,
    marginTop: 2,
  },
  analysisBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EBF6EE',
    borderWidth: 1,
    borderColor: '#D6EAD9',
  },
  analyzerTabRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: Radii.pill,
  },
  pillLabel: {
    ...Typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  pillValue: {
    ...Typography.caption,
    fontWeight: '700',
  },
  controlItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  controlLabel: {
    ...Typography.body,
    color: Brand.text,
    fontWeight: '700',
  },
  toggleBtn: {
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: Brand.border,
    backgroundColor: Brand.surfaceAlt,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  toggleBtnActive: {
    backgroundColor: Brand.green,
    borderColor: Brand.green,
  },
  toggleBtnPressed: {
    opacity: 0.85,
  },
  toggleBtnText: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '700',
  },
  toggleBtnTextActive: {
    color: '#FFFFFF',
  },
  clearBtn: {
    backgroundColor: '#FFEDEE',
    borderRadius: Radii.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnPressed: {
    opacity: 0.85,
  },
  clearBtnText: {
    ...Typography.body,
    color: Brand.danger,
    fontWeight: '700',
  },
  counterText: {
    ...Typography.caption,
    color: Brand.textSecondary,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.card,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Brand.border,
    paddingVertical: 26,
    paddingHorizontal: 24,
    gap: 8,
    ...Shadows.card,
  },
  emptyText: {
    ...Typography.subtitle,
    color: Brand.text,
    fontWeight: '700',
  },
  emptyHint: {
    ...Typography.body,
    color: Brand.textSecondary,
    textAlign: 'center',
  },
  logsWrap: {
    gap: 8,
  },
  logCard: {
    backgroundColor: Brand.card,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: 12,
    gap: 8,
    ...Shadows.card,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  methodBadge: {
    backgroundColor: Brand.greenDark,
    borderRadius: Radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  methodBadgeText: {
    ...Typography.caption,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  statusText: {
    ...Typography.caption,
    fontWeight: '800',
  },
  metaText: {
    ...Typography.caption,
    color: Brand.textSecondary,
  },
  urlText: {
    ...Typography.caption,
    color: Brand.text,
    fontWeight: '600',
    fontSize: 12,
  },
  errorText: {
    ...Typography.caption,
    color: Brand.danger,
    fontWeight: '600',
  },
  detailsWrap: {
    borderTopWidth: 1,
    borderTopColor: Brand.border,
    paddingTop: 10,
    gap: 8,
  },
  detailBlock: {
    gap: 4,
  },
  detailTitle: {
    ...Typography.caption,
    color: Brand.textSecondary,
    textTransform: 'uppercase',
    fontSize: 10,
  },
  detailValue: {
    color: Brand.text,
    fontFamily: 'monospace',
    fontSize: 11,
    lineHeight: 16,
  },
});
