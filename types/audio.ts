export type AudioCaptureState = 'idle' | 'recording' | 'paused' | 'ready';

export type AudioCaptureDraft = {
  uri: string;
  mimeType: string;
  fileName: string;
  durationMs: number;
  sizeBytes?: number;
};
