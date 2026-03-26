export type ChatQuickAction = {
  id: string;
  label: string;
  route: string;
  description: string;
};

export type ChatRole = 'assistant' | 'user';

export type ChatMemorySnapshot = {
  totalTurns: number;
  shortTermTurns: number;
  summarizedTurns: number;
  hasSummary: boolean;
  updatedAt: string | null;
};

export type ChatReply = {
  response: string;
  model: string | null;
  conversationId: string;
  intent: string | null;
  confidence: number | null;
  needsReview: boolean;
  warnings: string[];
  memory: ChatMemorySnapshot | null;
  disclaimer: string | null;
  traceId: string | null;
};

export type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  createdAt: string;
  warnings: string[];
  disclaimer: string | null;
  traceId: string | null;
  intent: string | null;
  confidence: number | null;
  model: string | null;
  isError?: boolean;
};

