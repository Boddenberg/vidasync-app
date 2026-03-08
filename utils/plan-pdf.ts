import type { PlanDocumentSection, PlanPdfAnalysisResult } from '@/types/plan';

export type PlanPdfRequestPayload = {
  pdf?: string;
  pdf_base64?: string;
  pdfBase64?: string;
  pdf_url?: string;
  pdfUrl?: string;
  file_url?: string;
  fileUrl?: string;
  url?: string;
  mime_type: string;
  mimeType: string;
  file_name: string;
  fileName: string;
};

function toStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => `${item ?? ''}`.trim())
      .filter((item) => item.length > 0);
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    return [value.trim()];
  }

  return [];
}

function toSectionList(value: unknown): PlanDocumentSection[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const row = item as Record<string, unknown>;

      const title = `${row.titulo ?? row.title ?? ''}`.trim();
      const text = `${row.texto ?? row.text ?? ''}`.trim();

      if (!title || !text) return null;

      return { title, text };
    })
    .filter((item): item is PlanDocumentSection => Boolean(item));
}

/*
 * Monta payload redundante para PDF visando compatibilidade de contrato
 * entre versoes do BFF.
 */
export function buildPlanPdfPayload(
  pdfDataUri: string | null,
  mimeType: string,
  fileName: string,
  remoteUrl?: string | null,
): PlanPdfRequestPayload {
  const payload: PlanPdfRequestPayload = {
    mime_type: mimeType,
    mimeType,
    file_name: fileName,
    fileName,
  };

  if (pdfDataUri) {
    payload.pdf = pdfDataUri;
    payload.pdf_base64 = pdfDataUri;
    payload.pdfBase64 = pdfDataUri;
  }

  if (remoteUrl) {
    payload.pdf_url = remoteUrl;
    payload.pdfUrl = remoteUrl;
    payload.file_url = remoteUrl;
    payload.fileUrl = remoteUrl;
    payload.url = remoteUrl;
  }

  return payload;
}

export function mapPlanPdfRequestErrorMessage(rawMessage: string): string {
  const message = rawMessage.toLowerCase();

  if (message.includes('404') || message.includes('"status":404')) {
    return 'Endpoint de PDF nao encontrado no BFF atual. Confirme o contrato de plano alimentar.';
  }

  if (message.includes('415') || message.includes('unsupported media type')) {
    return 'Formato de envio de PDF nao suportado pelo BFF atual.';
  }

  return rawMessage;
}

/*
 * Normaliza resposta de analise de plano.
 *
 * Aceita tanto contratos especificos de plano quanto respostas intermediarias
 * de normalizacao textual com campos em portugues.
 */
export function normalizePlanPdfResponse(
  response: unknown,
  metadata: { fileName: string; fileSizeBytes?: number },
): PlanPdfAnalysisResult {
  const data = (response ?? {}) as Record<string, unknown>;

  const error = `${data.error ?? data.erro ?? ''}`.trim();
  if (error) {
    throw new Error(error);
  }

  const warnings = [
    ...toStringList(data.warnings),
    ...toStringList(data.avisos_extracao),
    ...toStringList(data.observacoes),
  ];

  const sections = toSectionList(data.secoes ?? data.sections);
  const extractedText =
    `${data.texto_normalizado ?? data.texto_transcrito ?? data.texto ?? ''}`.trim() || null;

  const needsReview = Boolean(data.precisa_revisao ?? data.precisaRevisao);
  const traceId =
    `${data.trace_id ?? data.traceId ?? data.pipeline_id ?? ''}`.trim() || null;

  return {
    source: 'plan_pdf',
    fileName: metadata.fileName,
    fileSizeBytes: metadata.fileSizeBytes,
    extractedText,
    sections,
    warnings,
    precisaRevisao: needsReview,
    traceId,
    raw: data,
  };
}
