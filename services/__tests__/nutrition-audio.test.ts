import { describe, expect, it } from 'vitest';

import {
  buildAudioNutritionPayload,
  mapAudioRequestErrorMessage,
} from '@/utils/nutrition-audio';

describe('nutrition-audio payload utils', () => {
  it('builds compatible payload aliases for audio fields', () => {
    const payload = buildAudioNutritionPayload(
      'data:audio/m4a;base64,AAA',
      'audio/m4a',
      'voice.m4a',
    );

    expect(payload.audio).toBe('data:audio/m4a;base64,AAA');
    expect(payload.audio_base64).toBe(payload.audio);
    expect(payload.audioBase64).toBe(payload.audio);
    expect(payload.mime_type).toBe('audio/m4a');
    expect(payload.mimeType).toBe('audio/m4a');
    expect(payload.file_name).toBe('voice.m4a');
    expect(payload.fileName).toBe('voice.m4a');
  });

  it('includes URL aliases when remote link is available', () => {
    const payload = buildAudioNutritionPayload(
      null,
      'audio/m4a',
      'voice.m4a',
      'https://cdn.example.com/voice.m4a',
    );

    expect(payload.audio).toBeUndefined();
    expect(payload.audio_url).toBe('https://cdn.example.com/voice.m4a');
    expect(payload.audioUrl).toBe('https://cdn.example.com/voice.m4a');
    expect(payload.file_url).toBe('https://cdn.example.com/voice.m4a');
    expect(payload.url).toBe('https://cdn.example.com/voice.m4a');
  });

  it('maps 404 errors to a user-friendly backend contract message', () => {
    const message = mapAudioRequestErrorMessage('Erro 404');
    expect(message).toContain('Endpoint de audio nao encontrado');
  });

  it('keeps unknown errors untouched', () => {
    const message = mapAudioRequestErrorMessage('Falha geral');
    expect(message).toBe('Falha geral');
  });
});
