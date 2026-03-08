import { useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { Brand } from '@/constants/theme';
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

/*
 * Analise nutricional por voz.
 *
 * Reaproveita o hook de captura de audio e integra com o BFF.
 * O componente ja esta pronto para ser reutilizado em chat e
 * registro de refeicoes por voz com troca do service de envio.
 */
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
    if (capture.captureState === 'ready' && capture.draft) {
      return `Pronto ${formatDuration(capture.draft.durationMs)}`;
    }
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
      <Text style={s.title}>Consultar calorias por voz</Text>
      <Text style={s.subtitle}>Grave, ouca a previa e envie para analise no BFF.</Text>

      <View style={s.stateRow}>
        <Text style={s.stateText}>{recordingLabel}</Text>
        {capture.permissionGranted === false ? (
          <Text style={s.permissionWarning}>Microfone sem permissao</Text>
        ) : null}
      </View>

      <View style={s.controlsRow}>
        {capture.canRecord ? (
          <Pressable style={[s.controlBtn, s.recordBtn]} onPress={capture.startRecording}>
            <Text style={s.controlBtnText}>Iniciar</Text>
          </Pressable>
        ) : null}

        {capture.canPause ? (
          <Pressable style={s.controlBtn} onPress={capture.pauseRecording}>
            <Text style={s.controlBtnText}>Pausar</Text>
          </Pressable>
        ) : null}

        {capture.canResume ? (
          <Pressable style={s.controlBtn} onPress={capture.resumeRecording}>
            <Text style={s.controlBtnText}>Continuar</Text>
          </Pressable>
        ) : null}

        {capture.canStop ? (
          <Pressable style={s.controlBtn} onPress={capture.stopRecording}>
            <Text style={s.controlBtnText}>Parar</Text>
          </Pressable>
        ) : null}
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
          <Text style={s.previewTitle}>Previa de audio</Text>
          <Text style={s.previewMeta}>
            Duracao: {formatDuration(draftDuration)} | Tamanho: {formatBytes(capture.draft.sizeBytes)}
          </Text>

          <View style={s.previewActions}>
            <Pressable style={s.controlBtn} onPress={capture.togglePreview}>
              <Text style={s.controlBtnText}>{capture.isPlayingPreview ? 'Pausar previa' : 'Ouvir previa'}</Text>
            </Pressable>
            <Pressable style={s.removeBtn} onPress={capture.clearRecording}>
              <Text style={s.removeBtnText}>Remover</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <AppButton
        title="Enviar audio"
        onPress={handleSendAudio}
        disabled={!canSend}
        loading={analysis.loading}
      />

      {analysis.loading ? (
        <View style={s.loadingBox}>
          <ActivityIndicator size="small" color={Brand.greenDark} />
          <Text style={s.loadingText}>Enviando audio para analise...</Text>
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
  stateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stateText: {
    fontSize: 12,
    fontWeight: '600',
    color: Brand.textSecondary,
  },
  permissionWarning: {
    fontSize: 12,
    color: Brand.danger,
    fontWeight: '600',
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  controlBtn: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Brand.border,
    backgroundColor: Brand.card,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  recordBtn: {
    borderColor: Brand.green,
    backgroundColor: '#F2FAF3',
  },
  controlBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Brand.text,
  },
  previewCard: {
    backgroundColor: Brand.bg,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  previewTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Brand.text,
  },
  previewMeta: {
    fontSize: 12,
    color: Brand.textSecondary,
  },
  previewActions: {
    flexDirection: 'row',
    gap: 8,
  },
  removeBtn: {
    borderRadius: 10,
    backgroundColor: '#FFF0F0',
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  removeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Brand.danger,
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
