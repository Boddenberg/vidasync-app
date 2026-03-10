export type AudioNutritionRequestPayload = {
  audio?: string;
  audio_url?: string;
  file_key?: string;
  mime_type: string;
  file_name: string;
};

/*
 * Monta payload canonico de audio.
 * O backend deve aceitar estes campos como contrato oficial.
 */
export function buildAudioNutritionPayload(
  audioDataUri: string | null,
  mimeType: string,
  fileName: string,
  remoteUrl?: string | null,
  fileKey?: string | null,
): AudioNutritionRequestPayload {
  const payload: AudioNutritionRequestPayload = {
    mime_type: mimeType,
    file_name: fileName,
  };

  if (audioDataUri) {
    payload.audio = audioDataUri;
  }

  if (fileKey) {
    payload.file_key = fileKey;
  } else if (remoteUrl) {
    payload.audio_url = remoteUrl;
  }

  return payload;
}

export function mapAudioRequestErrorMessage(rawMessage: string): string {
  const message = rawMessage.toLowerCase();

  if (message.includes('404') || message.includes('"status":404')) {
    return 'Endpoint de audio nao encontrado no BFF atual. Confirme o contrato de rota para voz.';
  }

  if (message.includes('415') || message.includes('unsupported media type')) {
    return 'Formato de envio de audio nao suportado pelo BFF atual.';
  }

  return rawMessage;
}
