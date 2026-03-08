import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';

import type {
  AttachmentBackendPayload,
  AttachmentContext,
  AttachmentDraft,
  AttachmentItem,
  AttachmentKind,
} from '@/types/attachments';
import { buildRemotePhotoPayload, isAttachmentKindAllowed } from '@/utils/attachment-rules';

export type AttachmentPhotoSource = 'camera' | 'library';

function buildAttachmentId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function extensionForKind(kind: AttachmentKind): string {
  if (kind === 'photo') return 'jpg';
  if (kind === 'audio') return 'ogg';
  return 'pdf';
}

function guessMimeType(kind: AttachmentKind, mimeType?: string | null): string {
  if (mimeType && mimeType.trim().length > 0) return mimeType;
  if (kind === 'photo') return 'image/jpeg';
  if (kind === 'audio') return 'audio/ogg';
  return 'application/pdf';
}

function toDataUri(base64: string, mimeType: string): string {
  return `data:${mimeType};base64,${base64}`;
}

function documentPickerTypes(kind: AttachmentKind): string | string[] {
  if (kind === 'audio') return ['audio/*', 'application/ogg'];
  if (kind === 'pdf') return 'application/pdf';
  return 'image/*';
}

/*
 * Abre o seletor de arquivos de acordo com o tipo escolhido.
 *
 * Para foto usamos ImagePicker por simplicidade de UX no app atual.
 * Audio e PDF sao selecionados via DocumentPicker.
 */
export async function pickAttachment(kind: AttachmentKind): Promise<AttachmentDraft | null> {
  if (kind === 'photo') {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.75,
      base64: true,
    });

    if (result.canceled || !result.assets[0]) {
      return null;
    }

    const asset = result.assets[0];
    const mimeType = guessMimeType('photo', asset.mimeType);
    const fileName = asset.fileName ?? `foto.${extensionForKind('photo')}`;

    return {
      kind: 'photo',
      name: fileName,
      uri: asset.uri,
      mimeType,
      sizeBytes: asset.fileSize,
      rawBase64: asset.base64 ?? undefined,
    };
  }

  const result = await DocumentPicker.getDocumentAsync({
    type: documentPickerTypes(kind),
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (result.canceled || !result.assets[0]) {
    return null;
  }

  const asset = result.assets[0];
  const fileName = asset.name || `arquivo.${extensionForKind(kind)}`;

  return {
    kind,
    name: fileName,
    uri: asset.uri,
    mimeType: guessMimeType(kind, asset.mimeType),
    sizeBytes: asset.size,
  };
}

/*
 * Seletor dedicado para foto com escolha de origem (camera ou galeria).
 *
 * Mantemos essa funcao separada para facilitar evolucao de UX
 * sem afetar os fluxos de audio/pdf.
 */
export async function pickPhotoAttachment(
  source: AttachmentPhotoSource,
): Promise<AttachmentDraft | null> {
  if (source === 'camera') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      throw new Error('Permissao da camera negada.');
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.75,
      base64: true,
    });

    if (result.canceled || !result.assets[0]) {
      return null;
    }

    const asset = result.assets[0];
    const mimeType = guessMimeType('photo', asset.mimeType);
    const fileName = asset.fileName ?? `foto.${extensionForKind('photo')}`;

    return {
      kind: 'photo',
      name: fileName,
      uri: asset.uri,
      mimeType,
      sizeBytes: asset.fileSize,
      rawBase64: asset.base64 ?? undefined,
    };
  }

  return pickAttachment('photo');
}

/*
 * Prepara o anexo para transporte ao BFF.
 *
 * Nesta versao:
 * - meal aceita somente foto e envia inline base64/remote url.
 * - chat/plan mantem referencia de arquivo para envio posterior em rota de dominio.
 */
export async function buildBackendPayloadFromDraft(
  context: AttachmentContext,
  draft: AttachmentDraft,
): Promise<AttachmentBackendPayload> {
  if (!isAttachmentKindAllowed(context, draft.kind)) {
    throw new Error('Tipo de anexo nao permitido neste fluxo.');
  }

  if (draft.kind === 'photo') {
    const base64 =
      draft.rawBase64 ??
      (await FileSystem.readAsStringAsync(draft.uri, {
        encoding: FileSystem.EncodingType.Base64,
      }));

    return {
      transport: 'inline_base64',
      data: toDataUri(base64, draft.mimeType),
      mimeType: draft.mimeType,
    };
  }

  return {
    transport: 'file_reference',
    uri: draft.uri,
    fileName: draft.name,
    mimeType: draft.mimeType,
    sizeBytes: draft.sizeBytes,
  };
}

export function createProcessingAttachment(
  context: AttachmentContext,
  draft: AttachmentDraft,
): AttachmentItem {
  return {
    id: buildAttachmentId(),
    context,
    kind: draft.kind,
    name: draft.name,
    uri: draft.uri,
    mimeType: draft.mimeType,
    sizeBytes: draft.sizeBytes,
    status: 'processing',
  };
}

export function createRemotePhotoAttachment(
  context: AttachmentContext,
  url: string,
  name = 'imagem-atual.jpg',
): AttachmentItem {
  return {
    id: buildAttachmentId(),
    context,
    kind: 'photo',
    name,
    uri: url,
    mimeType: 'image/jpeg',
    status: 'success',
    backendPayload: buildRemotePhotoPayload(url),
  };
}
