import {
  API_REQUIRE_REMOTE_FILE_URL,
  API_UPLOAD_BASE_URL,
  API_UPLOAD_PATH,
} from '@/constants/config';
import { apiPostWithBase } from './api';

type HeaderRecord = Record<string, string>;

type ResolveRemoteFileUrlParams = {
  kind: 'audio' | 'pdf' | 'photo';
  localUri: string;
  mimeType: string;
  fileName: string;
  sizeBytes?: number;
  dataUri?: string | null;
};

export type ResolvedRemoteFileRef = {
  remoteUrl: string | null;
  fileKey: string | null;
};

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

function toText(value: unknown): string {
  return `${value ?? ''}`.trim();
}

function firstHttp(candidates: unknown[]): string | null {
  for (const candidate of candidates) {
    const text = toText(candidate);
    if (text && isHttpUrl(text)) return text;
  }
  return null;
}

function normalizeFileKey(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (!isHttpUrl(trimmed)) {
    const normalized = trimmed.replace(/^\/+/, '');
    return normalized || null;
  }

  try {
    const parsed = new URL(trimmed);
    const normalized = decodeURIComponent(parsed.pathname).replace(/^\/+/, '').trim();
    return normalized || null;
  } catch {
    return null;
  }
}

function firstFileKey(candidates: unknown[]): string | null {
  for (const candidate of candidates) {
    const text = toText(candidate);
    if (!text) continue;
    const normalized = normalizeFileKey(text);
    if (normalized) return normalized;
  }

  return null;
}

function normalizeHeaders(value: unknown): HeaderRecord {
  if (!value || typeof value !== 'object') return {};
  const row = value as Record<string, unknown>;
  const headers: HeaderRecord = {};

  Object.entries(row).forEach(([key, rawValue]) => {
    const text = toText(rawValue);
    if (text) headers[key] = text;
  });

  return headers;
}

function extractUploadHeaders(row: Record<string, unknown>): HeaderRecord {
  const uploadRow =
    row.upload && typeof row.upload === 'object'
      ? (row.upload as Record<string, unknown>)
      : null;

  const candidates = [
    row.uploadHeaders,
    row.upload_headers,
    row.headers,
    uploadRow?.uploadHeaders,
    uploadRow?.upload_headers,
    uploadRow?.headers,
  ];

  for (const candidate of candidates) {
    const headers = normalizeHeaders(candidate);
    if (Object.keys(headers).length > 0) {
      return headers;
    }
  }

  return {};
}

function hasUploadConfig(): boolean {
  return API_UPLOAD_BASE_URL.length > 0 && API_UPLOAD_PATH.length > 0;
}

function resolvePresignKind(
  kind: ResolveRemoteFileUrlParams['kind'],
  mimeType: string,
): 'image' | 'audio' | 'pdf' {
  const normalizedMimeType = mimeType.trim().toLowerCase();
  if (normalizedMimeType.startsWith('image/')) return 'image';
  if (normalizedMimeType.startsWith('audio/')) return 'audio';
  if (normalizedMimeType === 'application/pdf') return 'pdf';
  if (kind === 'photo') return 'image';
  return kind;
}

function extractPresignInfo(response: unknown): {
  uploadUrl: string | null;
  remoteUrl: string | null;
  fileKey: string | null;
  uploadHeaders: HeaderRecord;
} {
  if (!response || typeof response !== 'object') {
    return {
      uploadUrl: null,
      remoteUrl: null,
      fileKey: null,
      uploadHeaders: {},
    };
  }

  const row = response as Record<string, unknown>;
  const uploadRow =
    row.upload && typeof row.upload === 'object'
      ? (row.upload as Record<string, unknown>)
      : null;
  const fileRow =
    row.file && typeof row.file === 'object'
      ? (row.file as Record<string, unknown>)
      : null;

  const uploadUrl = firstHttp([
    row.uploadUrl,
    row.upload_url,
    row.signedUrl,
    row.signed_url,
    row.signedUploadUrl,
    row.signed_upload_url,
    row.putSignedUrl,
    row.put_signed_url,
    row.putUrl,
    row.put_url,
    row.uploadUri,
    row.upload_uri,
    row.presignedUrl,
    row.presigned_url,
    uploadRow?.url,
    uploadRow?.uploadUrl,
    uploadRow?.upload_url,
    uploadRow?.signedUrl,
    uploadRow?.signed_url,
    uploadRow?.putUrl,
    uploadRow?.put_url,
    uploadRow?.presignedUrl,
    uploadRow?.presigned_url,
  ]);

  let remoteUrl = firstHttp([
    row.url,
    row.fileUrl,
    row.file_url,
    row.publicUrl,
    row.public_url,
    row.resourceUrl,
    row.resource_url,
    row.downloadUrl,
    row.download_url,
    row.link,
    fileRow?.url,
    fileRow?.fileUrl,
    fileRow?.file_url,
    fileRow?.publicUrl,
    fileRow?.public_url,
    fileRow?.downloadUrl,
    fileRow?.download_url,
  ]);

  let fileKey = firstFileKey([
    row.fileKey,
    row.file_key,
    row.key,
    row.objectKey,
    row.object_key,
    row.path,
    row.storageKey,
    row.storage_key,
    fileRow?.fileKey,
    fileRow?.file_key,
    fileRow?.key,
    fileRow?.path,
    fileRow?.storageKey,
    fileRow?.storage_key,
  ]);

  if (!fileKey && remoteUrl) {
    fileKey = normalizeFileKey(remoteUrl);
  }

  // Alguns backends devolvem base publica separada de key.
  if (!remoteUrl && fileKey) {
    const publicBase = firstHttp([row.publicBaseUrl, row.public_base_url, row.baseUrl, row.base_url]);
    if (publicBase) {
      const normalizedBase = publicBase.endsWith('/') ? publicBase.slice(0, -1) : publicBase;
      const normalizedKey = fileKey.startsWith('/') ? fileKey.slice(1) : fileKey;
      remoteUrl = `${normalizedBase}/${normalizedKey}`;
    }
  }

  const uploadHeaders = extractUploadHeaders(row);

  return {
    uploadUrl,
    remoteUrl,
    fileKey,
    uploadHeaders,
  };
}

