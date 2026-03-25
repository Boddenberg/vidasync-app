import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiGetJson, apiPost } from '@/services/api';
import {
  countUnreadNotifications,
  getNotifications,
  markNotificationsDeleted,
  markNotificationsRead,
  mergeNotificationPatch,
  type AppNotification,
} from '@/services/notifications';

vi.mock('@/services/api', () => ({
  apiGetJson: vi.fn(),
  apiPost: vi.fn(),
}));

const mockedApiGetJson = vi.mocked(apiGetJson);
const mockedApiPost = vi.mocked(apiPost);

function buildNotification(overrides: Partial<AppNotification> = {}): AppNotification {
  return {
    id: overrides.id ?? 'notification-1',
    title: overrides.title ?? 'Resposta da equipe',
    message: overrides.message ?? 'Respondemos seu feedback.',
    type: overrides.type ?? 'INFO',
    imageUrl: overrides.imageUrl ?? null,
    actionLabel: overrides.actionLabel ?? 'Abrir',
    actionRoute: overrides.actionRoute ?? '/feedback',
    readAt: overrides.readAt ?? null,
    deleted: overrides.deleted ?? false,
    deletedAt: overrides.deletedAt ?? null,
    createdAt: overrides.createdAt ?? '2026-03-15T16:20:00.000Z',
    date: overrides.date ?? '2026-03-15',
    time: overrides.time ?? '16:20:00',
  };
}

describe('notifications service', () => {
  beforeEach(() => {
    mockedApiGetJson.mockReset();
    mockedApiPost.mockReset();
  });

  it('falls back to active unread items when GET response omits unreadCount', async () => {
    mockedApiGetJson.mockResolvedValue({
      notifications: [
        {
          id: 'active-unread',
          title: 'Nova resposta',
          message: 'Item visivel e nao lido.',
          type: 'INFO',
          readAt: null,
          deleted: false,
          deletedAt: null,
          createdAt: '2026-03-15T16:20:00.000Z',
          date: '2026-03-15',
          time: '16:20:00',
        },
        {
          id: 'deleted-unread',
          title: 'Historico',
          message: 'Nao pode entrar no badge.',
          type: 'INFO',
          readAt: null,
          deleted: true,
          deletedAt: '2026-03-15T16:22:00.000Z',
          createdAt: '2026-03-15T16:19:00.000Z',
          date: '2026-03-15',
          time: '16:19:00',
        },
      ],
    });

    const snapshot = await getNotifications();

    expect(snapshot.notifications).toHaveLength(2);
    expect(snapshot.notifications[1]?.deleted).toBe(true);
    expect(snapshot.unreadCount).toBe(1);
  });

  it('parses partial read updates without requiring title or message', async () => {
    mockedApiPost.mockResolvedValue({
      unreadCount: 0,
      notifications: [
        {
          id: 'notification-1',
          readAt: '2026-03-15T16:25:00.000Z',
          deleted: false,
          deletedAt: null,
        },
      ],
    });

    const update = await markNotificationsRead({ notificationIds: ['notification-1'] });

    expect(update).not.toBeNull();
    expect(update?.unreadCount).toBe(0);
    expect(update?.notifications).toEqual([
      {
        id: 'notification-1',
        readAt: '2026-03-15T16:25:00.000Z',
        deleted: false,
        deletedAt: null,
      },
    ]);
  });

  it('parses partial delete updates for soft delete endpoint', async () => {
    mockedApiPost.mockResolvedValue({
      unreadCount: 0,
      notifications: [
        {
          id: 'notification-1',
          deleted: true,
          deletedAt: '2026-03-15T16:30:00.000Z',
        },
      ],
    });

    const update = await markNotificationsDeleted({ notificationIds: ['notification-1'] });

    expect(update).not.toBeNull();
    expect(update?.notifications[0]).toEqual({
      id: 'notification-1',
      deleted: true,
      deletedAt: '2026-03-15T16:30:00.000Z',
    });
  });

  it('merges partial notification patches onto local inbox items', () => {
    const current = buildNotification({
      id: 'notification-1',
      readAt: null,
      deleted: false,
      deletedAt: null,
    });

    const merged = mergeNotificationPatch(current, {
      id: 'notification-1',
      readAt: '2026-03-15T16:25:00.000Z',
      deleted: true,
      deletedAt: '2026-03-15T16:30:00.000Z',
    });

    expect(merged).toEqual({
      ...current,
      readAt: '2026-03-15T16:25:00.000Z',
      deleted: true,
      deletedAt: '2026-03-15T16:30:00.000Z',
    });
  });

  it('counts only active unread items for local badge fallback', () => {
    const notifications = [
      buildNotification({ id: 'active-unread', readAt: null, deleted: false }),
      buildNotification({ id: 'active-read', readAt: '2026-03-15T16:25:00.000Z', deleted: false }),
      buildNotification({ id: 'deleted-unread', readAt: null, deleted: true }),
    ];

    expect(countUnreadNotifications(notifications)).toBe(1);
  });
});
