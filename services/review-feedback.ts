import { API_REVIEW_BASE_URL, API_REVIEW_CONFIRM_PATH } from '@/constants/config';
import type { ReviewSubmitPayload, ReviewSubmitResult } from '@/types/review';
import { mapReviewSubmitErrorMessage } from '@/utils/review';
import { apiPostWithBase } from './api';

type ReviewSubmitWire = {
  status?: string | null;
  warnings?: string[] | null;
  trace_id?: string | null;
  traceId?: string | null;
  message?: string | null;
};

function asWarnings(value?: string[] | null): string[] {
  return Array.isArray(value)
    ? value.filter((item) => !!item && item.trim().length > 0)
    : [];
}

/*
 * Envia a revisao ajustada para o BFF.
 *
 * Este endpoint e de dominio (BFF), sem acoplamento com agentes.
 */
export async function submitReviewAdjustments(
  payload: ReviewSubmitPayload,
): Promise<ReviewSubmitResult> {
  try {
    const response = await apiPostWithBase<ReviewSubmitWire>(
      API_REVIEW_BASE_URL,
      API_REVIEW_CONFIRM_PATH,
      payload,
    );

    return {
      status: `${response.status ?? 'ok'}`.trim() || 'ok',
      warnings: asWarnings(response.warnings),
      traceId: `${response.trace_id ?? response.traceId ?? ''}`.trim() || null,
      message: `${response.message ?? ''}`.trim() || null,
    };
  } catch (err: any) {
    throw new Error(mapReviewSubmitErrorMessage(err?.message ?? 'Falha ao reenviar revisao.'));
  }
}
