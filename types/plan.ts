/*
 * Tipos de dominio para analise de plano alimentar por PDF.
 *
 * Mantemos esse contrato separado de nutricao para facilitar evolucao
 * futura do fluxo de plano (OCR, normalizacao e estruturacao).
 */

export type PlanDocumentSection = {
  title: string;
  text: string;
};

export type PlanPdfAnalysisResult = {
  source: 'plan_pdf';
  fileName: string;
  fileSizeBytes?: number;
  extractedText: string | null;
  sections: PlanDocumentSection[];
  warnings: string[];
  precisaRevisao: boolean;
  traceId: string | null;
  raw: Record<string, unknown> | null;
};
