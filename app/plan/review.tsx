import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AppButton } from '@/components/app-button';
import { Brand } from '@/constants/theme';
import {
  clearPlanReviewSession,
  getPlanReviewSession,
} from '@/services/plan-review-session';

/*
 * Tela de revisao para analise de plano por PDF.
 *
 * Mostra warnings e secoes extraidas para validacao humana
 * quando precisa_revisao=true.
 */
export default function PlanReviewScreen() {
  const router = useRouter();
  const session = getPlanReviewSession();

  function handleClose() {
    clearPlanReviewSession();
    router.back();
  }

  return (
    <View style={s.root}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.title}>Revisão do plano alimentar</Text>
        <Text style={s.subtitle}>
          Validar os dados antes de usar no fluxo final.
        </Text>

        {!session ? (
          <View style={s.emptyBox}>
            <Text style={s.emptyText}>Nenhum dado de revisão disponível.</Text>
          </View>
        ) : (
          <>
            <View style={s.summaryCard}>
              <Text style={s.summaryTitle}>{session.result.fileName}</Text>
              <Text style={s.summaryMeta}>
                Seções detectadas: {session.result.sections.length}
              </Text>
              {session.result.traceId ? (
                <Text style={s.summaryMeta}>trace_id: {session.result.traceId}</Text>
              ) : null}
            </View>

            {session.result.warnings.length > 0 ? (
              <View style={s.warningCard}>
                <Text style={s.sectionTitle}>Warnings</Text>
                {session.result.warnings.map((warning, index) => (
                  <Text key={`${warning}-${index}`} style={s.warningText}>
                    - {warning}
                  </Text>
                ))}
              </View>
            ) : null}

            <View style={s.sectionCard}>
              <Text style={s.sectionTitle}>Seções extraídas</Text>
              {session.result.sections.map((section, index) => (
                <View key={`${section.title}-${index}`} style={s.sectionRow}>
                  <Text style={s.sectionName}>{section.title}</Text>
                  <Text style={s.sectionText}>{section.text}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <View style={s.footer}>
        <AppButton title="Voltar" onPress={handleClose} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Brand.bg,
  },
  scroll: {
    padding: 20,
    gap: 12,
    paddingBottom: 110,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Brand.text,
  },
  subtitle: {
    fontSize: 13,
    color: Brand.textSecondary,
  },
  emptyBox: {
    backgroundColor: Brand.card,
    borderRadius: 14,
    padding: 14,
  },
  emptyText: {
    color: Brand.textSecondary,
    fontSize: 13,
  },
  summaryCard: {
    backgroundColor: Brand.card,
    borderRadius: 14,
    padding: 14,
    gap: 6,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Brand.text,
  },
  summaryMeta: {
    fontSize: 12,
    color: Brand.textSecondary,
  },
  warningCard: {
    backgroundColor: '#FFF7E6',
    borderRadius: 14,
    padding: 14,
    gap: 6,
  },
  sectionCard: {
    backgroundColor: Brand.card,
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Brand.text,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  warningText: {
    fontSize: 12,
    color: '#8A6D3B',
  },
  sectionRow: {
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: Brand.border,
    paddingBottom: 10,
  },
  sectionName: {
    fontSize: 14,
    fontWeight: '700',
    color: Brand.text,
  },
  sectionText: {
    fontSize: 12,
    color: Brand.textSecondary,
    lineHeight: 18,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Brand.bg,
    borderTopWidth: 1,
    borderTopColor: Brand.border,
  },
});
