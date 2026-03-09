import {
  API_PLAN_BASE_URL,
  API_PLAN_PDF_PATH,
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
    const remoteFile = await resolveRemoteFileUrl({
      kind: 'pdf',
      localUri: attachment.uri,
      mimeType: attachment.mimeType,
      fileName: attachment.name,
      sizeBytes: attachment.sizeBytes,
    });

    if (!remoteFile.fileKey && !remoteFile.remoteUrl) {
      throw new Error(
        'Upload remoto do PDF nao retornou file_key nem pdf_url para envio ao dominio.',
      );
    }

    const payload = buildPlanPdfPayload(
      null,
      attachment.mimeType,
      attachment.name,
      remoteFile.remoteUrl,
      remoteFile.fileKey,
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
