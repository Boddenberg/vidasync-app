import { useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { Brand, Radii, Typography } from '@/constants/theme';
import { useAsync } from '@/hooks/use-async';
import { useAudioCapture } from '@/hooks/use-audio-capture';
import { getNutritionFromAudio } from '@/services/nutrition-audio';
import type { NutritionAnalysisResult } from '@/types/nutrition';

function formatDuration(durationMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type Props = {
  onRequiresReview: (result: NutritionAnalysisResult) => void;
};

export function AudioNutritionAnalyzer({ onRequiresReview }: Props) {
  const capture = useAudioCapture();
  const analysis = useAsync(getNutritionFromAudio);
  const reviewHandledRef = useRef(false);

  const draftDuration = capture.draft?.durationMs ?? capture.recordDurationMs;
  const result = analysis.data;
  const canSend = !!capture.draft && !analysis.loading;

  const recordingLabel = useMemo(() => {
    if (capture.captureState === 'recording') return `Gravando ${formatDuration(capture.recordDurationMs)}`;
    if (capture.captureState === 'paused') return `Pausado ${formatDuration(capture.recordDurationMs)}`;
    if (capture.captureState === 'ready' && capture.draft) return `Pronto ${formatDuration(capture.draft.durationMs)}`;
    return 'Nenhum audio gravado';
  }, [capture.captureState, capture.draft, capture.recordDurationMs]);

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

  async function handleSendAudio() {
    if (!capture.draft) return;
    await analysis.execute(capture.draft);
  }

  return (
    <View style={s.wrapper}>
      <Text style={s.title}>Voz</Text>
      <Text style={s.subtitle}>Grave sua refeicao e envie para análise automática.</Text>

      <View style={s.stateRow}>
        <Text style={s.stateText}>{recordingLabel}</Text>
        {capture.permissionGranted === false ? <Text style={s.permissionWarning}>Microfone sem permissao</Text> : null}
      </View>

      <View style={s.controlsRow}>
        {capture.canRecord ? (
          <ActionChip title="Iniciar" active onPress={capture.startRecording} />
        ) : null}
        {capture.canPause ? <ActionChip title="Pausar" onPress={capture.pauseRecording} /> : null}
        {capture.canResume ? <ActionChip title="Continuar" onPress={capture.resumeRecording} /> : null}
        {capture.canStop ? <ActionChip title="Parar" onPress={capture.stopRecording} /> : null}
      </View>

      {capture.error ? (
        <View style={s.errorBox}>
          <Text style={s.errorText}>{capture.error}</Text>
          <Pressable onPress={capture.resetError}>
            <Text style={s.retryText}>Fechar erro</Text>
          </Pressable>
        </View>
      ) : null}

      {capture.draft ? (
        <View style={s.previewCard}>
          <Text style={s.previewTitle}>Prévia do áudio</Text>
          <Text style={s.previewMeta}>
            Duração: {formatDuration(draftDuration)} | Tamanho: {formatBytes(capture.draft.sizeBytes)}
          </Text>

          <View style={s.previewActions}>
            <ActionChip title={capture.isPlayingPreview ? 'Pausar prévia' : 'Ouvir prévia'} onPress={capture.togglePreview} />
            <ActionChip title="Remover" danger onPress={capture.clearRecording} />
          </View>
        </View>
      ) : null}

      <AppButton title="Enviar áudio" onPress={handleSendAudio} disabled={!canSend} loading={analysis.loading} />

      {analysis.loading ? (
        <View style={s.loadingBox}>
          <ActivityIndicator size="small" color={Brand.greenDark} />
          <Text style={s.loadingText}>Enviando áudio para análise...</Text>
        </View>
      ) : null}

      {analysis.error ? (
        <View style={s.errorBox}>
          <Text style={s.errorText}>{analysis.error}</Text>
          <Pressable onPress={handleSendAudio} disabled={!canSend}>
            <Text style={[s.retryText, !canSend && s.retryDisabled]}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : null}

      {result && !result.precisaRevisao ? (
        <View style={s.resultBox}>
          <Text style={s.resultDishName}>{result.detectedDishName}</Text>
          <Text style={s.resultCal}>{result.nutrition.calories}</Text>
          <View style={s.macroRow}>
            <MacroTag label={`Prot: ${result.nutrition.protein}`} />
            <MacroTag label={`Carb: ${result.nutrition.carbs}`} />
            <MacroTag label={`Gord: ${result.nutrition.fat}`} />
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

function ActionChip({
  title,
  onPress,
  active,
  danger,
}: {
  title: string;
  onPress: () => void;
  active?: boolean;
  danger?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        s.controlBtn,
        active && s.controlBtnActive,
        danger && s.controlBtnDanger,
        pressed && s.controlBtnPressed,
      ]}
      onPress={onPress}>
      <Text style={[s.controlBtnText, active && s.controlBtnTextActive, danger && s.controlBtnTextDanger]}>{title}</Text>
    </Pressable>
  );
}

function MacroTag({ label }: { label: string }) {
  return (
    <View style={s.macroTag}>
      <Text style={s.macro}>{label}</Text>
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
  stateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  stateText: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '700',
  },
  permissionWarning: {
    ...Typography.caption,
    color: Brand.danger,
    fontWeight: '700',
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  controlBtn: {
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: Brand.border,
    backgroundColor: Brand.surfaceAlt,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  controlBtnActive: {
    backgroundColor: Brand.green,
    borderColor: Brand.green,
  },
  controlBtnDanger: {
    backgroundColor: '#FFEDEE',
    borderColor: '#FFD7DA',
  },
  controlBtnPressed: {
    opacity: 0.82,
  },
  controlBtnText: {
    ...Typography.caption,
    color: Brand.text,
    fontWeight: '700',
  },
  controlBtnTextActive: {
    color: '#FFFFFF',
  },
  controlBtnTextDanger: {
    color: Brand.danger,
  },
  previewCard: {
    backgroundColor: Brand.surfaceSoft,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: 12,
    gap: 8,
  },
  previewTitle: {
    ...Typography.body,
    color: Brand.text,
    fontWeight: '700',
  },
  previewMeta: {
    ...Typography.caption,
    color: Brand.textSecondary,
  },
  previewActions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
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
  },
  warningText: {
    ...Typography.caption,
    color: '#8A6D3B',
  },
});
