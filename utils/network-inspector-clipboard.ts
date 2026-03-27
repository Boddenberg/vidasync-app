import type { NetworkInspectorLog } from '@/services/network-inspector';

function prettyClipboardText(value: string | null): string {
  if (!value) return '-';
  const text = value.trim();
  if (!text) return '-';
  try {
    const parsed = JSON.parse(text);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return value;
  }
}

function clipboardBody(value: string | null): string | null {
  if (!value) return null;
  const text = value.trim();
  if (!text) return null;
  return prettyClipboardText(value);
}

function clipboardLog(log: NetworkInspectorLog) {
  return {
    id: log.id,
    timestamp: log.timestamp,
    method: log.method,
    url: log.url,
    request: {
      headers: log.requestHeaders,
      body: clipboardBody(log.requestBody),
      truncated: log.requestBodyTruncated,
    },
    response: {
      statusCode: log.statusCode,
      ok: log.ok,
      durationMs: log.durationMs,
      headers: log.responseHeaders,
      body: clipboardBody(log.responseBody),
      truncated: log.responseBodyTruncated,
    },
    error: log.error,
  };
}

export function serializeNetworkInspectorLog(log: NetworkInspectorLog): string {
  return JSON.stringify(clipboardLog(log), null, 2);
}

export function serializeNetworkInspectorLogs(logs: NetworkInspectorLog[]): string {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      totalLogs: logs.length,
      logs: logs.map(clipboardLog),
    },
    null,
    2,
  );
}
