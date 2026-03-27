import { describe, expect, it } from 'vitest';

import {
  serializeNetworkInspectorLog,
  serializeNetworkInspectorLogs,
} from '@/utils/network-inspector-clipboard';
import type { NetworkInspectorLog } from '@/services/network-inspector';

function createLog(overrides: Partial<NetworkInspectorLog> = {}): NetworkInspectorLog {
  return {
    id: overrides.id ?? 'network-log-1',
    timestamp: overrides.timestamp ?? '2026-03-27T12:00:00.000Z',
    method: overrides.method ?? 'POST',
    url: overrides.url ?? 'https://vidasync-bff-production.up.railway.app/chat',
    requestHeaders: overrides.requestHeaders ?? { authorization: 'Bearer token' },
    requestBody: overrides.requestBody ?? '{"message":"oi"}',
    requestBodyTruncated: overrides.requestBodyTruncated ?? false,
    statusCode: overrides.statusCode ?? 200,
    ok: overrides.ok ?? true,
    durationMs: overrides.durationMs ?? 820,
    responseHeaders: overrides.responseHeaders ?? { 'content-type': 'application/json' },
    responseBody: overrides.responseBody ?? '{"answer":"ola"}',
    responseBodyTruncated: overrides.responseBodyTruncated ?? false,
    error: overrides.error ?? null,
  };
}

describe('devtools clipboard serializers', () => {
  it('serializes a single network log with grouped request and response payloads', () => {
    const raw = serializeNetworkInspectorLog(createLog());
    const parsed = JSON.parse(raw);

    expect(parsed.id).toBe('network-log-1');
    expect(parsed.request.headers.authorization).toBe('Bearer token');
    expect(parsed.request.body).toContain('"message": "oi"');
    expect(parsed.response.statusCode).toBe(200);
    expect(parsed.response.body).toContain('"answer": "ola"');
  });

  it('serializes all available logs with export metadata', () => {
    const raw = serializeNetworkInspectorLogs([
      createLog({ id: 'network-log-1' }),
      createLog({ id: 'network-log-2', statusCode: 500, ok: false, error: 'Internal Server Error' }),
    ]);
    const parsed = JSON.parse(raw);

    expect(parsed.totalLogs).toBe(2);
    expect(parsed.exportedAt).toBeTypeOf('string');
    expect(parsed.logs).toHaveLength(2);
    expect(parsed.logs[1].error).toBe('Internal Server Error');
  });
});
