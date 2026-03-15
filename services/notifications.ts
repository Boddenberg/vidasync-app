import { apiGetJson, apiPost } from './api';

export type AppNotificationType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT';

export type AppNotification = {
  id: string;
  title: string;
  message: string;
  type: AppNotificationType;
  imageUrl: string | null;
  actionLabel: string | null;
  actionRoute: string | null;
  readAt: string | null;
  createdAt: string;
  date: string | null;
  time: string | null;
};

export type NotificationsSnapshot = {
  notifications: AppNotification[];
  unreadCount: number;
};

type NotificationsResponse = {
  notifications?: unknown;
  unreadCount?: unknown;
};

type NotificationReadResponse = {
  notifications?: unknown;
  unreadCount?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function normalizeType(value: unknown): AppNotificationType {
  const text = asString(value)?.toUpperCase();
  if (text === 'SUCCESS' || text === 'WARNING' || text === 'ALERT') {
    return text;
  }
  return 'INFO';
}

function parseNotification(value: unknown): AppNotification | null {
  if (!isRecord(value)) return null;

  const id = asString(value.id);
  const title = asString(value.title);
  const message = asString(value.message);
  const createdAt = asString(value.createdAt);

  if (!id || !title || !message || !createdAt) {
    return null;
  }

  return {
    id,
    title,
    message,
    type: normalizeType(value.type),
    imageUrl: asString(value.imageUrl),
    actionLabel: asString(value.actionLabel),
    actionRoute: asString(value.actionRoute),
    readAt: asString(value.readAt),
    createdAt,
    date: asString(value.date),
    time: asString(value.time),
  };
}

function parseNotificationsSnapshot(payload: unknown): NotificationsSnapshot {
  const root = isRecord(payload) ? payload : {};
  const notifications = Array.isArray(root.notifications)
    ? root.notifications.map(parseNotification).filter((item): item is AppNotification => item !== null)
    : [];
  const unreadCount = asNumber(root.unreadCount);

  return {
    notifications,
    unreadCount: unreadCount ?? notifications.filter((item) => !item.readAt).length,
  };
}

function isUnavailableNotificationsError(error: unknown) {
  if (!(error instanceof Error)) return false;
  return /(404|405|501|not found|not implemented|cannot get \/notifications|nao encontrado|não encontrado)/i.test(error.message);
}

export async function getNotifications(): Promise<NotificationsSnapshot> {
  try {
    const payload = await apiGetJson<NotificationsResponse>('/notifications');
    return parseNotificationsSnapshot(payload);
  } catch (error) {
    if (isUnavailableNotificationsError(error)) {
      return { notifications: [], unreadCount: 0 };
    }
    throw error;
  }
}

export async function markNotificationsRead(params: {
  notificationIds?: string[];
  markAll?: boolean;
}): Promise<NotificationsSnapshot | null> {
  try {
    const payload = await apiPost<NotificationReadResponse | NotificationsSnapshot>('/notifications/read', params);
    return parseNotificationsSnapshot(payload);
  } catch (error) {
    if (isUnavailableNotificationsError(error)) {
      return null;
    }
    throw error;
  }
}
