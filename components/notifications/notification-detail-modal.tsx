import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { Brand, Radii, Shadows, Typography } from '@/constants/theme';
import type { AppNotification } from '@/services/notifications';

type Props = {
  visible: boolean;
  notification: AppNotification | null;
  onClose: () => void;
  onOpenAction: (notification: AppNotification) => void;
};

const notificationDateFormatter = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const notificationTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  hour: '2-digit',
  minute: '2-digit',
});

function formatNotificationMoment(notification: AppNotification) {
  const createdAt = new Date(notification.createdAt);
  if (!Number.isNaN(createdAt.getTime())) {
    return `${notificationDateFormatter.format(createdAt)} às ${notificationTimeFormatter.format(createdAt)}`;
  }

  if (notification.date && notification.time) {
    const fallback = new Date(`${notification.date}T${notification.time}Z`);
    if (!Number.isNaN(fallback.getTime())) {
      return `${notificationDateFormatter.format(fallback)} às ${notificationTimeFormatter.format(fallback)}`;
    }
  }

  return 'Agora há pouco';
}

export function NotificationDetailModal({ visible, notification, onClose, onOpenAction }: Props) {
  const hasMessage = Boolean(notification?.message?.trim());
  const hasImage = Boolean(notification?.imageUrl);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={s.root}>
        <View style={s.header}>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={s.headerAction}>Fechar</Text>
          </Pressable>
          <Text style={s.headerTitle}>Mensagem</Text>
          <View style={s.headerSpacer} />
        </View>

        {notification ? (
          <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
            <View style={s.card}>
              <Text style={s.title}>{notification.title}</Text>
              <Text style={s.meta}>{formatNotificationMoment(notification)}</Text>

              {hasMessage ? <Text style={s.message}>{notification.message}</Text> : null}

              {hasImage ? (
                <Image
                  source={{ uri: notification.imageUrl! }}
                  style={[s.image, !hasMessage && s.imageOnly]}
                  resizeMode="contain"
                />
              ) : null}

              {!hasMessage && !hasImage ? (
                <View style={s.emptyState}>
                  <Text style={s.emptyText}>Essa notificação não trouxe conteúdo adicional além do título.</Text>
                </View>
              ) : null}
            </View>

            {notification.actionRoute ? (
              <AppButton
                title={notification.actionLabel ?? 'Abrir'}
                onPress={() => onOpenAction(notification)}
              />
            ) : null}
          </ScrollView>
        ) : null}
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Brand.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Brand.border,
    backgroundColor: Brand.card,
  },
  headerAction: {
    ...Typography.body,
    color: Brand.greenDark,
    fontWeight: '700',
  },
  headerTitle: {
    ...Typography.body,
    color: Brand.text,
    fontWeight: '800',
  },
  headerSpacer: {
    width: 52,
  },
  scroll: {
    padding: 18,
    paddingBottom: 42,
    gap: 16,
  },
  card: {
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Brand.border,
    backgroundColor: Brand.card,
    padding: 18,
    gap: 14,
    ...Shadows.card,
  },
  title: {
    ...Typography.subtitle,
    color: Brand.text,
    fontWeight: '800',
  },
  meta: {
    ...Typography.caption,
    color: Brand.textSecondary,
  },
  message: {
    ...Typography.body,
    color: Brand.text,
  },
  image: {
    width: '100%',
    height: 320,
    borderRadius: Radii.lg,
    backgroundColor: Brand.surfaceAlt,
  },
  imageOnly: {
    marginTop: 2,
  },
  emptyState: {
    borderRadius: Radii.lg,
    backgroundColor: Brand.surfaceAlt,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  emptyText: {
    ...Typography.helper,
    color: Brand.textSecondary,
  },
});
