import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Brand } from '@/constants/theme';
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
  const date = new Date(iso);
  return date.toLocaleTimeString();
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
    const unsubscribe = subscribeNetworkInspector((next) => {
      setState(next);
    });
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

export default function DevtoolsScreen() {
  const insets = useSafeAreaInsets();
  const networkState = useNetworkState();
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const logs = useMemo(() => networkState.logs, [networkState.logs]);

  function toggleExpand(id: string) {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }

  function renderItem({ item }: { item: NetworkInspectorLog }) {
    const expanded = !!expandedIds[item.id];
    const statusLabel = item.error
      ? 'ERR'
      : item.statusCode != null
        ? `${item.statusCode}`
        : '-';
    const requestBodyLabel = item.requestBodyTruncated
      ? `${prettyText(item.requestBody)}\n\n[request body truncated]`
      : prettyText(item.requestBody);
    const responseBodyLabel = item.responseBodyTruncated
      ? `${prettyText(item.responseBody)}\n\n[response body truncated]`
      : prettyText(item.responseBody);

    return (
      <Pressable style={s.card} onPress={() => toggleExpand(item.id)}>
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

      <View style={s.header}>
        <View>
          <Text style={s.title}>Devtools</Text>
          <Text style={s.subtitle}>
            Network inspector para request/response e performance.
          </Text>
        </View>
      </View>

      <View style={s.controlsRow}>
        <View style={s.controlItem}>
          <Text style={s.controlLabel}>Capture logs</Text>
          <Switch
            value={networkState.enabled}
            onValueChange={(value) => setNetworkInspectorEnabled(value)}
            trackColor={{ false: '#D1D5DB', true: Brand.green }}
            thumbColor="#FFFFFF"
          />
        </View>
        <Pressable style={s.clearBtn} onPress={clearNetworkInspectorLogs}>
          <Text style={s.clearBtnText}>Limpar</Text>
        </Pressable>
      </View>

      <Text style={s.counterText}>
        {logs.length} logs
      </Text>

      <FlatList
        data={logs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={s.listContent}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={s.emptyWrap}>
            <Text style={s.emptyText}>Sem logs ainda.</Text>
            <Text style={s.emptyHint}>Faca uma chamada de API para ver o trafego aqui.</Text>
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
    paddingHorizontal: 18,
  },
  header: {
    paddingTop: 14,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Brand.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: Brand.textSecondary,
    marginTop: 4,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 8,
    gap: 10,
  },
  controlItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Brand.card,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Brand.border,
  },
  controlLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Brand.text,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  clearBtn: {
    backgroundColor: Brand.danger,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  clearBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  counterText: {
    fontSize: 12,
    color: Brand.textSecondary,
    marginBottom: 8,
  },
  listContent: {
    paddingBottom: 40,
    gap: 10,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '700',
    color: Brand.text,
  },
  emptyHint: {
    fontSize: 13,
    color: Brand.textSecondary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: Brand.card,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: Brand.border,
    gap: 8,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  methodBadge: {
    backgroundColor: Brand.greenDark,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  methodBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '800',
  },
  metaText: {
    fontSize: 12,
    color: Brand.textSecondary,
  },
  urlText: {
    fontSize: 12,
    color: Brand.text,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 12,
    color: Brand.danger,
    fontWeight: '600',
  },
  detailsWrap: {
    borderTopWidth: 1,
    borderTopColor: Brand.border,
    paddingTop: 10,
    gap: 10,
  },
  detailBlock: {
    gap: 4,
  },
  detailTitle: {
    fontSize: 11,
    color: Brand.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  detailValue: {
    fontSize: 11,
    color: Brand.text,
    fontFamily: 'monospace',
  },
});
