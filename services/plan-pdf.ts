import * as FileSystem from 'expo-file-system/legacy';

import {
  API_PLAN_BASE_URL,
  API_PLAN_PDF_PATH,
  API_REQUIRE_REMOTE_FILE_URL,
} from '@/constants/config';
import type { AttachmentItem } from '@/types/attachments';
import type { PlanPdfAnalysisResult } from '@/types/plan';
import {
  buildPlanPdfPayload,
  mapPlanPdfRequestErrorMessage,
  normalizePlanPdfResponse,
} from '@/utils/plan-pdf';
import { apiPostWithBase } from './api';
import { resolveRemoteFileUrl } from './file-url';

/*
 * Envia PDF do plano alimentar para analise via BFF.
 *
 * A camada de app nao chama agentes diretamente.
 * O endpoint pode evoluir sem impactar a UI, mantendo este adapter.
 */
export async function analyzePlanPdfAttachment(
  attachment: AttachmentItem,
): Promise<PlanPdfAnalysisResult> {
  try {
    const base64 = await FileSystem.readAsStringAsync(attachment.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const dataUri = `data:${attachment.mimeType};base64,${base64}`;
    const remoteUrl = await resolveRemoteFileUrl({
      kind: 'pdf',
      localUri: attachment.uri,
      dataUri,
      mimeType: attachment.mimeType,
      fileName: attachment.name,
    });

    const payload = buildPlanPdfPayload(
      API_REQUIRE_REMOTE_FILE_URL ? null : dataUri,
      attachment.mimeType,
      attachment.name,
      remoteUrl,
    );

    const response = await apiPostWithBase<unknown>(
      API_PLAN_BASE_URL,
      API_PLAN_PDF_PATH,
      payload,
    );

    return normalizePlanPdfResponse(response, {
      fileName: attachment.name,
      fileSizeBytes: attachment.sizeBytes,
    });
  } catch (err: any) {
    throw new Error(
      mapPlanPdfRequestErrorMessage(
        err?.message ?? 'Falha ao enviar PDF do plano alimentar.',
      ),
    );
  }
}
