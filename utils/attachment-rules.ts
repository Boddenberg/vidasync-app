import type {
  AttachmentBackendPayload,
  AttachmentContext,
  AttachmentItem,
  AttachmentKind,
} from '@/types/attachments';

const CONTEXT_ALLOWED_KINDS: Record<AttachmentContext, AttachmentKind[]> = {
  chat: ['photo', 'audio', 'pdf'],
  meal: ['photo'],
  plan: ['photo', 'pdf', 'audio'],
};

/*
 * Regras de negocio de anexos por contexto.
 *
 * Mantemos as regras em um ponto unico para evitar ifs espalhados.
 * Isso facilita evolucao para novos dominios (ex.: exames laboratoriais).
 */
export function getAllowedAttachmentKinds(context: AttachmentContext): AttachmentKind[] {
  return CONTEXT_ALLOWED_KINDS[context];
}

export function isAttachmentKindAllowed(context: AttachmentContext, kind: AttachmentKind): boolean {
  return CONTEXT_ALLOWED_KINDS[context].includes(kind);
}

/*
 * Converte a lista de anexos para o campo de imagem aceito hoje pelo BFF
 * nas rotas de refeicao/favorito.
 *
 * Prioridade:
 * 1) inline_base64 (foto nova capturada/selecionada)
 * 2) remote_url (foto ja existente em edicao)
 */
export function resolvePrimaryImagePayload(attachments: AttachmentItem[]): string | null {
  const successfulPhotos = attachments.filter(
    (attachment) => attachment.kind === 'photo' && attachment.status === 'success',
  );

  if (successfulPhotos.length === 0) {
    return null;
  }

  const base64Photo = successfulPhotos.find(
    (attachment) => attachment.backendPayload?.transport === 'inline_base64',
  );

  if (base64Photo?.backendPayload?.transport === 'inline_base64') {
    return base64Photo.backendPayload.data;
  }

  const remotePhoto = successfulPhotos.find(
    (attachment) => attachment.backendPayload?.transport === 'remote_url',
  );

  if (remotePhoto?.backendPayload?.transport === 'remote_url') {
    return remotePhoto.backendPayload.url;
  }

  return null;
}

export function buildRemotePhotoPayload(url: string): AttachmentBackendPayload {
  return {
    transport: 'remote_url',
    url,
    mimeType: 'image/jpeg',
  };
}

/*
 * Seleciona o primeiro PDF valido para envio ao BFF.
 */
export function resolvePrimaryPdfAttachment(
  attachments: AttachmentItem[],
): AttachmentItem | null {
  return (
    attachments.find(
      (attachment) =>
        attachment.kind === 'pdf' &&
        attachment.status === 'success' &&
        attachment.backendPayload?.transport === 'file_reference',
    ) ?? null
  );
}
