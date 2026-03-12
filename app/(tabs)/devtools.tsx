import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StatusBar, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { Brand, Radii, Shadows, Typography } from '@/constants/theme';
import {
  clearNetworkInspectorLogs,
  getNetworkInspectorSnapshot,
  setNetworkInspectorEnabled,
  subscribeNetworkInspector,
  type NetworkInspectorLog,
} from '@/services/network-inspector';

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
  const networkState = useNetworkState();
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const logs = useMemo(() => networkState.logs, [networkState.logs]);

  function toggleExpand(id: string) {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function renderItem({ item }: { item: NetworkInspectorLog }) {
    const expanded = !!expandedIds[item.id];
    const statusLabel = item.error ? 'ERR' : item.statusCode != null ? `${item.statusCode}` : '-';
    const requestBodyLabel = item.requestBodyTruncated
      ? `${prettyText(item.requestBody)}\n\n[request body truncated]`
      : prettyText(item.requestBody);
    const responseBodyLabel = item.responseBodyTruncated
      ? `${prettyText(item.responseBody)}\n\n[response body truncated]`
      : prettyText(item.responseBody);

    return (
      <Pressable style={s.logCard} onPress={() => toggleExpand(item.id)}>
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

      <FlatList
        data={logs}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={s.listContent}
        ListHeaderComponent={
          <View style={s.headerContent}>
            <Text style={s.title}>Ferramentas</Text>
            <Text style={s.subtitle}>Atalhos do app e monitor de rede para diagnostico.</Text>

            <View style={s.quickToolsCard}>
              <Text style={s.quickToolsTitle}>Ferramentas rapidas</Text>
              <View style={s.quickToolsButtons}>
                <View style={{ flex: 1 }}>
                  <AppButton title="Calculadora IMC" onPress={() => router.push('/tools/imc' as any)} variant="secondary" />
                </View>
              </View>
            </View>

            <View style={s.controlsCard}>
              <View style={s.controlItem}>
                <Text style={s.controlLabel}>Capturar logs</Text>
                <Switch
                  value={networkState.enabled}
                  onValueChange={(value) => setNetworkInspectorEnabled(value)}
                  trackColor={{ false: '#D1D5DB', true: Brand.green }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <Pressable style={({ pressed }) => [s.clearBtn, pressed && s.clearBtnPressed]} onPress={clearNetworkInspectorLogs}>
                <Text style={s.clearBtnText}>Limpar logs</Text>
              </Pressable>
            </View>

            <Text style={s.counterText}>{logs.length} logs capturados</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={s.emptyWrap}>
            <Text style={s.emptyText}>Sem logs ainda.</Text>
            <Text style={s.emptyHint}>Faça chamadas de API para acompanhar trafego e performance aqui.</Text>
          </View>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Brand.bg,
  },
  headerContent: {
    paddingHorizontal: 18,
    paddingTop: 14,
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
    marginBottom: 14,
  },
  quickToolsCard: {
    backgroundColor: Brand.card,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: 14,
    gap: 10,
    ...Shadows.card,
  },
  quickToolsTitle: {
    ...Typography.subtitle,
    color: Brand.text,
    fontSize: 15,
    fontWeight: '700',
  },
  quickToolsButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  controlsCard: {
    marginTop: 12,
    backgroundColor: Brand.card,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: 14,
    gap: 12,
    ...Shadows.card,
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
    marginTop: 10,
    marginBottom: 10,
  },
  listContent: {
    paddingBottom: 160,
    gap: 8,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    gap: 8,
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
  logCard: {
    marginHorizontal: 18,
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
