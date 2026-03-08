type HeaderRecord = Record<string, string>;

export type NetworkInspectorLog = {
  id: string;
  timestamp: string;
  method: string;
  url: string;
  requestHeaders: HeaderRecord;
  requestBody: string | null;
  requestBodyTruncated: boolean;
  statusCode: number | null;
  ok: boolean | null;
  durationMs: number;
  responseHeaders: HeaderRecord;
  responseBody: string | null;
  responseBodyTruncated: boolean;
  error: string | null;
};

export type NetworkInspectorSnapshot = {
  enabled: boolean;
  installed: boolean;
  logs: NetworkInspectorLog[];
};

type NetworkInspectorListener = (snapshot: NetworkInspectorSnapshot) => void;

const MAX_LOGS = 200;
const MAX_BODY_CHARS = 12000;

let enabled = true;
let installed = false;
let sequence = 0;
let logs: NetworkInspectorLog[] = [];
const listeners = new Set<NetworkInspectorListener>();
let originalFetch: typeof fetch | null = null;

function snapshot(): NetworkInspectorSnapshot {
  return {
    enabled,
    installed,
    logs,
  };
}

function notifyListeners() {
  const value = snapshot();
  listeners.forEach((listener) => listener(value));
}

function isRequestObject(value: unknown): value is Request {
  return typeof Request !== 'undefined' && value instanceof Request;
}

function isHttpUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

function normalizeStringBody(raw: string): { body: string; truncated: boolean } {
  if (raw.length <= MAX_BODY_CHARS) {
    return { body: raw, truncated: false };
  }
  return {
    body: `${raw.slice(0, MAX_BODY_CHARS)}\n...[truncated ${raw.length - MAX_BODY_CHARS} chars]`,
    truncated: true,
  };
}

function headersToRecord(headers?: HeadersInit): HeaderRecord {
  if (!headers) return {};

  const record: HeaderRecord = {};

  if (typeof Headers !== 'undefined' && headers instanceof Headers) {
    headers.forEach((value, key) => {
      record[key] = value;
    });
    return record;
  }

  if (Array.isArray(headers)) {
    headers.forEach(([key, value]) => {
      record[key] = value;
    });
    return record;
  }

  Object.entries(headers).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      record[key] = value.join(', ');
    } else if (value != null) {
      record[key] = String(value);
    }
  });

  return record;
}

function guessMethod(input: RequestInfo | URL, init?: RequestInit): string {
  const fromInit = init?.method?.trim();
  if (fromInit) return fromInit.toUpperCase();
  if (isRequestObject(input)) return input.method.toUpperCase();
  return 'GET';
}

function guessUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;
  if (typeof URL !== 'undefined' && input instanceof URL) return input.toString();
  if (isRequestObject(input)) return input.url;
  return String(input);
}

function mergeHeaders(input: RequestInfo | URL, init?: RequestInit): HeaderRecord {
  const baseHeaders = isRequestObject(input) ? headersToRecord(input.headers) : {};
  const overrideHeaders = headersToRecord(init?.headers);
  return {
    ...baseHeaders,
    ...overrideHeaders,
  };
}

function serializeFormData(formData: FormData): string {
  const rows: Record<string, string>[] = [];
  formData.forEach((value, key) => {
    if (typeof value === 'string') {
      rows.push({ [key]: value });
      return;
    }
    rows.push({
      [key]: `[File name=${value.name || 'unknown'} size=${value.size || 0} type=${value.type || 'unknown'}]`,
    });
  });
  return JSON.stringify(rows);
}

function serializeBody(body: unknown): string | null {
  if (body == null) return null;
  if (typeof body === 'string') return body;

  if (typeof URLSearchParams !== 'undefined' && body instanceof URLSearchParams) {
    return body.toString();
  }

  if (typeof FormData !== 'undefined' && body instanceof FormData) {
    return serializeFormData(body);
  }

  if (typeof Blob !== 'undefined' && body instanceof Blob) {
    return `[Blob size=${body.size} type=${body.type || 'unknown'}]`;
  }

  if (body instanceof ArrayBuffer) {
    return `[ArrayBuffer byteLength=${body.byteLength}]`;
  }

  if (ArrayBuffer.isView(body)) {
    return `[ArrayBufferView byteLength=${body.byteLength}]`;
  }

  return `[body type=${typeof body}]`;
}

