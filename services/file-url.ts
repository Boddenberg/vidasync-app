import {
  API_REQUIRE_REMOTE_FILE_URL,
  API_UPLOAD_BASE_URL,
  API_UPLOAD_PATH,
} from '@/constants/config';
import { apiPostWithBase } from './api';

type ResolveRemoteFileUrlParams = {
  kind: 'audio' | 'pdf';
  localUri: string;
  dataUri: string;
  mimeType: string;
  fileName: string;
};

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

function extractRemoteUrl(response: unknown): string | null {
  if (!response || typeof response !== 'object') return null;
  const row = response as Record<string, unknown>;
  const candidates = [
    row.url,
    row.fileUrl,
    row.file_url,
    row.publicUrl,
    row.public_url,
    row.signedUrl,
    row.signed_url,
    row.downloadUrl,
    row.download_url,
    row.resourceUrl,
    row.resource_url,
    row.link,
  ];

  for (const candidate of candidates) {
    const text = `${candidate ?? ''}`.trim();
    if (text && isHttpUrl(text)) return text;
  }

  return null;
}

function hasUploadConfig(): boolean {
  return API_UPLOAD_BASE_URL.length > 0 && API_UPLOAD_PATH.length > 0;
}

/*
 * Resolve uma URL remota para envio ao backend.
 *
 * Prioridade:
 * 1) arquivo ja eh URL http(s)
 * 2) endpoint de upload configurado
 * 3) null (ou erro quando URL remota eh obrigatoria)
 */
export async function resolveRemoteFileUrl(
  params: ResolveRemoteFileUrlParams,
): Promise<string | null> {
  if (isHttpUrl(params.localUri)) {
    return params.localUri.trim();
  }

  if (!hasUploadConfig()) {
    if (API_REQUIRE_REMOTE_FILE_URL) {
      throw new Error(
        'Backend espera URL de arquivo, mas EXPO_PUBLIC_API_UPLOAD_BASE_URL/API_UPLOAD_PATH nao estao configurados.',
      );
    }
    return null;
  }

  const uploadPayload = {
    kind: params.kind,
    mimeType: params.mimeType,
    mime_type: params.mimeType,
    fileName: params.fileName,
    file_name: params.fileName,
    // aliases para compatibilidade entre contratos
    dataUri: params.dataUri,
    data_uri: params.dataUri,
    file: params.dataUri,
    fileBase64: params.dataUri,
    file_base64: params.dataUri,
    base64: params.dataUri,
  };

  const uploadResponse = await apiPostWithBase<unknown>(
    API_UPLOAD_BASE_URL,
    API_UPLOAD_PATH,
    uploadPayload,
  );

  const remoteUrl = extractRemoteUrl(uploadResponse);
  if (remoteUrl) return remoteUrl;

  if (API_REQUIRE_REMOTE_FILE_URL) {
    throw new Error('Upload executado, mas resposta nao trouxe URL publica do arquivo.');
  }

  return null;
}
