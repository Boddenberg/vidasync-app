import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Audio, type AVPlaybackStatus } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';

import type { AudioCaptureDraft, AudioCaptureState } from '@/types/audio';

function buildFileName() {
  return `audio-${Date.now()}.m4a`;
}

/*
 * Hook de captura e playback de audio.
 *
 * Responsabilidades:
 * - solicitar permissao de microfone
 * - controlar gravacao (iniciar, pausar, continuar, parar)
 * - gerar draft pronto para upload
 * - reproduzir previa local antes do envio
 *
 * Observacao de manutencao:
 * Este hook foi isolado para reaproveitar em chat e refeicoes por voz,
 * sem acoplar a UX ao dominio nutricional.
 */
export function useAudioCapture() {
  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  const [captureState, setCaptureState] = useState<AudioCaptureState>('idle');
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [recordDurationMs, setRecordDurationMs] = useState(0);
  const [draft, setDraft] = useState<AudioCaptureDraft | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canRecord = useMemo(
    () => captureState === 'idle' || captureState === 'ready',
    [captureState],
  );
  const canPause = captureState === 'recording';
  const canResume = captureState === 'paused';
  const canStop = captureState === 'recording' || captureState === 'paused';

  const onRecordingStatusUpdate = useCallback((status: Audio.RecordingStatus) => {
    setRecordDurationMs((status as any)?.durationMillis ?? 0);
  }, []);

  const onPlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    if (status.didJustFinish) {
      setIsPlayingPreview(false);
      return;
    }
    setIsPlayingPreview(Boolean(status.isPlaying));
  }, []);

  const requestMicrophonePermission = useCallback(async () => {
    const permission = await Audio.requestPermissionsAsync();
    setPermissionGranted(permission.granted);
    if (!permission.granted) {
      throw new Error('Permissao de microfone negada.');
    }
  }, []);

  const resetError = useCallback(() => setError(null), []);

  const unloadSound = useCallback(async () => {
    if (!soundRef.current) return;
    await soundRef.current.unloadAsync();
    soundRef.current.setOnPlaybackStatusUpdate(null);
    soundRef.current = null;
    setIsPlayingPreview(false);
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      await unloadSound();
      setDraft(null);
      setRecordDurationMs(0);

      await requestMicrophonePermission();

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      recording.setOnRecordingStatusUpdate(onRecordingStatusUpdate);
      recording.setProgressUpdateInterval(250);
      await recording.startAsync();

      recordingRef.current = recording;
      setCaptureState('recording');
    } catch (err: any) {
      setError(err?.message ?? 'Falha ao iniciar gravacao.');
    }
  }, [onRecordingStatusUpdate, requestMicrophonePermission, unloadSound]);

  const pauseRecording = useCallback(async () => {
    if (!recordingRef.current || captureState !== 'recording') return;
    try {
      setError(null);
      await recordingRef.current.pauseAsync();
      setCaptureState('paused');
    } catch (err: any) {
      setError(err?.message ?? 'Falha ao pausar gravacao.');
    }
  }, [captureState]);

  const resumeRecording = useCallback(async () => {
    if (!recordingRef.current || captureState !== 'paused') return;
    try {
      setError(null);
      await recordingRef.current.startAsync();
      setCaptureState('recording');
    } catch (err: any) {
      setError(err?.message ?? 'Falha ao continuar gravacao.');
    }
  }, [captureState]);

  const stopRecording = useCallback(async () => {
    if (!recordingRef.current) return;

    try {
      setError(null);
      await recordingRef.current.stopAndUnloadAsync();
      const status = await recordingRef.current.getStatusAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current.setOnRecordingStatusUpdate(null);
      recordingRef.current = null;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      if (!uri) {
        throw new Error('Nao foi possivel obter o arquivo de audio.');
      }

      const info = await FileSystem.getInfoAsync(uri);

      setDraft({
        uri,
        mimeType: 'audio/m4a',
        fileName: buildFileName(),
        durationMs: (status as any)?.durationMillis ?? recordDurationMs,
        sizeBytes: info.exists ? info.size : undefined,
      });
      setCaptureState('ready');
    } catch (err: any) {
      setError(err?.message ?? 'Falha ao finalizar gravacao.');
    }
  }, [recordDurationMs]);

  const togglePreview = useCallback(async () => {
    if (!draft) return;

    try {
      setError(null);
      if (!soundRef.current) {
        const created = await Audio.Sound.createAsync(
          { uri: draft.uri },
          { shouldPlay: false },
          onPlaybackStatusUpdate,
        );
        soundRef.current = created.sound;
      }

      if (isPlayingPreview) {
        await soundRef.current.pauseAsync();
      } else {
        await soundRef.current.playAsync();
      }
    } catch (err: any) {
      setError(err?.message ?? 'Falha ao reproduzir previa.');
    }
  }, [draft, isPlayingPreview, onPlaybackStatusUpdate]);

  const clearRecording = useCallback(async () => {
    setError(null);
    await unloadSound();

    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch {
        // ignore
      }
      recordingRef.current = null;
    }

    setDraft(null);
    setRecordDurationMs(0);
    setCaptureState('idle');
  }, [unloadSound]);

  useEffect(() => {
    return () => {
      void unloadSound();
      if (recordingRef.current) {
        void recordingRef.current.stopAndUnloadAsync();
      }
    };
  }, [unloadSound]);

  return {
    captureState,
    permissionGranted,
    recordDurationMs,
    draft,
    isPlayingPreview,
    error,
    canRecord,
    canPause,
    canResume,
    canStop,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    togglePreview,
    clearRecording,
    resetError,
  };
}
