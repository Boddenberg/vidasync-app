import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  formatNotificationMoment,
  getNotificationTypePalette,
} from '@/components/notifications/notification-presenters';
import { AppButton } from '@/components/app-button';
import { DraggableSheetModal } from '@/components/ui/draggable-sheet-modal';
import { Brand, Radii, Shadows, Typography } from '@/constants/theme';
import type { AppNotification } from '@/services/notifications';

type Props = {
  visible: boolean;
  notification: AppNotification | null;
  onClose: () => void;
  onOpenAction: (notification: AppNotification) => void;
};

const DEFAULT_IMAGE_ASPECT_RATIO = 4 / 5;

export function NotificationDetailModal({ visible, notification, onClose, onOpenAction }: Props) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [imageAspectRatio, setImageAspectRatio] = useState(DEFAULT_IMAGE_ASPECT_RATIO);

  useEffect(() => {
    setImageAspectRatio(DEFAULT_IMAGE_ASPECT_RATIO);
  }, [notification?.id, visible]);

  const hasMessage = Boolean(notification?.message?.trim());
  const hasImage = Boolean(notification?.imageUrl);
  const palette = getNotificationTypePalette(notification?.type ?? 'INFO');
  const imageWidth = Math.max(windowWidth - 52, 240);
  const imageHeight = Math.min(windowHeight * 0.52, Math.max(240, imageWidth / imageAspectRatio));

  return (
    <DraggableSheetModal
      visible={visible}
      onClose={onClose}
      sheetStyle={[s.sheet, { paddingBottom: Math.max(insets.bottom, 12) + 10 }]}>
      {notification ? (
        <View style={s.root}>
          <View style={[s.hero, { backgroundColor: palette.accentSoft, borderColor: palette.border }]}>
            <View style={[s.heroGlowPrimary, { backgroundColor: palette.iconBg }]} />
            <View style={[s.heroGlowSecondary, { backgroundColor: palette.iconBg }]} />

            <View style={s.heroTopRow}>
              <View style={s.metaWrap}>
                <View style={[s.typeChip, { backgroundColor: palette.iconBg }]}>
                  <Ionicons name={palette.icon} size={15} color={palette.iconColor} />
                  <Text style={[s.typeChipText, { color: palette.accent }]}>{palette.label}</Text>
                </View>
                {notification.actionLabel ? <Text style={s.actionChip}>{notification.actionLabel}</Text> : null}
              </View>

              <Pressable style={({ pressed }) => [s.closeBtn, pressed && s.pressed]} onPress={onClose}>
                <Ionicons name="close-outline" size={22} color={Brand.text} />
              </Pressable>
            </View>

            <Text style={s.heroEyebrow}>Mensagem completa</Text>
            <Text style={s.heroTitle}>{notification.title}</Text>
            <Text style={s.heroMeta}>{formatNotificationMoment(notification)}</Text>
          </View>

          <ScrollView
            style={s.scroll}
            contentContainerStyle={[
              s.scrollContent,
              { paddingBottom: notification.actionRoute ? 18 : 8 },
            ]}
            showsVerticalScrollIndicator={false}>
            {hasImage ? (
              <View style={s.imageCard}>
                <Image
                  source={{ uri: notification.imageUrl! }}
                  style={[s.image, { height: imageHeight }]}
                  resizeMode="contain"
                  onLoad={({ nativeEvent }) => {
                    const source = nativeEvent.source;
                    if (source?.width && source?.height) {
                      setImageAspectRatio(source.width / source.height);
                    }
                  }}
                />
              </View>
            ) : null}

            {hasMessage ? (
              <View style={s.messageCard}>
                <Text style={s.sectionLabel}>Conteúdo</Text>
                <Text style={s.message}>{notification.message}</Text>
              </View>
            ) : null}

            {!hasMessage && !hasImage ? (
              <View style={s.emptyState}>
                <Ionicons name="document-text-outline" size={18} color={Brand.textSecondary} />
                <Text style={s.emptyText}>Essa notificação não trouxe conteúdo adicional além do título.</Text>
              </View>
            ) : null}
          </ScrollView>

          {notification.actionRoute ? (
            <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, 6) }]}>
              <AppButton
                title={notification.actionLabel ?? 'Abrir'}
                onPress={() => onOpenAction(notification)}
              />
            </View>
          ) : null}
        </View>
      ) : null}
    </DraggableSheetModal>
  );
}

const s = StyleSheet.create({
  sheet: {
    minHeight: '86%',
    maxHeight: '96%',
    backgroundColor: '#FCFDFC',
  },
  root: {
    flex: 1,
    minHeight: 1,
  },
  hero: {
    overflow: 'hidden',
    borderBottomWidth: 1,
    paddingHorizontal: 18,
    paddingBottom: 20,
    gap: 8,
  },
  heroGlowPrimary: {
    position: 'absolute',
    top: -18,
    right: -12,
    width: 128,
    height: 128,
    borderRadius: 64,
    opacity: 0.7,
  },
  heroGlowSecondary: {
    position: 'absolute',
    bottom: -32,
    left: -20,
    width: 116,
    height: 116,
    borderRadius: 58,
    opacity: 0.45,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  metaWrap: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: Radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  typeChipText: {
    ...Typography.caption,
    fontWeight: '800',
  },
  actionChip: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '700',
    borderRadius: Radii.pill,
    backgroundColor: 'rgba(255,255,255,0.72)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    overflow: 'hidden',
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.86)',
    borderWidth: 1,
    borderColor: 'rgba(21, 32, 24, 0.08)',
  },
  heroEyebrow: {
    ...Typography.caption,
    color: Brand.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '800',
    marginTop: 4,
  },
  heroTitle: {
    ...Typography.title,
    color: Brand.text,
    fontWeight: '800',
  },
  heroMeta: {
    ...Typography.helper,
    color: Brand.textSecondary,
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 14,
  },
  imageCard: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#E3ECE5',
    backgroundColor: '#FFFFFF',
    padding: 10,
    overflow: 'hidden',
    ...Shadows.card,
  },
  image: {
    width: '100%',
    borderRadius: 22,
    backgroundColor: '#F4F8F5',
  },
  messageCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Brand.border,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 18,
    gap: 10,
    ...Shadows.card,
  },
  sectionLabel: {
    ...Typography.caption,
    color: Brand.greenDark,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    fontWeight: '800',
  },
  message: {
    ...Typography.body,
    color: Brand.text,
    lineHeight: 24,
  },
  emptyState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 22,
    backgroundColor: Brand.surfaceAlt,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  emptyText: {
    ...Typography.helper,
    color: Brand.textSecondary,
    flex: 1,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  pressed: {
    opacity: 0.86,
  },
});
