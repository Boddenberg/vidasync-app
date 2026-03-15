import { apiGetJson, apiPost } from './api';

export type FeedbackItem = {
  id: string;
  userId: string;
  userName: string;
  message: string;
  imageUrl: string | null;
  status: string;
  developerResponse: string | null;
  respondedAt: string | null;
  respondedBy: string | null;
  responseSeenAt: string | null;
  createdAt: string;
  updatedAt: string;
  date: string;
  time: string;
};

type FeedbackResponse = {
  feedback: FeedbackItem;
};

type FeedbackListResponse = {
  feedbacks: FeedbackItem[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function parseFeedbackItem(value: unknown): FeedbackItem | null {
  if (!isRecord(value)) return null;
  if (
    typeof value.id !== 'string' ||
    typeof value.userId !== 'string' ||
    typeof value.userName !== 'string' ||
    typeof value.message !== 'string' ||
    typeof value.status !== 'string' ||
    typeof value.createdAt !== 'string' ||
    typeof value.updatedAt !== 'string' ||
    typeof value.date !== 'string' ||
    typeof value.time !== 'string'
  ) {
    return null;
  }

  return {
    id: value.id,
    userId: value.userId,
    userName: value.userName,
    message: value.message,
    imageUrl: typeof value.imageUrl === 'string' ? value.imageUrl : null,
    status: value.status,
    developerResponse: typeof value.developerResponse === 'string' ? value.developerResponse : null,
    respondedAt: typeof value.respondedAt === 'string' ? value.respondedAt : null,
    respondedBy: typeof value.respondedBy === 'string' ? value.respondedBy : null,
    responseSeenAt: typeof value.responseSeenAt === 'string' ? value.responseSeenAt : null,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    date: value.date,
    time: value.time,
  };
}

export async function createFeedback(params: {
  userName: string;
  message: string;
  imageUrl?: string | null;
}): Promise<FeedbackItem> {
  const data = await apiPost<FeedbackResponse>('/feedback', {
    userName: params.userName,
    message: params.message,
    imageUrl: params.imageUrl ?? null,
  });

  const feedback = parseFeedbackItem(data?.feedback);
  if (!feedback) {
    throw new Error('Resposta invalida do endpoint /feedback');
  }

  return feedback;
}

export async function getAdminFeedbacks(internalApiKey: string): Promise<FeedbackItem[]> {
  const data = await apiGetJson<FeedbackListResponse>('/feedback', {
    'X-Internal-Api-Key': internalApiKey,
  });

  return Array.isArray(data?.feedbacks)
    ? data.feedbacks.map(parseFeedbackItem).filter((item): item is FeedbackItem => item !== null)
    : [];
}
