import * as FileSystem from 'expo-file-system/legacy';

import {
  API_AUDIO_BASE_URL,
  API_NUTRITION_AUDIO_PATH,
  API_REQUIRE_REMOTE_FILE_URL,
} from '@/constants/config';
import type { AudioCaptureDraft } from '@/types/audio';
import type { NutritionAnalysisResult } from '@/types/nutrition';
import { buildAudioNutritionPayload, mapAudioRequestErrorMessage } from '@/utils/nutrition-audio';
import { apiPostWithBase } from './api';
import { resolveRemoteFileUrl } from './file-url';
import { normalizeCalorieResponse } from './nutrition';

export async function getNutritionFromAudio(draft: AudioCaptureDraft): Promise<NutritionAnalysisResult> {
  try {
    const base64 = await FileSystem.readAsStringAsync(draft.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const audioDataUri = `data:${draft.mimeType};base64,${base64}`;
    const remoteUrl = await resolveRemoteFileUrl({
      kind: 'audio',
      localUri: draft.uri,
      dataUri: audioDataUri,
      mimeType: draft.mimeType,
      fileName: draft.fileName,
    });

    const payload = buildAudioNutritionPayload(
      API_REQUIRE_REMOTE_FILE_URL ? null : audioDataUri,
      draft.mimeType,
      draft.fileName,
      remoteUrl,
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
