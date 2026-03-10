import { useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { AttachmentPickerField } from '@/components/attachments/attachment-picker-field';
import { AppButton } from '@/components/app-button';
import { Brand } from '@/constants/theme';
import { useAsync } from '@/hooks/use-async';
import { analyzePlanPdfAttachment } from '@/services/plan-pdf';
import type { AttachmentItem } from '@/types/attachments';
import type { PlanPdfAnalysisResult } from '@/types/plan';
import { resolvePrimaryPdfAttachment } from '@/utils/attachment-rules';

type Props = {
  attachments: AttachmentItem[];
  onChangeAttachments: React.Dispatch<React.SetStateAction<AttachmentItem[]>>;
  onRequiresReview: (result: PlanPdfAnalysisResult) => void;
};

/*
 * Experiencia de analise de plano alimentar por PDF.
 *
 * Responsabilidades:
 * - selecionar PDF
 * - exibir nome/tamanho e permitir remocao
 * - enviar ao BFF com loading/erro/retry
 * - encaminhar para revisao quando precisa_revisao=true
 */
export function PdfPlanAnalyzer({
  attachments,
  onChangeAttachments,
  onRequiresReview,
}: Props) {
  const analysis = useAsync(analyzePlanPdfAttachment);
  const reviewHandledRef = useRef(false);

  const selectedPdf = useMemo(
    () => resolvePrimaryPdfAttachment(attachments),
    [attachments],
  );
  const canAnalyze = !!selectedPdf && !analysis.loading;

  async function handleAnalyze() {
    if (!selectedPdf) return;
    await analysis.execute(selectedPdf);
  }

  const result = analysis.data;

  useEffect(() => {
    if (!result?.precisaRevisao || reviewHandledRef.current) return;
    reviewHandledRef.current = true;
    onRequiresReview(result);
    analysis.reset();
  }, [analysis, onRequiresReview, result]);

  useEffect(() => {
    if (!result) {
      reviewHandledRef.current = false;
    }
  }, [result]);

  return (
    <View style={s.wrapper}>
      <Text style={s.title}>Analisar plano (PDF)</Text>
      <Text style={s.subtitle}>
        Selecione um PDF do dispositivo para analisar seu plano alimentar.
      </Text>

      <AttachmentPickerField
        context="plan"
        allowedKinds={['pdf']}
        maxItems={1}
        value={attachments}
        onChange={onChangeAttachments}
        title="PDF do plano"
        subtitle="Mostra nome e tamanho do arquivo antes do envio."
      />

      <AppButton
        title="Enviar PDF"
        onPress={handleAnalyze}
        disabled={!canAnalyze}
        loading={analysis.loading}
      />

      {analysis.loading ? (
        <View style={s.loadingBox}>
          <ActivityIndicator size="small" color={Brand.greenDark} />
          <Text style={s.loadingText}>Enviando PDF para analise...</Text>
        </View>
      ) : null}

      {analysis.error ? (
        <View style={s.errorBox}>
          <Text style={s.errorText}>{analysis.error}</Text>
          <Pressable onPress={handleAnalyze} disabled={!canAnalyze}>
            <Text style={[s.retryText, !canAnalyze && s.retryDisabled]}>
              Tentar novamente
            </Text>
          </Pressable>
        </View>
      ) : null}

      {result && !result.precisaRevisao ? (
        <View style={s.resultBox}>
          <Text style={s.resultTitle}>PDF processado</Text>
          <Text style={s.resultMeta}>
            Arquivo: {result.fileName}
            {result.fileSizeBytes ? ` (${Math.round(result.fileSizeBytes / 1024)} KB)` : ''}
          </Text>
          <Text style={s.resultMeta}>
            Secoes detectadas: {result.sections.length}
          </Text>

          {result.warnings.length > 0 ? (
            <View style={s.warningBox}>
              {result.warnings.map((warning, index) => (
                <Text key={`${warning}-${index}`} style={s.warningText}>
                  - {warning}
                </Text>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: {
    gap: 10,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: Brand.text,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  subtitle: {
    fontSize: 12,
    color: Brand.textSecondary,
    marginTop: -4,
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: Brand.textSecondary,
  },
  errorBox: {
    backgroundColor: '#FFF0F0',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  errorText: {
    fontSize: 13,
    color: Brand.danger,
  },
  retryText: {
    fontSize: 13,
    fontWeight: '700',
    color: Brand.danger,
  },
  retryDisabled: {
    opacity: 0.5,
  },
  resultBox: {
    backgroundColor: Brand.bg,
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Brand.greenDark,
  },
  resultMeta: {
    fontSize: 12,
    color: Brand.textSecondary,
  },
  warningBox: {
    gap: 4,
    marginTop: 2,
  },
  warningText: {
    fontSize: 12,
    color: '#8A6D3B',
  },
});

