import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { Brand, Radii, Shadows, Typography } from '@/constants/theme';
import type {
  MacroAverages,
  MacroDistribution,
  ProgressScore,
  ProgressStreak,
  ProgressTrend,
} from '@/features/progress/progress-insights';

type Props = {
  score: ProgressScore;
  streak: ProgressStreak;
  trend: ProgressTrend;
  macroDistribution: MacroDistribution;
  macroAverages: MacroAverages;
  hydrationHitRate: number;
  activeDays: number;
  totalDays: number;
};

type Insight = {
  kind: 'positive' | 'attention' | 'info' | 'guide';
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
};

export function ProgressInsightCards({
  score,
  streak,
  trend,
  macroDistribution,
  macroAverages,
  hydrationHitRate,
  activeDays,
  totalDays,
}: Props) {
  const insights = buildInsights({
    score,
    streak,
    trend,
    macroDistribution,
    macroAverages,
    hydrationHitRate,
    activeDays,
    totalDays,
  });

  if (insights.length === 0) return null;

  return (
    <View style={s.shell}>
      <View style={s.header}>
        <View style={s.headerIcon}>
          <Ionicons name="sparkles" size={14} color={Brand.greenDeeper} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Seus insights</Text>
          <Text style={s.subtitle}>Observações automáticas sobre seu progresso</Text>
        </View>
      </View>

      <View style={s.list}>
        {insights.map((insight, idx) => (
          <InsightRow key={idx} insight={insight} />
        ))}
      </View>
    </View>
  );
}

function InsightRow({ insight }: { insight: Insight }) {
  const palette = PALETTE[insight.kind];
  return (
    <View style={[s.row, { borderLeftColor: palette.accent, backgroundColor: palette.bg }]}>
      <View style={[s.rowIcon, { backgroundColor: '#FFFFFF' }]}>
        <Ionicons name={insight.icon} size={14} color={palette.accent} />
      </View>
      <View style={s.rowCopy}>
        <Text style={[s.rowTitle, { color: palette.accent }]}>{insight.title}</Text>
        <Text style={s.rowText}>{insight.description}</Text>
      </View>
    </View>
  );
}

const PALETTE: Record<Insight['kind'], { accent: string; bg: string }> = {
  positive: { accent: Brand.fresh, bg: '#EEFBF2' },
  attention: { accent: Brand.mango, bg: '#FFF7E6' },
  info: { accent: Brand.hydration, bg: '#EDF6FB' },
  guide: { accent: Brand.greenDeeper, bg: Brand.mintSoft },
};

function buildInsights({
  score,
  streak,
  trend,
  macroDistribution,
  macroAverages,
  hydrationHitRate,
  activeDays,
  totalDays,
}: Props): Insight[] {
  const out: Insight[] = [];

  // Sem dados suficientes
  if (totalDays === 0 || activeDays === 0) {
    out.push({
      kind: 'guide',
      icon: 'flag-outline',
      title: 'Comece a registrar',
      description:
        'Adicione suas refeições e água durante pelo menos 3 dias para liberar análises personalizadas.',
    });
    return out;
  }

  // Sequência
  if (streak.current >= 7) {
    out.push({
      kind: 'positive',
      icon: 'flame',
      title: `${streak.current} dias em sequência`,
      description: 'Você está formando um hábito consistente. Siga assim e o score continua subindo.',
    });
  } else if (streak.current >= 3) {
    out.push({
      kind: 'info',
      icon: 'flame-outline',
      title: `Sequência de ${streak.current} dias`,
      description: `Mais ${Math.max(1, 7 - streak.current)} dias e você desbloqueia o bônus de consistência máximo.`,
    });
  } else if (streak.best >= 5 && streak.current < streak.best) {
    out.push({
      kind: 'attention',
      icon: 'refresh',
      title: 'Retomada à vista',
      description: `Seu recorde é ${streak.best} dias. Registre hoje para começar uma nova sequência.`,
    });
  }

  // Hidratação
  if (hydrationHitRate >= 0.75) {
    out.push({
      kind: 'positive',
      icon: 'water',
      title: 'Hidratação em dia',
      description: 'Você bate a meta de água em 3 de cada 4 dias registrados. Excelente.',
    });
  } else if (hydrationHitRate > 0 && hydrationHitRate < 0.4) {
    out.push({
      kind: 'attention',
      icon: 'water-outline',
      title: 'Hidratação pode melhorar',
      description: `Você atinge a meta em apenas ${Math.round(hydrationHitRate * 100)}% dos dias. Tente espalhar a água ao longo do dia.`,
    });
  }

  // Tendência
  if (trend === 'improving') {
    out.push({
      kind: 'positive',
      icon: 'trending-up',
      title: 'Progresso em alta',
      description: 'Seu engajamento subiu na segunda metade do período. Continue o ritmo.',
    });
  } else if (trend === 'declining') {
    out.push({
      kind: 'attention',
      icon: 'trending-down',
      title: 'Atenção: queda recente',
      description: 'A frequência de registros caiu nos últimos dias. Um pequeno passo hoje já ajuda a reverter.',
    });
  }

  // Macro distribution
  if (macroAverages.calories > 0) {
    if (macroDistribution.proteinPct < 0.15) {
      out.push({
        kind: 'attention',
        icon: 'barbell',
        title: 'Proteína baixa',
        description: `Apenas ${Math.round(macroDistribution.proteinPct * 100)}% das suas calorias vêm de proteína. Tente aumentar para 20-30%.`,
      });
    } else if (macroDistribution.proteinPct > 0.35) {
      out.push({
        kind: 'info',
        icon: 'barbell-outline',
        title: 'Perfil proteico elevado',
        description: 'Você mantém alta ingestão de proteína. Garanta variedade de fontes e hidratação extra.',
      });
    }

    if (macroDistribution.fatPct > 0.4) {
      out.push({
        kind: 'attention',
        icon: 'leaf-outline',
        title: 'Gorduras elevadas',
        description: `${Math.round(macroDistribution.fatPct * 100)}% das calorias vêm de gordura. Considere trocar algumas por carboidratos integrais.`,
      });
    }
  }

  // Score overall
  if (score.overall >= 80) {
    out.push({
      kind: 'positive',
      icon: 'trophy',
      title: 'Índice de progresso excelente',
      description: `Seu score está em ${score.overall}/100. Continue medindo para sustentar esse resultado.`,
    });
  }

  if (out.length === 0) {
    // fallback genérico positivo
    out.push({
      kind: 'info',
      icon: 'analytics-outline',
      title: 'Continue registrando',
      description: `Em ${totalDays} dias analisados, ${activeDays} tiveram registros. Mantenha o ritmo para refinar suas análises.`,
    });
  }

  return out.slice(0, 4);
}

const s = StyleSheet.create({
  shell: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.xxl,
    borderWidth: 1,
    borderColor: 'rgba(20,108,56,0.08)',
    padding: 18,
    gap: 14,
    ...Shadows.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.mintSoft,
  },
  title: {
    ...Typography.body,
    fontWeight: '800',
    fontSize: 15,
    color: Brand.text,
    letterSpacing: -0.2,
  },
  subtitle: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  list: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: Radii.lg,
    borderLeftWidth: 3,
  },
  rowIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowCopy: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    ...Typography.body,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.1,
  },
  rowText: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
    marginTop: 2,
  },
});
