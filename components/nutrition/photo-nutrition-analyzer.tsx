import Ionicons from '@expo/vector-icons/Ionicons';
import { type Dispatch, type SetStateAction, useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { AttachmentPickerField } from '@/components/attachments/attachment-picker-field';
import { Brand, Radii, Shadows, Typography } from '@/constants/theme';
import { ExploreMacroChip } from '@/features/explore/explore-macro-chip';
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
      <View style={s.header}>
        <View style={s.headerIcon}>
          <Ionicons name="camera" size={18} color={Brand.mango} />
        </View>
        <View style={s.headerCopy}>
          <Text style={s.eyebrow}>ANÁLISE POR IMAGEM</Text>
          <Text style={s.title}>Foto da refeição</Text>
          <Text style={s.subtitle}>Capture ou selecione uma foto para análise nutricional.</Text>
        </View>
      </View>

      <AttachmentPickerField
        context="meal"
        allowedKinds={['photo']}
        maxItems={1}
        value={attachments}
        onChange={onChangeAttachments}
        title="Foto"
      />

      <AnalyzeButton onPress={handleAnalyze} disabled={!canAnalyze} loading={analysis.loading} hasPhoto={!!selectedPhoto} />

      {analysis.error ? (
        <View style={s.errorBox}>
          <Ionicons name="alert-circle" size={16} color={Brand.danger} />
          <View style={s.errorCopy}>
            <Text style={s.errorText}>{analysis.error}</Text>
            <Pressable onPress={handleAnalyze} disabled={!canAnalyze}>
              <Text style={[s.retryText, !canAnalyze && s.retryDisabled]}>Tentar novamente</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {analysis.loading ? (
        <View style={s.loadingBox}>
          <ActivityIndicator size="small" color={Brand.greenDeeper} />
          <Text style={s.loadingText}>Analisando sua foto...</Text>
        </View>
      ) : null}

      {result && !result.precisaRevisao ? (
        <View style={s.resultBox}>
          <View style={s.resultHeader}>
            <View style={s.resultBadge}>
              <Ionicons name="checkmark-circle" size={14} color={Brand.greenDeeper} />
              <Text style={s.resultBadgeText}>RESULTADO</Text>
            </View>
            <Text style={s.resultDishName} numberOfLines={2}>
              {result.detectedDishName}
            </Text>
          </View>

          <View style={s.resultCaloriesRow}>
            <Text style={s.resultCalValue}>{result.nutrition.calories}</Text>
            <Text style={s.resultCalLabel}>calorias</Text>
          </View>

          <View style={s.resultMacros}>
            <ExploreMacroChip
              label="prot"
              value={result.nutrition.protein}
              color={Brand.macroProtein}
              bg={Brand.macroProteinBg}
              compact
            />
            <ExploreMacroChip
              label="carb"
              value={result.nutrition.carbs}
              color={Brand.macroCarb}
              bg={Brand.macroCarbBg}
              compact
            />
            <ExploreMacroChip
              label="gord"
              value={result.nutrition.fat}
              color={Brand.macroFat}
              bg={Brand.macroFatBg}
              compact
            />
          </View>

          {result.warnings.length > 0 ? (
            <View style={s.warningBox}>
              {result.warnings.map((warning, index) => (
                <View key={`${warning}-${index}`} style={s.warningRow}>
                  <Ionicons name="information-circle" size={14} color={Brand.warning} />
                  <Text style={s.warningText}>{warning}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

type AnalyzeButtonProps = {
  onPress: () => void;
  disabled: boolean;
  loading: boolean;
  hasPhoto: boolean;
};

function AnalyzeButton({ onPress, disabled, loading, hasPhoto }: AnalyzeButtonProps) {
  const isInactive = disabled && !loading;

  return (
    <Pressable
      style={({ pressed }) => [s.analyzeBtn, pressed && !disabled && s.analyzeBtnPressed, isInactive && s.analyzeBtnDisabled]}
      onPress={onPress}
      disabled={disabled}>
      {!isInactive ? (
        <View style={StyleSheet.absoluteFill}>
          <Svg width="100%" height="100%">
            <Defs>
              <LinearGradient id="photoAnalyzeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={Brand.fresh} stopOpacity="1" />
                <Stop offset="100%" stopColor={Brand.forest} stopOpacity="1" />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" rx="24" ry="24" fill="url(#photoAnalyzeGradient)" />
          </Svg>
        </View>
      ) : null}

      <View style={s.analyzeBtnInner}>
        {loading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <View style={[s.analyzeBtnIcon, isInactive && s.analyzeBtnIconDisabled]}>
            <Ionicons name="sparkles" size={16} color={isInactive ? Brand.textMuted : '#FFFFFF'} />
          </View>
        )}
        <Text style={[s.analyzeBtnText, isInactive && s.analyzeBtnTextDisabled]}>
          {loading ? 'Analisando...' : hasPhoto ? 'Analisar foto' : 'Selecione uma foto'}
        </Text>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  wrapper: {
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#FFF4DD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  eyebrow: {
    ...Typography.caption,
    fontSize: 10,
    color: Brand.mango,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  title: {
    ...Typography.subtitle,
    fontSize: 18,
    color: Brand.text,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  subtitle: {
    ...Typography.body,
    fontSize: 13,
    lineHeight: 18,
    color: Brand.textSecondary,
    fontWeight: '500',
  },
  analyzeBtn: {
    borderRadius: 24,
    minHeight: 52,
    overflow: 'hidden',
    justifyContent: 'center',
    ...Shadows.card,
  },
  analyzeBtnPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  analyzeBtnDisabled: {
    backgroundColor: Brand.surfaceAlt,
    borderWidth: 1,
    borderColor: Brand.border,
  },
  analyzeBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  analyzeBtnIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyzeBtnIconDisabled: {
    backgroundColor: 'transparent',
  },
  analyzeBtnText: {
    ...Typography.body,
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  analyzeBtnTextDisabled: {
    color: Brand.textMuted,
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  loadingText: {
    ...Typography.caption,
    fontSize: 12,
    color: Brand.textSecondary,
    fontWeight: '600',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FFF0F0',
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: '#F2C6CB',
    padding: 12,
  },
  errorCopy: {
    flex: 1,
    gap: 6,
  },
  errorText: {
    ...Typography.body,
    fontSize: 13,
    color: Brand.danger,
    fontWeight: '600',
    lineHeight: 18,
  },
  retryText: {
    ...Typography.caption,
    fontSize: 12,
    color: Brand.danger,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  retryDisabled: {
    opacity: 0.5,
  },
  resultBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: 'rgba(20,108,56,0.08)',
    padding: 16,
    gap: 12,
    ...Shadows.card,
  },
  resultHeader: {
    gap: 6,
  },
  resultBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: Radii.pill,
    backgroundColor: Brand.surfaceSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  resultBadgeText: {
    ...Typography.caption,
    fontSize: 10,
    color: Brand.greenDeeper,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  resultDishName: {
    ...Typography.subtitle,
    fontSize: 18,
    color: Brand.text,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  resultCaloriesRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  resultCalValue: {
    ...Typography.title,
    fontSize: 28,
    lineHeight: 32,
    color: Brand.greenDeeper,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  resultCalLabel: {
    ...Typography.caption,
    fontSize: 12,
    color: Brand.greenDark,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  resultMacros: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  warningBox: {
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: Brand.border,
    paddingTop: 10,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  warningText: {
    ...Typography.caption,
    fontSize: 12,
    color: Brand.warning,
    flex: 1,
    fontWeight: '600',
    lineHeight: 17,
  },
});
