import {
  API_AUDIO_BASE_URL,
  API_NUTRITION_AUDIO_PATH,
} from '@/constants/config';
import type { AudioCaptureDraft } from '@/types/audio';
import type { NutritionAnalysisResult } from '@/types/nutrition';
import { buildAudioNutritionPayload, mapAudioRequestErrorMessage } from '@/utils/nutrition-audio';
import { apiPostWithBase } from './api';
import { resolveRemoteFileUrl } from './file-url';
import { normalizeCalorieResponse } from './nutrition';

export async function getNutritionFromAudio(draft: AudioCaptureDraft): Promise<NutritionAnalysisResult> {
  try {
    const remoteFile = await resolveRemoteFileUrl({
      kind: 'audio',
      localUri: draft.uri,
      mimeType: draft.mimeType,
      fileName: draft.fileName,
      sizeBytes: draft.sizeBytes,
    });

    if (!remoteFile.fileKey && !remoteFile.remoteUrl) {
      throw new Error(
        'Upload remoto do audio nao retornou file_key nem audio_url para envio ao dominio.',
      );
    }

    const payload = buildAudioNutritionPayload(
      null,
      draft.mimeType,
      draft.fileName,
      remoteFile.remoteUrl,
      remoteFile.fileKey,
    );

    const response = await apiPostWithBase<unknown>(
      API_AUDIO_BASE_URL,
      API_NUTRITION_AUDIO_PATH,
      payload,
    );
    return normalizeCalorieResponse(response as any);
  } catch (err: any) {
    throw new Error(mapAudioRequestErrorMessage(err?.message ?? 'Falha ao enviar audio.'));
  }
}
