import { type Dispatch, type SetStateAction, useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { AttachmentPickerField } from '@/components/attachments/attachment-picker-field';
import { AppButton } from '@/components/app-button';
import { Brand, Radii, Typography } from '@/constants/theme';
import { useAsync } from '@/hooks/use-async';
import { analyzePlanPdfAttachment } from '@/services/plan-pdf';
import type { AttachmentItem } from '@/types/attachments';
import type { PlanPdfAnalysisResult } from '@/types/plan';
import { resolvePrimaryPdfAttachment } from '@/utils/attachment-rules';

type Props = {
  attachments: AttachmentItem[];
  onChangeAttachments: Dispatch<SetStateAction<AttachmentItem[]>>;
  onRequiresReview: (result: PlanPdfAnalysisResult) => void;
};

export function PdfPlanAnalyzer({ attachments, onChangeAttachments, onRequiresReview }: Props) {
  const analysis = useAsync(analyzePlanPdfAttachment);
  const reviewHandledRef = useRef(false);

  const selectedPdf = useMemo(() => resolvePrimaryPdfAttachment(attachments), [attachments]);
  const canAnalyze = !!selectedPdf && !analysis.loading;
  const result = analysis.data;

  async function handleAnalyze() {
    if (!selectedPdf) return;
    await analysis.execute(selectedPdf);
  }

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
      <Text style={s.title}>Plano alimentar (PDF)</Text>
      <Text style={s.subtitle}>Envie seu arquivo para extrair seções e revisar o plano com IA.</Text>

      <AttachmentPickerField
        context="plan"
        allowedKinds={['pdf']}
        maxItems={1}
        value={attachments}
        onChange={onChangeAttachments}
        title="PDF do plano"
        subtitle="Mostra nome e tamanho antes do envio."
      />

      <AppButton title="Analisar PDF" onPress={handleAnalyze} disabled={!canAnalyze} loading={analysis.loading} />

      {analysis.loading ? (
        <View style={s.loadingBox}>
          <ActivityIndicator size="small" color={Brand.greenDark} />
          <Text style={s.loadingText}>Enviando PDF para análise...</Text>
        </View>
      ) : null}

      {analysis.error ? (
        <View style={s.errorBox}>
          <Text style={s.errorText}>{analysis.error}</Text>
          <Pressable onPress={handleAnalyze} disabled={!canAnalyze}>
            <Text style={[s.retryText, !canAnalyze && s.retryDisabled]}>Tentar novamente</Text>
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
          <Text style={s.resultMeta}>Seções detectadas: {result.sections.length}</Text>

          {result.warnings.length > 0 ? (
            <View style={s.warningBox}>
              {result.warnings.map((warning, index) => (
                <Text key={`${warning}-${index}`} style={s.warningText}>
                  • {warning}
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
    ...Typography.body,
    color: Brand.text,
    fontWeight: '700',
  },
  subtitle: {
    ...Typography.caption,
    color: Brand.textSecondary,
    marginTop: -6,
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    ...Typography.caption,
    color: Brand.textSecondary,
  },
  errorBox: {
    backgroundColor: '#FFEDEE',
    borderRadius: Radii.md,
    padding: 12,
    gap: 6,
  },
  errorText: {
    ...Typography.body,
    color: Brand.danger,
    fontSize: 14,
  },
  retryText: {
    ...Typography.caption,
    color: Brand.danger,
    fontWeight: '700',
  },
  retryDisabled: {
    opacity: 0.5,
  },
  resultBox: {
    backgroundColor: Brand.surfaceSoft,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: 12,
    gap: 6,
  },
  resultTitle: {
    ...Typography.body,
    color: Brand.greenDark,
    fontWeight: '700',
  },
  resultMeta: {
    ...Typography.caption,
    color: Brand.textSecondary,
  },
  warningBox: {
    gap: 4,
    marginTop: 2,
  },
  warningText: {
    ...Typography.caption,
    color: '#8A6D3B',
  },
});
