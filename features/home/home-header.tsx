import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Brand, Radii, Shadows, Typography } from '@/constants/theme';
import { greeting } from '@/features/home/home-utils';
import type { AuthUser } from '@/types/nutrition';

type Props = {
  user: AuthUser | null;
  dashboardDateText: string;
  unreadNotificationsCount: number;
  onOpenProfile: () => void;
  onOpenHistory: () => void;
  onOpenNotifications: () => void;
  onOpenCalendar: () => void;
};

export function HomeHeader({
  user,
  dashboardDateText,
  unreadNotificationsCount,
  onOpenProfile,
  onOpenHistory,
  onOpenNotifications,
  onOpenCalendar,
}: Props) {
  return (
    <View style={s.header}>
      <View style={s.identityRow}>
        <Pressable style={({ pressed }) => [s.avatarButton, pressed && s.pressed]} onPress={onOpenProfile}>
          {user?.profileImageUrl ? (
            <Image source={{ uri: user.profileImageUrl }} style={s.avatar} />
          ) : (
            <View style={s.avatarFallback}>
              <Text style={s.avatarText}>{(user?.username ?? 'V').charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <View style={s.avatarBadge}>
            <Ionicons name="leaf" size={10} color="#FFFFFF" />
          </View>
        </Pressable>

        <View style={s.profileCopy}>
          <Text style={s.greetingLabel}>{greeting()}</Text>
          <Text
            style={s.username}
            numberOfLines={1}
            ellipsizeMode="tail"
            adjustsFontSizeToFit
            minimumFontScale={0.8}>
            {user?.username ?? 'Usuário'}
          </Text>
        </View>

        <View style={s.actionsShell}>
          <Pressable style={({ pressed }) => [s.iconBtn, pressed && s.pressed]} onPress={onOpenHistory}>
            <Ionicons name="stats-chart-outline" size={19} color={Brand.greenDark} />
          </Pressable>

          <Pressable
            style={({ pressed }) => [s.iconBtn, pressed && s.pressed]}
            onPress={onOpenNotifications}>
            <Ionicons
              name={unreadNotificationsCount > 0 ? 'notifications' : 'notifications-outline'}
              size={19}
              color={unreadNotificationsCount > 0 ? Brand.coral : Brand.text}
            />
            {unreadNotificationsCount > 0 ? (
              <View style={s.notificationBadge}>
                <Text style={s.notificationBadgeText}>
                  {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                </Text>
              </View>
            ) : null}
          </Pressable>
        </View>
      </View>

      <Pressable style={({ pressed }) => [s.dateChip, pressed && s.pressed]} onPress={onOpenCalendar}>
        <View style={s.dateChipIcon}>
          <Ionicons name="calendar" size={14} color={Brand.greenDeeper} />
        </View>
        <Text numberOfLines={1} style={s.dateChipText}>
          {dashboardDateText}
        </Text>
        <Ionicons name="chevron-down" size={14} color={Brand.greenDark} />
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    paddingBottom: 4,
    gap: 14,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  profileCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  avatarButton: {
    position: 'relative',
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    padding: 0,
    overflow: 'visible',
    ...Shadows.card,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarFallback: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Brand.greenDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...Typography.subtitle,
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 22,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Brand.fresh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Brand.bg,
  },
  greetingLabel: {
    ...Typography.caption,
    color: Brand.greenDeeper,
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.3,
  },
  username: {
    fontSize: 22,
    lineHeight: 26,
    color: Brand.text,
    fontWeight: '800',
    flexShrink: 1,
    letterSpacing: -0.3,
  },
  actionsShell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(20,108,56,0.10)',
    position: 'relative',
    ...Shadows.soft,
  },
  notificationBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: Brand.coral,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Brand.bg,
  },
  notificationBadgeText: {
    ...Typography.caption,
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 10,
    lineHeight: 12,
  },
  dateChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: Radii.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(20,108,56,0.12)',
    paddingLeft: 6,
    paddingRight: 14,
    paddingVertical: 6,
    ...Shadows.soft,
  },
  dateChipIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Brand.mintSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateChipText: {
    ...Typography.helper,
    color: Brand.greenDeeper,
    fontWeight: '700',
    fontSize: 14,
    flexShrink: 1,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
});
