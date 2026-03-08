/*
 * Tipos de dominio para anexos no app.
 *
 * Centraliza o contrato entre componente de UI, hooks e services.
 * Quando o backend evoluir (chat/plano com upload real), a manutencao
 * deve acontecer primeiro aqui para manter consistencia de ponta a ponta.
 */

export type AttachmentKind = 'photo' | 'audio' | 'pdf';

export type AttachmentContext = 'chat' | 'meal' | 'plan';

export type AttachmentStatus = 'processing' | 'success' | 'error';

export type AttachmentBackendPayload =
  | {
      transport: 'inline_base64';
      data: string;
      mimeType: string;
    }
  | {
      transport: 'file_reference';
      uri: string;
      fileName: string;
      mimeType: string;
      sizeBytes?: number;
    }
  | {
      transport: 'remote_url';
      url: string;
      mimeType?: string;
    };

export type AttachmentItem = {
  id: string;
  context: AttachmentContext;
  kind: AttachmentKind;
  name: string;
  uri: string;
  mimeType: string;
  sizeBytes?: number;
  status: AttachmentStatus;
  errorMessage?: string;
  backendPayload?: AttachmentBackendPayload;
};

export type AttachmentDraft = {
  kind: AttachmentKind;
  name: string;
  uri: string;
  mimeType: string;
  sizeBytes?: number;
  rawBase64?: string;
};
