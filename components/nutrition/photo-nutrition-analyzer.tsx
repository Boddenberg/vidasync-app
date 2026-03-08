import { type Dispatch, type SetStateAction, useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { AttachmentPickerField } from '@/components/attachments/attachment-picker-field';
import { AppButton } from '@/components/app-button';
import { Brand } from '@/constants/theme';
import { useAsync } from '@/hooks/use-async';
import { getNutritionFromPhoto } from '@/services/nutrition';
import type { AttachmentItem } from '@/types/attachments';
import type { NutritionAnalysisResult } from '@/types/nutrition';
import { resolvePrimaryImagePayload } from '@/utils/attachment-rules';

type Props = {
  attachments: AttachmentItem[];
  onChangeAttachments: Dispatch<SetStateAction<AttachmentItem[]>>;
  onRequiresReview: (result: NutritionAnalysisResult) => void;
};

/*
 * Experiencia de analise por foto para o dominio de calorias.
 *
 * Responsabilidades:
 * - coletar imagem (camera/galeria) com preview e remocao
 * - enviar foto ao BFF
 * - tratar loading, erro, retry e sucesso
 * - disparar navegacao para revisao quando precisa_revisao=true
 */
export function PhotoNutritionAnalyzer({
  attachments,
  onChangeAttachments,
  onRequiresReview,
}: Props) {
  const analysis = useAsync(getNutritionFromPhoto);
  const reviewHandledRef = useRef(false);

  const selectedImagePayload = useMemo(() => resolvePrimaryImagePayload(attachments), [attachments]);
  const canAnalyze = !!selectedImagePayload && !analysis.loading;

  async function handleAnalyze() {
    if (!selectedImagePayload) return;
    await analysis.execute(selectedImagePayload);
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
      <Text style={s.title}>Consultar calorias por foto</Text>
      <Text style={s.subtitle}>Tire uma foto ou escolha da galeria antes de enviar ao BFF.</Text>

      <AttachmentPickerField
        context="meal"
        allowedKinds={['photo']}
        maxItems={1}
        value={attachments}
        onChange={onChangeAttachments}
        title="Foto do prato"
        subtitle="Preview disponivel antes do envio."
      />

      <AppButton
        title="Analisar foto"
        onPress={handleAnalyze}
        disabled={!canAnalyze}
        loading={analysis.loading}
      />

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
          <Text style={s.resultCal}>{result.nutrition.calories}</Text>
          <View style={s.macroRow}>
            <Text style={s.macro}>Prot: {result.nutrition.protein}</Text>
            <Text style={s.macro}>Carb: {result.nutrition.carbs}</Text>
            <Text style={s.macro}>Gord: {result.nutrition.fat}</Text>
          </View>

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
  resultCal: {
    fontSize: 22,
    fontWeight: '700',
    color: Brand.greenDark,
  },
  macroRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  macro: {
    fontSize: 12,
    color: Brand.textSecondary,
    fontWeight: '600',
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
