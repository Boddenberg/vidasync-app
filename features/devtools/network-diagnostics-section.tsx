import * as Clipboard from 'expo-clipboard';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Brand, Radii, Shadows, Typography } from '@/constants/theme';
import {
  prettyText,
  statusColor,
  timeLabel,
} from '@/features/devtools/devtools-utils';
import type { NetworkInspectorLog } from '@/services/network-inspector';
import {
  serializeNetworkInspectorLog,
  serializeNetworkInspectorLogs,
} from '@/utils/network-inspector-clipboard';

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

const COPY_FEEDBACK_TIMEOUT_MS = 2200;

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
  const [copyFeedback, setCopyFeedback] = useState<{ id: string; message: string } | null>(null);
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);

  function showCopyFeedback(id: string, message: string) {
    setCopyFeedback({ id, message });

    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }

    feedbackTimeoutRef.current = setTimeout(() => {
      setCopyFeedback(null);
      feedbackTimeoutRef.current = null;
    }, COPY_FEEDBACK_TIMEOUT_MS);
  }

  async function handleCopyAllLogs() {
    try {
      await Clipboard.setStringAsync(serializeNetworkInspectorLogs(logs));
      showCopyFeedback('all', `${logs.length} logs copiados.`);
    } catch {
      showCopyFeedback('error', 'Nao foi possivel copiar os logs agora.');
    }
  }

  async function handleCopyLog(item: NetworkInspectorLog) {
    try {
      await Clipboard.setStringAsync(serializeNetworkInspectorLog(item));
      showCopyFeedback(item.id, `Log ${item.method} copiado.`);
    } catch {
      showCopyFeedback('error', 'Nao foi possivel copiar este log agora.');
    }
  }

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

        <View style={s.actionRow}>
          <Pressable
            style={({ pressed }) => [
              s.actionBtn,
              logs.length === 0 && s.actionBtnDisabled,
              pressed && logs.length > 0 && s.actionBtnPressed,
            ]}
            onPress={() => void handleCopyAllLogs()}
            disabled={logs.length === 0}>
            <Text style={[s.actionBtnText, logs.length === 0 && s.actionBtnTextDisabled]}>
              {copyFeedback?.id === 'all' ? 'Copiado' : 'Copiar todos'}
            </Text>
          </Pressable>

          <Pressable style={({ pressed }) => [s.actionBtn, pressed && s.actionBtnPressed]} onPress={onClear}>
            <Text style={s.actionBtnText}>Limpar logs</Text>
          </Pressable>
        </View>

        {copyFeedback ? <Text style={s.copyFeedback}>{copyFeedback.message}</Text> : null}
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
              onCopyLog={() => void handleCopyLog(item)}
              copyLabel={copyFeedback?.id === item.id ? 'Copiado' : 'Copiar log'}
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
  onCopyLog,
  copyLabel,
}: {
  item: NetworkInspectorLog;
  expanded: boolean;
  onToggleExpand: () => void;
  onCopyLog: () => void;
  copyLabel: string;
}) {
  const statusLabel = item.error ? 'ERR' : item.statusCode != null ? `${item.statusCode}` : '-';
  const requestBodyLabel = item.requestBodyTruncated
    ? `${prettyText(item.requestBody)}\n\n[request body truncated]`
    : prettyText(item.requestBody);
  const responseBodyLabel = item.responseBodyTruncated
    ? `${prettyText(item.responseBody)}\n\n[response body truncated]`
    : prettyText(item.responseBody);

  return (
    <View style={s.logCard}>
      <Pressable style={({ pressed }) => [s.logSummaryBtn, pressed && s.logSummaryBtnPressed]} onPress={onToggleExpand}>
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
      </Pressable>

      <View style={s.logActionRow}>
        <Pressable style={({ pressed }) => [s.logActionBtn, pressed && s.actionBtnPressed]} onPress={onToggleExpand}>
          <Text style={s.logActionBtnText}>{expanded ? 'Recolher' : 'Expandir'}</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [s.logActionBtn, s.logActionBtnAccent, pressed && s.actionBtnPressed]}
          onPress={onCopyLog}>
          <Text style={[s.logActionBtnText, s.logActionBtnTextAccent]}>{copyLabel}</Text>
        </Pressable>
      </View>

      {expanded ? (
        <View style={s.detailsWrap}>
          <DetailBlock title="request headers" value={prettyText(JSON.stringify(item.requestHeaders))} />
          <DetailBlock title="request body" value={requestBodyLabel} />
          <DetailBlock title="response headers" value={prettyText(JSON.stringify(item.responseHeaders))} />
          <DetailBlock title="response body" value={responseBodyLabel} />
        </View>
      ) : null}
    </View>
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
  actionRow: {
    flexDirection: 'row',
    gap: 10,
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
  actionBtn: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: Brand.bg,
    borderWidth: 1,
    borderColor: Brand.border,
    paddingVertical: 13,
    alignItems: 'center',
  },
  actionBtnDisabled: {
    opacity: 0.6,
  },
  actionBtnPressed: {
    opacity: 0.9,
  },
  actionBtnText: {
    ...Typography.body,
    color: Brand.text,
    fontWeight: '700',
  },
  actionBtnTextDisabled: {
    color: Brand.textMuted,
  },
  copyFeedback: {
    ...Typography.caption,
    color: Brand.greenDark,
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
    gap: 12,
    ...Shadows.card,
  },
  logSummaryBtn: {
    gap: 10,
  },
  logSummaryBtnPressed: {
    opacity: 0.94,
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
  logActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  logActionBtn: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Brand.border,
    backgroundColor: Brand.bg,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  logActionBtnAccent: {
    backgroundColor: '#EAF8EE',
    borderColor: '#C8E7D2',
  },
  logActionBtnText: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '800',
  },
  logActionBtnTextAccent: {
    color: Brand.greenDark,
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
