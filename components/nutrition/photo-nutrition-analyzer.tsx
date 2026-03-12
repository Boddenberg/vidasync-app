import { type Dispatch, type SetStateAction, useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { AttachmentPickerField } from '@/components/attachments/attachment-picker-field';
import { AppButton } from '@/components/app-button';
import { Brand, Radii, Typography } from '@/constants/theme';
import { useAsync } from '@/hooks/use-async';
import { getNutritionFromPhoto } from '@/services/nutrition';
import type { AttachmentItem } from '@/types/attachments';
import type { NutritionAnalysisResult } from '@/types/nutrition';
import { resolvePrimaryImagePayload } from '@/utils/attachment-rules';

type Props = {
  attachments: AttachmentItem[];
  onChangeAttachments: Dispatch<SetStateAction<AttachmentItem[]>>;
  onRequiresReview: (
    result: NutritionAnalysisResult,
    payload?: { photoPreviewUri?: string | null; photoPayload?: string | null },
  ) => void;
};

export function PhotoNutritionAnalyzer({ attachments, onChangeAttachments, onRequiresReview }: Props) {
  const analysis = useAsync(getNutritionFromPhoto);
  const reviewHandledRef = useRef(false);

  const selectedPhoto = useMemo(
    () => attachments.find((attachment) => attachment.kind === 'photo' && attachment.status === 'success') ?? null,
    [attachments],
  );
  const selectedImagePayload = useMemo(() => resolvePrimaryImagePayload(attachments), [attachments]);
  const canAnalyze = !!selectedImagePayload && !!selectedPhoto && !analysis.loading;

  async function handleAnalyze() {
    if (!selectedImagePayload || !selectedPhoto) return;
    await analysis.execute({
      dataUri: selectedImagePayload,
      uri: selectedPhoto.uri,
      mimeType: selectedPhoto.mimeType,
      fileName: selectedPhoto.name,
      sizeBytes: selectedPhoto.sizeBytes,
    });
  }

  const result = analysis.data;

  useEffect(() => {
    if (!result || reviewHandledRef.current) return;
    reviewHandledRef.current = true;
    onRequiresReview(result, {
      photoPreviewUri: selectedPhoto?.uri ?? null,
      photoPayload: selectedImagePayload ?? null,
    });
    analysis.reset();
  }, [analysis, onRequiresReview, result, selectedImagePayload, selectedPhoto]);

  useEffect(() => {
    if (!result) {
      reviewHandledRef.current = false;
    }
  }, [result]);

  return (
    <View style={s.wrapper}>
      <Text style={s.title}>Foto da refeição</Text>
      <Text style={s.subtitle}>Capture ou selecione uma foto para análise nutricional.</Text>

      <AttachmentPickerField
        context="meal"
        allowedKinds={['photo']}
        maxItems={1}
        value={attachments}
        onChange={onChangeAttachments}
        title="Adicionar foto"
      />

      <AppButton title="Analisar foto" onPress={handleAnalyze} disabled={!canAnalyze} loading={analysis.loading} />

      {analysis.error ? (
        <View style={s.errorBox}>
          <Text style={s.errorText}>{analysis.error}</Text>
          <Pressable onPress={handleAnalyze} disabled={!canAnalyze}>
            <Text style={[s.retryText, !canAnalyze && s.retryDisabled]}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : null}

      {analysis.loading ? (
        <View style={s.loadingBox}>
          <ActivityIndicator size="small" color={Brand.greenDark} />
          <Text style={s.loadingText}>Processando imagem...</Text>
        </View>
      ) : null}

      {result && !result.precisaRevisao ? (
        <View style={s.resultBox}>
          <Text style={s.resultDishName}>{result.detectedDishName}</Text>
          <Text style={s.resultCal}>{result.nutrition.calories}</Text>
          <View style={s.macroRow}>
            <MacroText text={`Prot: ${result.nutrition.protein}`} />
            <MacroText text={`Carb: ${result.nutrition.carbs}`} />
            <MacroText text={`Gord: ${result.nutrition.fat}`} />
          </View>

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

function MacroText({ text }: { text: string }) {
  return (
    <View style={s.macroTag}>
      <Text style={s.macro}>{text}</Text>
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
    gap: 8,
  },
  resultDishName: {
    ...Typography.body,
    color: Brand.text,
    fontWeight: '700',
  },
  resultCal: {
    ...Typography.subtitle,
    color: Brand.greenDark,
    fontWeight: '800',
  },
  macroRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  macroTag: {
    borderRadius: Radii.pill,
    backgroundColor: Brand.card,
    borderWidth: 1,
    borderColor: Brand.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  macro: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '700',
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
