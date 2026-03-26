import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SHOW_NOTIFICATION_ACTIONS } from '@/components/notifications/notification-flags';
import {
  formatNotificationMoment,
  getNotificationTypePalette,
} from '@/components/notifications/notification-presenters';
import { AppButton } from '@/components/app-button';
import { Brand, Radii, Shadows, Typography } from '@/constants/theme';
import type { AppNotification } from '@/services/notifications';

type Props = {
  visible: boolean;
  notification: AppNotification | null;
  onClose: () => void;
  onOpenAction: (notification: AppNotification) => void;
};

const DEFAULT_IMAGE_ASPECT_RATIO = 4 / 5;
const MIN_HERO_IMAGE_HEIGHT = 320;

export function NotificationDetailModal({ visible, notification, onClose, onOpenAction }: Props) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [imageAspectRatio, setImageAspectRatio] = useState(DEFAULT_IMAGE_ASPECT_RATIO);

  useEffect(() => {
    setImageAspectRatio(DEFAULT_IMAGE_ASPECT_RATIO);
  }, [notification?.id, visible]);

  if (!visible || !notification) {
    return null;
  }

  const hasMessage = Boolean(notification.message?.trim());
  const hasImage = Boolean(notification.imageUrl);
  const palette = getNotificationTypePalette(notification.type);
  const showAction = SHOW_NOTIFICATION_ACTIONS && Boolean(notification.actionRoute);
  const heroMaxHeight = windowHeight * (hasMessage ? 0.5 : 0.66);
  const heroNaturalHeight = (windowWidth - 24) / imageAspectRatio;
  const heroImageHeight = Math.min(heroMaxHeight, Math.max(MIN_HERO_IMAGE_HEIGHT, heroNaturalHeight));
  const heroEyebrow = hasImage ? 'Foto aberta' : hasMessage ? 'Mensagem completa' : 'Notificacao aberta';
  const heroDescription =
    hasImage && hasMessage
      ? 'A imagem fica em destaque e a mensagem completa aparece logo abaixo.'
      : hasImage
        ? 'A foto ocupa a tela toda para uma leitura mais limpa e elegante.'
        : hasMessage
          ? 'O texto completo foi aberto com foco total na leitura.'
          : 'Detalhes completos da notificacao em um unico lugar.';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={onClose}>
      <View style={s.screen}>
        <View pointerEvents="none" style={[s.backgroundOrbTop, { backgroundColor: palette.iconBg }]} />
        <View pointerEvents="none" style={[s.backgroundOrbBottom, { backgroundColor: palette.accentSoft }]} />

        <ScrollView
          style={s.scroll}
          contentContainerStyle={[
            s.scrollContent,
            { paddingBottom: showAction ? 140 + Math.max(insets.bottom, 16) : Math.max(insets.bottom, 26) + 26 },
          ]}
          showsVerticalScrollIndicator={false}>
          {hasImage ? (
            <View style={[s.heroImageSection, { height: heroImageHeight + insets.top + 86 }]}>
              <Image
                source={{ uri: notification.imageUrl! }}
                style={[s.heroImage, { height: heroImageHeight + 28 }]}
                resizeMode="contain"
                onLoad={({ nativeEvent }) => {
                  const source = nativeEvent.source;
                  if (source?.width && source?.height) {
                    setImageAspectRatio(source.width / source.height);
                  }
                }}
              />
              <View style={[s.heroImageTint, { backgroundColor: palette.accent }]} />
              <View style={s.heroImageShade} />

              <View style={[s.heroChrome, { paddingTop: insets.top + 8 }]}>
                <View style={s.topBar}>
                  <View style={s.topBarChips}>
                    <View style={[s.typeChip, s.typeChipOnImage]}>
                      <Ionicons name={palette.icon} size={15} color="#FFFFFF" />
                      <Text style={[s.typeChipText, s.typeChipTextOnImage]}>{palette.label}</Text>
                    </View>

                    {hasMessage ? (
                      <View style={s.glassChip}>
                        <Ionicons name="document-text-outline" size={14} color="#EFF7F1" />
                        <Text style={s.glassChipText}>Conteudo completo</Text>
                      </View>
                    ) : null}
                  </View>

                  <Pressable style={({ pressed }) => [s.closeBtn, s.closeBtnOnImage, pressed && s.pressed]} onPress={onClose}>
                    <Ionicons name="close-outline" size={22} color="#FFFFFF" />
                  </Pressable>
                </View>

                <View style={s.heroCopyOnImage}>
                  <Text style={[s.heroEyebrow, s.heroEyebrowOnImage]}>{heroEyebrow}</Text>
                  <Text style={[s.heroTitle, s.heroTitleOnImage]}>{notification.title}</Text>
                  <Text style={[s.heroMeta, s.heroMetaOnImage]}>{formatNotificationMoment(notification)}</Text>
                  <Text style={[s.heroDescription, s.heroDescriptionOnImage]}>{heroDescription}</Text>
                </View>
              </View>
            </View>
          ) : (
            <View
              style={[
                s.heroCard,
                {
                  paddingTop: insets.top + 10,
                  backgroundColor: palette.accentSoft,
                  borderColor: palette.border,
                },
              ]}>
              <View style={[s.heroGlowPrimary, { backgroundColor: palette.iconBg }]} />
              <View style={[s.heroGlowSecondary, { backgroundColor: palette.iconBg }]} />

              <View style={s.topBar}>
                <View style={s.topBarChips}>
                  <View style={[s.typeChip, { backgroundColor: palette.iconBg }]}>
                    <Ionicons name={palette.icon} size={15} color={palette.iconColor} />
                    <Text style={[s.typeChipText, { color: palette.accent }]}>{palette.label}</Text>
                  </View>

                  {hasMessage ? (
                    <View style={s.infoChip}>
                      <Ionicons name="document-text-outline" size={14} color={Brand.textSecondary} />
                      <Text style={s.infoChipText}>Conteudo completo</Text>
                    </View>
                  ) : null}
                </View>

                <Pressable style={({ pressed }) => [s.closeBtn, pressed && s.pressed]} onPress={onClose}>
                  <Ionicons name="close-outline" size={22} color={Brand.text} />
                </Pressable>
              </View>

              <Text style={s.heroEyebrow}>{heroEyebrow}</Text>
              <Text style={s.heroTitle}>{notification.title}</Text>
              <Text style={s.heroMeta}>{formatNotificationMoment(notification)}</Text>
              <Text style={s.heroDescription}>{heroDescription}</Text>
            </View>
          )}

          <View style={[s.body, hasImage && s.bodyFloating]}>
            {hasMessage ? (
              <View style={s.messageCard}>
                <View style={s.sectionHeader}>
                  <Text style={s.sectionLabel}>Mensagem</Text>
                  <View style={s.sectionIconWrap}>
                    <Ionicons name="chatbubble-ellipses-outline" size={15} color={Brand.greenDark} />
                  </View>
                </View>
                <Text style={s.message}>{notification.message}</Text>
              </View>
            ) : null}

            <View style={s.detailsCard}>
              <View style={s.sectionHeader}>
                <Text style={s.sectionLabel}>Resumo</Text>
                <View style={s.sectionIconWrap}>
                  <Ionicons name="sparkles-outline" size={15} color={Brand.greenDark} />
                </View>
              </View>

              <Text style={s.detailsText}>
                {hasImage && !hasMessage
                  ? 'A foto acima e o conteudo completo desta notificacao. Mantive o visual em destaque para preencher a tela inteira.'
                  : hasMessage && !hasImage
                    ? 'O foco aqui e a mensagem completa, com espaco para leitura confortavel do inicio ao fim.'
                    : hasImage && hasMessage
                      ? 'Voce pode ver a foto em destaque e continuar a leitura logo abaixo sem perder contexto.'
                      : 'Essa notificacao traz apenas titulo, tipo e horario de envio.'}
              </Text>

              <View style={s.metaGrid}>
                <View style={s.metaTile}>
                  <Text style={s.metaLabel}>Tipo</Text>
                  <Text style={[s.metaValue, { color: palette.accent }]}>{palette.label}</Text>
                </View>

                <View style={s.metaTile}>
                  <Text style={s.metaLabel}>Recebida</Text>
                  <Text style={s.metaValue}>{formatNotificationMoment(notification)}</Text>
                </View>
              </View>
            </View>

            {!hasMessage && !hasImage ? (
              <View style={s.emptyState}>
                <View style={s.emptyIconWrap}>
                  <Ionicons name="document-text-outline" size={18} color={Brand.textSecondary} />
                </View>
                <View style={s.emptyCopy}>
                  <Text style={s.emptyTitle}>Sem conteudo extra</Text>
                  <Text style={s.emptyText}>Essa notificacao traz apenas o titulo e a data de envio.</Text>
                </View>
              </View>
            ) : null}
          </View>
        </ScrollView>

        {showAction ? (
          <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
            <AppButton title={notification.actionLabel ?? 'Abrir'} onPress={() => onOpenAction(notification)} />
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F4FAF6',
  },
  backgroundOrbTop: {
    position: 'absolute',
    top: -90,
    right: -26,
    width: 220,
    height: 220,
    borderRadius: 110,
    opacity: 0.85,
  },
  backgroundOrbBottom: {
    position: 'absolute',
    bottom: -120,
    left: -48,
    width: 260,
    height: 260,
    borderRadius: 130,
    opacity: 0.72,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    gap: 0,
  },
  heroImageSection: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#0F1712',
  },
  heroImage: {
    width: '100%',
  },
  heroImageTint: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.18,
  },
  heroImageShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(6, 14, 10, 0.36)',
  },
  heroChrome: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  heroCard: {
    position: 'relative',
    overflow: 'hidden',
    borderBottomWidth: 1,
    paddingHorizontal: 18,
    paddingBottom: 24,
    gap: 10,
  },
  heroGlowPrimary: {
    position: 'absolute',
    top: -26,
    right: -8,
    width: 144,
    height: 144,
    borderRadius: 72,
    opacity: 0.82,
  },
  heroGlowSecondary: {
    position: 'absolute',
    bottom: -34,
    left: -18,
    width: 126,
    height: 126,
    borderRadius: 63,
    opacity: 0.48,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  topBarChips: {
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
  typeChipOnImage: {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  typeChipText: {
    ...Typography.caption,
    fontWeight: '800',
  },
  typeChipTextOnImage: {
    color: '#FFFFFF',
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: Radii.pill,
    backgroundColor: 'rgba(255,255,255,0.76)',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  infoChipText: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '700',
  },
  glassChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: Radii.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  glassChipText: {
    ...Typography.caption,
    color: '#F7FFFA',
    fontWeight: '700',
  },
  closeBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(21, 32, 24, 0.08)',
  },
  closeBtnOnImage: {
    backgroundColor: 'rgba(7, 16, 11, 0.24)',
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  heroCopyOnImage: {
    gap: 8,
  },
  heroEyebrow: {
    ...Typography.caption,
    color: Brand.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '800',
  },
  heroEyebrowOnImage: {
    color: 'rgba(244, 251, 246, 0.92)',
  },
  heroTitle: {
    ...Typography.title,
    color: Brand.text,
    fontWeight: '800',
  },
  heroTitleOnImage: {
    color: '#FFFFFF',
  },
  heroMeta: {
    ...Typography.helper,
    color: Brand.textSecondary,
    fontWeight: '600',
  },
  heroMetaOnImage: {
    color: 'rgba(235, 246, 238, 0.92)',
  },
  heroDescription: {
    ...Typography.helper,
    color: Brand.text,
    lineHeight: 21,
  },
  heroDescriptionOnImage: {
    color: 'rgba(244, 251, 246, 0.96)',
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 18,
    gap: 14,
  },
  bodyFloating: {
    marginTop: -28,
  },
  messageCard: {
    borderRadius: 30,
    borderWidth: 1,
    borderColor: Brand.border,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingVertical: 20,
    gap: 12,
    ...Shadows.floating,
  },
  detailsCard: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#DDE9DF',
    backgroundColor: '#FDFEFD',
    paddingHorizontal: 18,
    paddingVertical: 18,
    gap: 14,
    ...Shadows.card,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionLabel: {
    ...Typography.caption,
    color: Brand.greenDark,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    fontWeight: '800',
  },
  sectionIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.surfaceSoft,
  },
  message: {
    ...Typography.body,
    color: Brand.text,
    lineHeight: 26,
  },
  detailsText: {
    ...Typography.helper,
    color: Brand.textSecondary,
    lineHeight: 22,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metaTile: {
    flex: 1,
    minWidth: 140,
    borderRadius: 20,
    backgroundColor: '#F2F8F3',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 6,
  },
  metaLabel: {
    ...Typography.caption,
    color: Brand.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '700',
  },
  metaValue: {
    ...Typography.body,
    color: Brand.text,
    fontWeight: '700',
  },
  emptyState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Brand.border,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 16,
    ...Shadows.card,
  },
  emptyIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.surfaceAlt,
  },
  emptyCopy: {
    flex: 1,
    gap: 4,
  },
  emptyTitle: {
    ...Typography.body,
    color: Brand.text,
    fontWeight: '700',
  },
  emptyText: {
    ...Typography.helper,
    color: Brand.textSecondary,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(221, 233, 223, 0.92)',
    backgroundColor: 'rgba(244, 250, 246, 0.98)',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  pressed: {
    opacity: 0.86,
  },
});
