import { apiPost } from '@/services/api';
import type { ChatMemorySnapshot, ChatReply } from '@/types/chat';

type SendChatPromptParams = {
  prompt: string;
  conversationId?: string | null;
};

function asTrimmedString(value: unknown): string {
  return `${value ?? ''}`.trim();
}

function hasOwnProperty(value: unknown, key: string): boolean {
  return typeof value === 'object' && value != null && Object.prototype.hasOwnProperty.call(value, key);
}

function firstDefinedValue(source: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (hasOwnProperty(source, key)) {
      return source[key];
    }
  }

  return undefined;
}

function readOptionalString(source: Record<string, unknown>, keys: string[]): string | null {
  const rawValue = firstDefinedValue(source, keys);

  if (rawValue === undefined || rawValue === null) {
    return null;
  }

  const normalized = asTrimmedString(rawValue);
  return normalized || null;
}

function readBoolean(source: Record<string, unknown>, keys: string[], fallback = false): boolean {
  const rawValue = firstDefinedValue(source, keys);

  if (typeof rawValue === 'boolean') return rawValue;
  if (typeof rawValue === 'number') return rawValue !== 0;

  if (typeof rawValue === 'string') {
    const normalized = rawValue.trim().toLowerCase();
    if (['true', '1', 'yes'].includes(normalized)) return true;
    if (['false', '0', 'no'].includes(normalized)) return false;
  }

  return fallback;
}

function readNumber(source: Record<string, unknown>, keys: string[]): number | null {
  const rawValue = firstDefinedValue(source, keys);

  if (typeof rawValue === 'number' && Number.isFinite(rawValue)) {
    return rawValue;
  }

  if (typeof rawValue === 'string') {
    const normalized = Number(rawValue);
    return Number.isFinite(normalized) ? normalized : null;
  }

  return null;
}

function readStringArray(source: Record<string, unknown>, keys: string[]): string[] {
  const rawValue = firstDefinedValue(source, keys);

  if (!Array.isArray(rawValue)) {
    return [];
  }

  return rawValue
    .map((item) => asTrimmedString(item))
    .filter((item) => item.length > 0);
}

function readMemorySnapshot(source: Record<string, unknown>, keys: string[]): ChatMemorySnapshot | null {
  const rawValue = firstDefinedValue(source, keys);

  if (typeof rawValue !== 'object' || rawValue == null) {
    return null;
  }

  const row = rawValue as Record<string, unknown>;

  return {
    totalTurns: readNumber(row, ['totalTurns', 'total_turns']) ?? 0,
    shortTermTurns: readNumber(row, ['shortTermTurns', 'short_term_turns']) ?? 0,
    summarizedTurns: readNumber(row, ['summarizedTurns', 'summarized_turns']) ?? 0,
    hasSummary: readBoolean(row, ['hasSummary', 'has_summary'], false),
    updatedAt: readOptionalString(row, ['updatedAt', 'updated_at']),
  };
}

function normalizeMessageForMatch(rawMessage: string): string {
  return rawMessage
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function normalizeChatResponse(value: unknown): ChatReply {
  if (typeof value !== 'object' || value == null) {
    throw new Error('Resposta invalida do endpoint /chat.');
  }

  const row = value as Record<string, unknown>;
  const response = readOptionalString(row, ['response', 'reply']);
  const conversationId = readOptionalString(row, ['conversationId', 'conversation_id']);

  if (!response || !conversationId) {
    throw new Error('Resposta invalida do endpoint /chat.');
  }

  return {
    response,
    model: readOptionalString(row, ['model']),
    conversationId,
    intent: readOptionalString(row, ['intent']),
    confidence: readNumber(row, ['confidence']),
    needsReview: readBoolean(row, ['needsReview', 'needs_review'], false),
    warnings: readStringArray(row, ['warnings']),
    memory: readMemorySnapshot(row, ['memory']),
    disclaimer: readOptionalString(row, ['disclaimer']),
    traceId: readOptionalString(row, ['traceId', 'trace_id']),
  };
}

export function mapChatRequestErrorMessage(rawMessage: string): string {
  const normalized = normalizeMessageForMatch(rawMessage);

  if (!normalized) {
    return 'Nao consegui enviar sua mensagem agora.';
  }

  if (normalized.includes('prompt e obrigatorio')) {
    return 'Escreva uma mensagem para conversar com o assistente.';
  }

  if (normalized.includes('network request failed')) {
    return 'Nao consegui falar com o chat agora. Verifique sua conexao e tente novamente.';
  }

  if (
    normalized.includes('404') ||
    normalized.includes('not found') ||
    normalized.includes('nao encontrado')
  ) {
    return 'O endpoint de chat nao esta disponivel no backend agora.';
  }

  if (normalized.includes('bad request')) {
    return 'Nao foi possivel processar a mensagem enviada. Tente reformular a pergunta.';
  }

  return rawMessage;
}

export async function sendChatPrompt({
  prompt,
  conversationId,
}: SendChatPromptParams): Promise<ChatReply> {
  const trimmedPrompt = prompt.trim();

  if (!trimmedPrompt) {
    throw new Error('Escreva uma mensagem para conversar com o assistente.');
  }

  const payload: Record<string, string> = {
    prompt: trimmedPrompt,
  };

  if (conversationId?.trim()) {
    payload.conversationId = conversationId.trim();
  }

  try {
    const response = await apiPost('/chat', payload);
    return normalizeChatResponse(response);
  } catch (error: any) {
    throw new Error(mapChatRequestErrorMessage(error?.message ?? 'Falha ao enviar mensagem.'));
  }
}
