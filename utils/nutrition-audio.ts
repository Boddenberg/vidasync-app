export type AudioNutritionRequestPayload = {
  audio?: string;
  audio_base64?: string;
  audioBase64?: string;
  audio_url?: string;
  audioUrl?: string;
  file_url?: string;
  fileUrl?: string;
  url?: string;
  mime_type: string;
  mimeType: string;
  file_name: string;
  fileName: string;
};

/*
 * Monta payload redundante de audio para compatibilidade de contrato.
 *
 * Enquanto o endpoint de audio ainda pode variar entre ambientes,
 * enviamos aliases de campos para reduzir fragilidade de integracao.
 */
export function buildAudioNutritionPayload(
  audioDataUri: string | null,
  mimeType: string,
  fileName: string,
  remoteUrl?: string | null,
): AudioNutritionRequestPayload {
  const payload: AudioNutritionRequestPayload = {
    mime_type: mimeType,
    mimeType,
    file_name: fileName,
    fileName,
  };

  if (audioDataUri) {
    payload.audio = audioDataUri;
    payload.audio_base64 = audioDataUri;
    payload.audioBase64 = audioDataUri;
  }

  if (remoteUrl) {
    payload.audio_url = remoteUrl;
    payload.audioUrl = remoteUrl;
    payload.file_url = remoteUrl;
    payload.fileUrl = remoteUrl;
    payload.url = remoteUrl;
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
