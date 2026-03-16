import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Brand, Radii, Shadows, Typography } from '@/constants/theme';
import { prettyText, statusColor, timeLabel } from '@/features/devtools/devtools-utils';
import type { NetworkInspectorLog } from '@/services/network-inspector';

type Props = {
  logs: NetworkInspectorLog[];
  enabled: boolean;
  expandedIds: Record<string, boolean>;
  title: string;
  subtitle: string;
  onToggleEnabled: () => void;
  onClear: () => void;
  onToggleExpand: (id: string) => void;
};

export function NetworkDiagnosticsSection({
  logs,
  enabled,
  expandedIds,
  title,
  subtitle,
  onToggleEnabled,
  onClear,
  onToggleExpand,
}: Props) {
  return (
    <>
      <View style={s.card}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>{title}</Text>
          <Text style={s.counterText}>{logs.length} logs</Text>
        </View>
        <Text style={s.sectionSubtitle}>{subtitle}</Text>

        <View style={s.controlItem}>
          <Text style={s.controlLabel}>Capturar logs</Text>
          <Pressable
            style={({ pressed }) => [s.toggleBtn, enabled && s.toggleBtnActive, pressed && s.toggleBtnPressed]}
            onPress={onToggleEnabled}>
            <Text style={[s.toggleBtnText, enabled && s.toggleBtnTextActive]}>
              {enabled ? 'Ligado' : 'Desligado'}
            </Text>
          </Pressable>
        </View>

        <Pressable style={({ pressed }) => [s.clearBtn, pressed && s.clearBtnPressed]} onPress={onClear}>
          <Text style={s.clearBtnText}>Limpar logs</Text>
        </Pressable>
      </View>

      {logs.length === 0 ? (
        <View style={s.emptyWrap}>
          <Text style={s.emptyText}>Sem logs ainda.</Text>
          <Text style={s.emptyHint}>Faca chamadas de API para acompanhar trafego e performance aqui.</Text>
        </View>
      ) : (
        <View style={s.logsWrap}>
          {logs.map((item) => (
            <LogCard
              key={item.id}
              item={item}
              expanded={!!expandedIds[item.id]}
              onToggleExpand={() => onToggleExpand(item.id)}
            />
          ))}
        </View>
      )}
    </>
  );
}

function LogCard({
  item,
  expanded,
  onToggleExpand,
}: {
  item: NetworkInspectorLog;
  expanded: boolean;
  onToggleExpand: () => void;
}) {
  const statusLabel = item.error ? 'ERR' : item.statusCode != null ? `${item.statusCode}` : '-';
  const requestBodyLabel = item.requestBodyTruncated
    ? `${prettyText(item.requestBody)}\n\n[request body truncated]`
    : prettyText(item.requestBody);
  const responseBodyLabel = item.responseBodyTruncated
    ? `${prettyText(item.responseBody)}\n\n[response body truncated]`
    : prettyText(item.responseBody);

  return (
    <Pressable style={s.logCard} onPress={onToggleExpand}>
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

function DetailBlock({ title, value }: { title: string; value: string }) {
  return (
    <View style={s.detailBlock}>
      <Text style={s.detailTitle}>{title}</Text>
      <Text style={s.detailValue}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: Brand.card,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: 18,
    gap: 14,
    ...Shadows.card,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  sectionTitle: {
    ...Typography.subtitle,
    color: Brand.text,
    fontWeight: '800',
  },
  counterText: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '700',
  },
  sectionSubtitle: {
    ...Typography.body,
    color: Brand.textSecondary,
  },
  controlItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  controlLabel: {
    ...Typography.body,
    color: Brand.text,
    fontWeight: '600',
  },
  toggleBtn: {
    minWidth: 90,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: Brand.bg,
    borderWidth: 1,
    borderColor: Brand.border,
  },
  toggleBtnActive: {
    backgroundColor: '#E7F6EC',
    borderColor: '#B7DCC2',
  },
  toggleBtnPressed: {
    opacity: 0.9,
  },
  toggleBtnText: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '700',
  },
  toggleBtnTextActive: {
    color: Brand.greenDark,
  },
  clearBtn: {
    borderRadius: 14,
    backgroundColor: Brand.bg,
    borderWidth: 1,
    borderColor: Brand.border,
    paddingVertical: 13,
    alignItems: 'center',
  },
  clearBtnPressed: {
    opacity: 0.9,
  },
  clearBtnText: {
    ...Typography.body,
    color: Brand.text,
    fontWeight: '700',
  },
  emptyWrap: {
    borderRadius: Radii.xl,
    backgroundColor: Brand.card,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: 18,
    gap: 6,
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
  },
  logsWrap: {
    gap: 12,
  },
  logCard: {
    borderRadius: Radii.xl,
    backgroundColor: Brand.card,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: 16,
    gap: 10,
    ...Shadows.card,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  methodBadge: {
    borderRadius: 999,
    backgroundColor: '#E7F6EC',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  methodBadgeText: {
    ...Typography.caption,
    color: Brand.greenDark,
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
    ...Typography.body,
    color: Brand.text,
    fontWeight: '600',
  },
  errorText: {
    ...Typography.body,
    color: Brand.danger,
  },
  detailsWrap: {
    gap: 10,
  },
  detailBlock: {
    borderRadius: 16,
    backgroundColor: Brand.bg,
    padding: 12,
    gap: 6,
  },
  detailTitle: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  detailValue: {
    ...Typography.caption,
    color: Brand.text,
  },
});
