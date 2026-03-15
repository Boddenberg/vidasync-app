import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Brand, Radii, Shadows, Typography } from '@/constants/theme';
import type { AppNotification } from '@/services/notifications';

type Props = {
  visible: boolean;
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  busyIds: Record<string, boolean>;
  markingAll: boolean;
  onClose: () => void;
  onRefresh: () => void;
  onPressNotification: (notification: AppNotification) => void;
  onMarkAllRead: () => void;
};

function formatNotificationMoment(notification: AppNotification) {
  if (notification.date && notification.time) {
    return `${notification.date} às ${notification.time.slice(0, 5)}`;
  }

  const parsed = new Date(notification.createdAt);
  if (Number.isNaN(parsed.getTime())) {
    return 'Agora há pouco';
  }

  return parsed.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }) + ` às ${parsed.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
}

function getTypePalette(type: AppNotification['type']) {
  switch (type) {
    case 'SUCCESS':
      return {
        icon: 'checkmark-circle-outline' as const,
        iconColor: Brand.greenDark,
        iconBg: '#E9F8EE',
        border: '#D7ECDD',
      };
    case 'WARNING':
      return {
        icon: 'alert-circle-outline' as const,
        iconColor: '#B45309',
        iconBg: '#FFF4DD',
        border: '#F2E4BD',
      };
    case 'ALERT':
      return {
        icon: 'notifications-outline' as const,
        iconColor: Brand.danger,
        iconBg: '#FFEDEE',
        border: '#F4D8DB',
      };
    default:
      return {
        icon: 'chatbubble-ellipses-outline' as const,
        iconColor: Brand.blue,
        iconBg: '#EAF1FF',
        border: '#DAE5FF',
      };
  }
}

export function NotificationCenterModal({
  visible,
  notifications,
  unreadCount,
  loading,
  error,
  busyIds,
  markingAll,
  onClose,
  onRefresh,
  onPressNotification,
  onMarkAllRead,
}: Props) {
  const titleLabel = useMemo(() => {
    if (unreadCount <= 0) return 'Tudo em dia';
    if (unreadCount === 1) return '1 nova notificação';
    return `${unreadCount} novas notificações`;
  }, [unreadCount]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable style={s.sheet} onPress={(event) => event.stopPropagation()}>
          <View style={s.handleWrap}>
            <View style={s.handle} />
          </View>

          <View style={s.header}>
            <View style={{ flex: 1 }}>
              <Text style={s.title}>Notificações</Text>
              <Text style={s.subtitle}>Avisos, respostas e recados importantes do app.</Text>
            </View>
            <Pressable style={({ pressed }) => [s.closeBtn, pressed && s.pressed]} onPress={onClose}>
              <Ionicons name="close-outline" size={20} color={Brand.text} />
            </Pressable>
          </View>

          <View style={s.summaryCard}>
            <View>
              <Text style={s.summaryLabel}>Caixa de entrada</Text>
              <Text style={s.summaryTitle}>{titleLabel}</Text>
            </View>
            <Pressable
              style={({ pressed }) => [
                s.summaryAction,
                (markingAll || unreadCount === 0) && s.summaryActionDisabled,
                pressed && s.pressed,
              ]}
              disabled={markingAll || unreadCount === 0}
              onPress={onMarkAllRead}>
              {markingAll ? (
                <ActivityIndicator size="small" color={Brand.greenDark} />
              ) : (
                <Text style={s.summaryActionText}>Marcar tudo como lido</Text>
              )}
            </Pressable>
          </View>

          {loading ? (
            <View style={s.centerState}>
              <ActivityIndicator size="small" color={Brand.greenDark} />
              <Text style={s.stateText}>Carregando notificações...</Text>
            </View>
          ) : error ? (
            <View style={s.centerState}>
              <Text style={s.errorTitle}>Não foi possível carregar agora.</Text>
              <Text style={s.stateText}>{error}</Text>
              <Pressable style={({ pressed }) => [s.retryBtn, pressed && s.pressed]} onPress={onRefresh}>
                <Text style={s.retryBtnText}>Tentar novamente</Text>
              </Pressable>
            </View>
          ) : notifications.length === 0 ? (
            <View style={s.centerState}>
              <View style={s.emptyIconWrap}>
                <Ionicons name="notifications-off-outline" size={24} color={Brand.textSecondary} />
              </View>
              <Text style={s.emptyTitle}>Nenhuma notificação por enquanto</Text>
              <Text style={s.stateText}>Quando houver recados novos, respostas ou alertas, eles aparecem aqui.</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={s.list} showsVerticalScrollIndicator={false}>
              {notifications.map((notification) => {
                const palette = getTypePalette(notification.type);
                const unread = !notification.readAt;
                const busy = !!busyIds[notification.id];

                return (
                  <Pressable
                    key={notification.id}
                    style={({ pressed }) => [
                      s.card,
                      { borderColor: unread ? palette.border : Brand.border },
                      unread && s.cardUnread,
                      pressed && s.pressed,
                    ]}
                    onPress={() => onPressNotification(notification)}>
                    <View style={s.cardTop}>
                      <View style={[s.cardIcon, { backgroundColor: palette.iconBg }]}>
                        <Ionicons name={palette.icon} size={18} color={palette.iconColor} />
                      </View>

                      <View style={{ flex: 1, gap: 3 }}>
                        <View style={s.cardTitleRow}>
                          <Text style={s.cardTitle}>{notification.title}</Text>
                          {unread ? <View style={s.unreadDot} /> : null}
                        </View>
                        <Text style={s.cardMeta}>{formatNotificationMoment(notification)}</Text>
                      </View>

                      {busy ? <ActivityIndicator size="small" color={Brand.greenDark} /> : null}
                    </View>

                    <Text style={s.cardMessage}>{notification.message}</Text>

                    {notification.imageUrl ? (
                      <Image source={{ uri: notification.imageUrl }} style={s.cardImage} resizeMode="cover" />
                    ) : null}

                    {notification.actionLabel ? (
                      <View style={s.cardFooter}>
                        <Text style={s.actionChip}>{notification.actionLabel}</Text>
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(16, 35, 26, 0.28)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '88%',
    backgroundColor: Brand.bg,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    paddingHorizontal: 18,
    paddingBottom: 28,
    gap: 14,
  },
  handleWrap: {
    alignItems: 'center',
    paddingTop: 12,
  },
  handle: {
    width: 42,
    height: 4,
    borderRadius: Radii.pill,
    backgroundColor: Brand.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  title: {
    ...Typography.subtitle,
    color: Brand.text,
    fontWeight: '800',
  },
  subtitle: {
    ...Typography.helper,
    color: Brand.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.card,
    borderWidth: 1,
    borderColor: Brand.border,
  },
  summaryCard: {
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: '#D4E6D8',
    backgroundColor: '#EAF7EE',
    padding: 14,
    gap: 10,
  },
  summaryLabel: {
    ...Typography.caption,
    color: Brand.greenDeeper,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  summaryTitle: {
    ...Typography.body,
    color: Brand.text,
    fontWeight: '800',
    marginTop: 2,
  },
  summaryAction: {
    alignSelf: 'flex-start',
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: '#C5DDCB',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 36,
    justifyContent: 'center',
  },
  summaryActionDisabled: {
    opacity: 0.5,
  },
  summaryActionText: {
    ...Typography.caption,
    color: Brand.greenDark,
    fontWeight: '700',
  },
  centerState: {
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Brand.border,
    backgroundColor: Brand.card,
    paddingHorizontal: 18,
    paddingVertical: 26,
    alignItems: 'center',
    gap: 10,
    ...Shadows.card,
  },
  stateText: {
    ...Typography.helper,
    color: Brand.textSecondary,
    textAlign: 'center',
  },
  errorTitle: {
    ...Typography.body,
    color: Brand.text,
    fontWeight: '700',
    textAlign: 'center',
  },
  retryBtn: {
    borderRadius: Radii.pill,
    backgroundColor: Brand.green,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  retryBtnText: {
    ...Typography.caption,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  emptyIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.surfaceAlt,
  },
  emptyTitle: {
    ...Typography.body,
    color: Brand.text,
    fontWeight: '700',
    textAlign: 'center',
  },
  list: {
    gap: 10,
    paddingBottom: 12,
  },
  card: {
    borderRadius: Radii.lg,
    borderWidth: 1,
    backgroundColor: Brand.card,
    padding: 14,
    gap: 10,
    ...Shadows.card,
  },
  cardUnread: {
    backgroundColor: '#FCFFFD',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  cardIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    ...Typography.body,
    color: Brand.text,
    fontWeight: '800',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: Radii.pill,
    backgroundColor: Brand.green,
  },
  cardMeta: {
    ...Typography.caption,
    color: Brand.textSecondary,
  },
  cardMessage: {
    ...Typography.helper,
    color: Brand.text,
  },
  cardImage: {
    width: '100%',
    height: 132,
    borderRadius: 16,
    backgroundColor: Brand.surfaceAlt,
  },
  cardFooter: {
    flexDirection: 'row',
  },
  actionChip: {
    ...Typography.caption,
    color: Brand.greenDark,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.pill,
    backgroundColor: '#EAF7EE',
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.85,
  },
});