async function blobFromInput(
  localUri: string,
  dataUri?: string | null,
): Promise<Blob> {
  const candidates = [toText(localUri), toText(dataUri)];

  for (const candidate of candidates) {
    if (!candidate) continue;

    try {
      const response = await fetch(candidate);
      if (!response.ok) continue;
      return await response.blob();
    } catch {
      // tenta proximo candidato
    }
  }

  throw new Error('Nao foi possivel ler arquivo local para upload.');
}

async function uploadBlobToPresignedUrl(
  uploadUrl: string,
  blob: Blob,
  mimeType: string,
  uploadHeaders: HeaderRecord,
) {
  const headers: HeaderRecord = {
    ...uploadHeaders,
  };

  if (!headers['Content-Type'] && !headers['content-type']) {
    headers['Content-Type'] = mimeType;
  }

  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers,
    body: blob,
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(body || `Falha no upload do arquivo (${response.status}).`);
  }
}

/*
 * Resolve uma referencia remota de arquivo para envio ao backend.
 *
 * Fluxo:
 * 1) Se o arquivo ja e uma URL HTTP(S), reutiliza.
 * 2) Chama POST /uploads/presign no BFF.
 * 3) Faz PUT do blob no uploadUrl retornado.
 * 4) Retorna remoteUrl e/ou fileKey para a rota de dominio.
 */
export async function resolveRemoteFileUrl(
  params: ResolveRemoteFileUrlParams,
): Promise<ResolvedRemoteFileRef> {
  if (isHttpUrl(params.localUri)) {
    const remoteUrl = params.localUri.trim();
    return {
      remoteUrl,
      fileKey: normalizeFileKey(remoteUrl),
    };
  }

  if (!hasUploadConfig()) {
    if (API_REQUIRE_REMOTE_FILE_URL) {
      throw new Error(
        'Backend espera arquivo remoto, mas EXPO_PUBLIC_API_UPLOAD_BASE_URL/API_UPLOAD_PATH nao estao configurados.',
      );
    }

    return { remoteUrl: null, fileKey: null };
  }

  const presignPayload = {
    kind: resolvePresignKind(params.kind, params.mimeType),
    mimeType: params.mimeType,
    mime_type: params.mimeType,
    fileName: params.fileName,
    file_name: params.fileName,
    sizeBytes: params.sizeBytes,
    size_bytes: params.sizeBytes,
  };

  const presignResponse = await apiPostWithBase<unknown>(
    API_UPLOAD_BASE_URL,
    API_UPLOAD_PATH,
    presignPayload,
  );

  const presign = extractPresignInfo(presignResponse);
  if (!presign.uploadUrl) {
    throw new Error(
      'Presign nao retornou uploadUrl. O arquivo nao foi publicado no storage.',
    );
  }

  const blob = await blobFromInput(params.localUri, params.dataUri);
  await uploadBlobToPresignedUrl(
    presign.uploadUrl,
    blob,
    params.mimeType,
    presign.uploadHeaders,
  );

  if (API_REQUIRE_REMOTE_FILE_URL && !presign.remoteUrl && !presign.fileKey) {
    throw new Error('Upload concluido, mas presign nao retornou URL ou fileKey.');
  }

  return {
    remoteUrl: presign.remoteUrl,
    fileKey: presign.fileKey,
  };
}