async function requestBodyPreview(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<{ body: string | null; truncated: boolean }> {
  const initBody = serializeBody(init?.body);
  if (initBody != null) {
    const normalized = normalizeStringBody(initBody);
    return { body: normalized.body, truncated: normalized.truncated };
  }

  if (!isRequestObject(input)) {
    return { body: null, truncated: false };
  }

  if (input.method.toUpperCase() === 'GET' || input.method.toUpperCase() === 'HEAD') {
    return { body: null, truncated: false };
  }

  try {
    const raw = await input.clone().text();
    if (!raw) return { body: null, truncated: false };
    const normalized = normalizeStringBody(raw);
    return { body: normalized.body, truncated: normalized.truncated };
  } catch {
    return { body: '[unreadable request body]', truncated: false };
  }
}

function isBinaryLikeContentType(contentType: string): boolean {
  return /(image\/|audio\/|video\/|application\/pdf|application\/octet-stream)/i.test(contentType);
}

async function responseBodyPreview(
  response: Response,
  responseHeaders: HeaderRecord,
): Promise<{ body: string | null; truncated: boolean }> {
  const contentType = responseHeaders['content-type'] || responseHeaders['Content-Type'] || '';

  if (isBinaryLikeContentType(contentType)) {
    return {
      body: `[binary response omitted: ${contentType || 'unknown content-type'}]`,
      truncated: false,
    };
  }

  try {
    const raw = await response.clone().text();
    if (!raw) return { body: null, truncated: false };
    const normalized = normalizeStringBody(raw);
    return { body: normalized.body, truncated: normalized.truncated };
  } catch {
    return { body: '[unreadable response body]', truncated: false };
  }
}

function appendLog(log: NetworkInspectorLog) {
  logs = [log, ...logs].slice(0, MAX_LOGS);
  notifyListeners();
}

export function subscribeNetworkInspector(listener: NetworkInspectorListener): () => void {
  listeners.add(listener);
  listener(snapshot());
  return () => {
    listeners.delete(listener);
  };
}

export function getNetworkInspectorSnapshot(): NetworkInspectorSnapshot {
  return snapshot();
}

export function setNetworkInspectorEnabled(value: boolean) {
  enabled = value;
  notifyListeners();
}

export function clearNetworkInspectorLogs() {
  logs = [];
  notifyListeners();
}

export function installNetworkInspector() {
  if (installed) return;
  if (typeof globalThis.fetch !== 'function') return;

  originalFetch = globalThis.fetch.bind(globalThis);

  const wrappedFetch: typeof fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    if (!originalFetch) {
      throw new Error('Original fetch is not available.');
    }

    const method = guessMethod(input, init);
    const url = guessUrl(input);
    const shouldTrack = enabled && isHttpUrl(url);

    if (!shouldTrack) {
      return originalFetch(input as any, init);
    }

    const requestHeaders = mergeHeaders(input, init);
    const requestBody = await requestBodyPreview(input, init);
    const startedAt = Date.now();
    const timestamp = new Date().toISOString();

    try {
      const response = await originalFetch(input as any, init);
      const durationMs = Date.now() - startedAt;
      const responseHeaders = headersToRecord(response.headers);
      const responseBody = await responseBodyPreview(response, responseHeaders);

      appendLog({
        id: `network-log-${++sequence}`,
        timestamp,
        method,
        url,
        requestHeaders,
        requestBody: requestBody.body,
        requestBodyTruncated: requestBody.truncated,
        statusCode: response.status,
        ok: response.ok,
        durationMs,
        responseHeaders,
        responseBody: responseBody.body,
        responseBodyTruncated: responseBody.truncated,
        error: null,
      });

      return response;
    } catch (err: any) {
      appendLog({
        id: `network-log-${++sequence}`,
        timestamp,
        method,
        url,
        requestHeaders,
        requestBody: requestBody.body,
        requestBodyTruncated: requestBody.truncated,
        statusCode: null,
        ok: null,
        durationMs: Date.now() - startedAt,
        responseHeaders: {},
        responseBody: null,
        responseBodyTruncated: false,
        error: err?.message || 'Unknown fetch error',
      });
      throw err;
    }
  }) as typeof fetch;

  globalThis.fetch = wrappedFetch;
  installed = true;
  notifyListeners();
}
