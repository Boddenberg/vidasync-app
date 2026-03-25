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
  deleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  date: string | null;
  time: string | null;
};

export type AppNotificationPatch = {
  id: string;
  title?: string;
  message?: string;
  type?: AppNotificationType;
  imageUrl?: string | null;
  actionLabel?: string | null;
  actionRoute?: string | null;
  readAt?: string | null;
  deleted?: boolean;
  deletedAt?: string | null;
  createdAt?: string;
  date?: string | null;
  time?: string | null;
};

export type NotificationsSnapshot = {
  notifications: AppNotification[];
  unreadCount: number;
};

export type NotificationsUpdate = {
  notifications: AppNotificationPatch[];
  unreadCount: number | null;
};

export type UpdateNotificationsParams = {
  notificationIds?: string[];
  markAll?: boolean;
};

type NotificationsResponse = {
  notifications?: unknown;
  unreadCount?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function hasOwn(record: Record<string, unknown>, key: string) {
  return Object.prototype.hasOwnProperty.call(record, key);
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

function getOptionalString(record: Record<string, unknown>, key: string): string | null | undefined {
  if (!hasOwn(record, key)) return undefined;
  if (record[key] === null) return null;
  return asString(record[key]);
}

function getOptionalBoolean(record: Record<string, unknown>, key: string): boolean | undefined {
  if (!hasOwn(record, key)) return undefined;

  const value = record[key];
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (value === 1) return true;
    if (value === 0) return false;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1') return true;
    if (normalized === 'false' || normalized === '0') return false;
  }

  return undefined;
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
    imageUrl: getOptionalString(value, 'imageUrl') ?? null,
    actionLabel: getOptionalString(value, 'actionLabel') ?? null,
    actionRoute: getOptionalString(value, 'actionRoute') ?? null,
    readAt: getOptionalString(value, 'readAt') ?? null,
    deleted: getOptionalBoolean(value, 'deleted') ?? false,
    deletedAt: getOptionalString(value, 'deletedAt') ?? null,
    createdAt,
    date: getOptionalString(value, 'date') ?? null,
    time: getOptionalString(value, 'time') ?? null,
  };
}

function parseNotificationPatch(value: unknown): AppNotificationPatch | null {
  if (!isRecord(value)) return null;

  const id = asString(value.id);
  if (!id) return null;

  const patch: AppNotificationPatch = { id };
  const title = getOptionalString(value, 'title');
  const message = getOptionalString(value, 'message');
  const imageUrl = getOptionalString(value, 'imageUrl');
  const actionLabel = getOptionalString(value, 'actionLabel');
  const actionRoute = getOptionalString(value, 'actionRoute');
  const readAt = getOptionalString(value, 'readAt');
  const deleted = getOptionalBoolean(value, 'deleted');
  const deletedAt = getOptionalString(value, 'deletedAt');
  const createdAt = getOptionalString(value, 'createdAt');
  const date = getOptionalString(value, 'date');
  const time = getOptionalString(value, 'time');

  if (title) patch.title = title;
  if (message) patch.message = message;
  if (hasOwn(value, 'type') && value.type !== null && value.type !== undefined) {
    patch.type = normalizeType(value.type);
  }
  if (imageUrl !== undefined) patch.imageUrl = imageUrl;
  if (actionLabel !== undefined) patch.actionLabel = actionLabel;
  if (actionRoute !== undefined) patch.actionRoute = actionRoute;
  if (readAt !== undefined) patch.readAt = readAt;
  if (deleted !== undefined) patch.deleted = deleted;
  if (deletedAt !== undefined) patch.deletedAt = deletedAt;
  if (createdAt) patch.createdAt = createdAt;
  if (date !== undefined) patch.date = date;
  if (time !== undefined) patch.time = time;

  return patch;
}

export function isNotificationVisible(notification: Pick<AppNotification, 'deleted'>) {
  return !notification.deleted;
}

export function isNotificationUnread(notification: Pick<AppNotification, 'deleted' | 'readAt'>) {
  return !notification.deleted && !notification.readAt;
}

export function countUnreadNotifications(notifications: Array<Pick<AppNotification, 'deleted' | 'readAt'>>) {
  return notifications.filter(isNotificationUnread).length;
}

export function mergeNotificationPatch(
  current: AppNotification | undefined,
  patch: AppNotificationPatch,
): AppNotification | null {
  const title = patch.title ?? current?.title;
  const message = patch.message ?? current?.message;
  const createdAt = patch.createdAt ?? current?.createdAt;

  if (!title || !message || !createdAt) {
    return null;
  }

  return {
    id: patch.id,
    title,
    message,
    type: patch.type ?? current?.type ?? 'INFO',
    imageUrl: patch.imageUrl !== undefined ? patch.imageUrl : current?.imageUrl ?? null,
    actionLabel: patch.actionLabel !== undefined ? patch.actionLabel : current?.actionLabel ?? null,
    actionRoute: patch.actionRoute !== undefined ? patch.actionRoute : current?.actionRoute ?? null,
    readAt: patch.readAt !== undefined ? patch.readAt : current?.readAt ?? null,
    deleted: patch.deleted ?? current?.deleted ?? false,
    deletedAt: patch.deletedAt !== undefined ? patch.deletedAt : current?.deletedAt ?? null,
    createdAt,
    date: patch.date !== undefined ? patch.date : current?.date ?? null,
    time: patch.time !== undefined ? patch.time : current?.time ?? null,
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
    unreadCount: unreadCount ?? countUnreadNotifications(notifications),
  };
}

function parseNotificationsUpdate(payload: unknown): NotificationsUpdate {
  const root = isRecord(payload) ? payload : {};

  return {
    notifications: Array.isArray(root.notifications)
      ? root.notifications.map(parseNotificationPatch).filter((item): item is AppNotificationPatch => item !== null)
      : [],
    unreadCount: asNumber(root.unreadCount),
  };
}

function isUnavailableNotificationsError(error: unknown) {
  if (!(error instanceof Error)) return false;
  return /(404|405|501|not found|not implemented|cannot get \/notifications|nao encontrado)/i.test(error.message);
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

export async function markNotificationsRead(params: UpdateNotificationsParams): Promise<NotificationsUpdate | null> {
  try {
    const payload = await apiPost<NotificationsResponse>('/notifications/read', params);
    return parseNotificationsUpdate(payload);
  } catch (error) {
    if (isUnavailableNotificationsError(error)) {
      return null;
    }
    throw error;
  }
}

export async function markNotificationsDeleted(params: UpdateNotificationsParams): Promise<NotificationsUpdate | null> {
  try {
    const payload = await apiPost<NotificationsResponse>('/notifications/delete', params);
    return parseNotificationsUpdate(payload);
  } catch (error) {
    if (isUnavailableNotificationsError(error)) {
      return null;
    }
    throw error;
  }
}
