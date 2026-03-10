import { describe, expect, it } from 'vitest';

import {
  buildAudioNutritionPayload,
  mapAudioRequestErrorMessage,
} from '@/utils/nutrition-audio';

describe('nutrition-audio payload utils', () => {
  it('builds canonical payload for audio fields', () => {
    const payload = buildAudioNutritionPayload(
      'data:audio/m4a;base64,AAA',
      'audio/m4a',
      'voice.m4a',
    );

    expect(payload.audio).toBe('data:audio/m4a;base64,AAA');
    expect(payload.mime_type).toBe('audio/m4a');
    expect(payload.file_name).toBe('voice.m4a');
  });

  it('includes canonical URL field when remote link is available', () => {
    const payload = buildAudioNutritionPayload(
      null,
      'audio/m4a',
      'voice.m4a',
      'https://cdn.example.com/voice.m4a',
    );

    expect(payload.audio).toBeUndefined();
    expect(payload.audio_url).toBe('https://cdn.example.com/voice.m4a');
  });

  it('prioritizes file_key over remote URL when both are available', () => {
    const payload = buildAudioNutritionPayload(
      null,
      'audio/m4a',
      'voice.m4a',
      'https://cdn.example.com/voice.m4a',
      'audio/abc/voice.m4a',
    );

    expect(payload.file_key).toBe('audio/abc/voice.m4a');
    expect(payload.audio_url).toBeUndefined();
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
