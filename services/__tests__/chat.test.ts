import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiPost } from '@/services/api';
import {
  mapChatRequestErrorMessage,
  normalizeChatResponse,
  sendChatPrompt,
} from '@/services/chat';

vi.mock('@/services/api', () => ({
  apiPost: vi.fn(),
}));

const mockedApiPost = vi.mocked(apiPost);

describe('chat service', () => {
  beforeEach(() => {
    mockedApiPost.mockReset();
  });

  it('normalizes the chat response with camelCase fields', () => {
    const result = normalizeChatResponse({
      response: 'Oi! Posso ajudar.',
      model: 'gpt-4o-mini',
      conversationId: 'conversation-1',
      intent: 'conversa_geral',
      confidence: 0.55,
      needsReview: false,
      warnings: ['informacao geral'],
      memory: {
        totalTurns: 2,
        shortTermTurns: 2,
        summarizedTurns: 0,
        hasSummary: false,
        updatedAt: '2026-03-26T05:48:03.794889Z',
      },
      disclaimer: 'Consulte um nutricionista.',
      traceId: 'trace-1',
    });

    expect(result.response).toBe('Oi! Posso ajudar.');
    expect(result.conversationId).toBe('conversation-1');
    expect(result.memory?.totalTurns).toBe(2);
    expect(result.warnings).toEqual(['informacao geral']);
    expect(result.traceId).toBe('trace-1');
  });

  it('accepts snake_case fields from the backend', () => {
    const result = normalizeChatResponse({
      response: 'Resposta normalizada.',
      conversation_id: 'conversation-2',
      needs_review: true,
      trace_id: 'trace-2',
      memory: {
        total_turns: 4,
        short_term_turns: 4,
        summarized_turns: 1,
        has_summary: true,
        updated_at: '2026-03-26T05:48:17.363602Z',
      },
    });

    expect(result.conversationId).toBe('conversation-2');
    expect(result.needsReview).toBe(true);
    expect(result.memory).toEqual({
      totalTurns: 4,
      shortTermTurns: 4,
      summarizedTurns: 1,
      hasSummary: true,
      updatedAt: '2026-03-26T05:48:17.363602Z',
    });
  });

  it('throws when the backend response is missing the required message fields', () => {
    expect(() =>
      normalizeChatResponse({
        model: 'gpt-4o-mini',
      }),
    ).toThrow('Resposta invalida do endpoint /chat.');
  });

  it('sends the prompt and preserves the conversation id', async () => {
    mockedApiPost.mockResolvedValue({
      response: 'Tudo certo.',
      conversationId: 'conversation-3',
    });

    const result = await sendChatPrompt({
      prompt: '  Oi, agente  ',
      conversationId: 'conversation-2',
    });

    expect(mockedApiPost).toHaveBeenCalledWith('/chat', {
      prompt: 'Oi, agente',
      conversationId: 'conversation-2',
    });
    expect(result.response).toBe('Tudo certo.');
    expect(result.conversationId).toBe('conversation-3');
  });

  it('blocks empty prompts before calling the API', async () => {
    await expect(sendChatPrompt({ prompt: '   ' })).rejects.toThrow(
      'Escreva uma mensagem para conversar com o assistente.',
    );
    expect(mockedApiPost).not.toHaveBeenCalled();
  });

  it('maps backend validation errors to a friendly message', () => {
    const message = mapChatRequestErrorMessage('prompt e obrigatorio');
    expect(message).toBe('Escreva uma mensagem para conversar com o assistente.');
  });
});
