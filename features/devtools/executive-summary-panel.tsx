import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Brand, Radii, Shadows, Typography } from '@/constants/theme';
import {
  executiveStatusTone,
  type ObservabilityDashboardTab,
  type ObservabilityExecutiveTarget,
  type ObservabilityExecutiveSummary,
} from '@/services/observability-summary';

import { ObservabilityStateBanner } from './observability-state-banner';

function toneColors(tone: ReturnType<typeof executiveStatusTone>) {
  if (tone === 'positive') return { bg: '#EAF8EE', border: '#C8E7D2', text: Brand.greenDark };
  if (tone === 'warning') return { bg: '#FFF3E3', border: '#F3D2A8', text: '#B96B00' };
  if (tone === 'critical') return { bg: '#FDE7E7', border: '#F5C2C2', text: Brand.danger };
  return { bg: Brand.bg, border: Brand.border, text: Brand.textSecondary };
}

function toneLabel(status: ObservabilityExecutiveSummary['overallStatus']) {
  if (status === 'healthy') return 'Estavel';
  if (status === 'warning') return 'Em alerta';
  if (status === 'critical') return 'Critico';
  return 'Sem conclusao';
}

function findingIcon(tab: ObservabilityDashboardTab) {
  if (tab === 'failures') return 'pulse-outline';
  if (tab === 'quality') return 'shield-checkmark-outline';
  if (tab === 'investigation') return 'flask-outline';
  return 'sparkles-outline';
}

export function ExecutiveSummaryPanel({
  summary,
  onSelectTarget,
}: {
  summary: ObservabilityExecutiveSummary;
  onSelectTarget: (target: ObservabilityExecutiveTarget) => void;
}) {
  const statusTone = executiveStatusTone(summary.overallStatus);
  const colors = toneColors(statusTone);

  return (
    <View style={s.card}>
      <View style={s.headerRow}>
        <View style={[s.statusPill, { backgroundColor: colors.bg, borderColor: colors.border }]}>
          <Text style={[s.statusPillText, { color: colors.text }]}>{toneLabel(summary.overallStatus)}</Text>
        </View>
        <Text style={s.kicker}>Resumo executivo</Text>
      </View>

      <Text style={s.headline}>{summary.headline}</Text>
      <Text style={s.subheadline}>{summary.subheadline}</Text>

      <ObservabilityStateBanner dataQuality={summary.dataQuality} />

      <View style={s.detailGrid}>
        <DetailCard title="Impacto" description={summary.impactSummary} />
        <DetailCard title="Suspeita" description={summary.suspectedCause} />
      </View>

      {summary.topFindings.length > 0 ? (
        <View style={s.findingsWrap}>
          <Text style={s.sectionTitle}>Principais achados</Text>
          {summary.topFindings.map((finding) => {
            const itemColors = toneColors(finding.tone);
            return (
              <Pressable
                key={finding.id}
                style={({ pressed }) => [
                  s.findingRow,
                  { backgroundColor: itemColors.bg, borderColor: itemColors.border },
                  pressed && s.pressed,
                ]}
                onPress={() => onSelectTarget(finding.target)}>
                <Ionicons name={findingIcon(finding.tab)} size={16} color={itemColors.text} />
                <View style={s.findingCopy}>
                  <Text style={[s.findingTitle, { color: itemColors.text }]}>{finding.title}</Text>
                  <Text style={s.findingDescription}>{finding.description}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <View style={s.actionsWrap}>
        {summary.recommendedActions.map((action) => (
          <Pressable
            key={action.id}
            style={({ pressed }) => [s.actionButton, pressed && s.pressed]}
            onPress={() => onSelectTarget(action.target)}>
            <Text style={s.actionLabel}>{action.label}</Text>
            <Text style={s.actionDescription}>{action.description}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function DetailCard({ title, description }: { title: string; description: string }) {
  return (
    <View style={s.detailCard}>
      <Text style={s.detailTitle}>{title}</Text>
      <Text style={s.detailDescription}>{description}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    borderRadius: Radii.xl,
    backgroundColor: Brand.card,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: 18,
    gap: 14,
    ...Shadows.card,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  statusPill: {
    borderRadius: Radii.pill,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusPillText: {
    ...Typography.caption,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  kicker: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '700',
  },
  headline: {
    ...Typography.title,
    color: Brand.text,
    fontWeight: '800',
  },
  subheadline: {
    ...Typography.body,
    color: Brand.textSecondary,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailCard: {
    minWidth: 150,
    flexGrow: 1,
    flexBasis: 160,
    borderRadius: Radii.lg,
    backgroundColor: Brand.bg,
    borderWidth: 1,
    borderColor: Brand.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 6,
  },
  detailTitle: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  detailDescription: {
    ...Typography.body,
    color: Brand.text,
    fontWeight: '600',
  },
  findingsWrap: {
    gap: 10,
  },
  sectionTitle: {
    ...Typography.body,
    color: Brand.text,
    fontWeight: '800',
  },
  findingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderRadius: Radii.lg,
    borderWidth: 1,
    padding: 14,
  },
  findingCopy: {
    flex: 1,
    gap: 4,
  },
  findingTitle: {
    ...Typography.body,
    fontWeight: '800',
  },
  findingDescription: {
    ...Typography.caption,
    color: Brand.textSecondary,
  },
  actionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionButton: {
    minWidth: 150,
    flexGrow: 1,
    flexBasis: 150,
    borderRadius: Radii.lg,
    backgroundColor: '#EAF8EE',
    borderWidth: 1,
    borderColor: '#C8E7D2',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  actionLabel: {
    ...Typography.body,
    color: Brand.greenDark,
    fontWeight: '800',
  },
  actionDescription: {
    ...Typography.caption,
    color: Brand.greenDark,
  },
  pressed: {
    opacity: 0.92,
  },
});
