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
  const firstName = (user?.username ?? 'Usuário').split(' ')[0];

  return (
    <View style={s.header}>
      <View style={s.topRow}>
        <Pressable style={({ pressed }) => [s.avatarButton, pressed && s.pressed]} onPress={onOpenProfile}>
          {user?.profileImageUrl ? (
            <Image source={{ uri: user.profileImageUrl }} style={s.avatar} />
          ) : (
            <View style={s.avatarFallback}>
              <Text style={s.avatarText}>{(user?.username ?? 'V').charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <View style={s.avatarBadge}>
            <Ionicons name="leaf" size={9} color="#FFFFFF" />
          </View>
        </Pressable>

        <View style={s.actionsShell}>
          <Pressable style={({ pressed }) => [s.iconBtn, pressed && s.pressed]} onPress={onOpenHistory}>
            <Ionicons name="stats-chart-outline" size={19} color={Brand.greenDeeper} />
          </Pressable>

          <Pressable
            style={({ pressed }) => [s.iconBtn, pressed && s.pressed]}
            onPress={onOpenNotifications}>
            <Ionicons
              name={unreadNotificationsCount > 0 ? 'notifications' : 'notifications-outline'}
              size={19}
              color={unreadNotificationsCount > 0 ? Brand.coral : Brand.greenDeeper}
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

      <View style={s.greetingBlock}>
        <Text style={s.greetingLabel}>{greeting()},</Text>
        <Text
          style={s.username}
          numberOfLines={1}
          ellipsizeMode="tail"
          adjustsFontSizeToFit
          minimumFontScale={0.7}>
          {firstName} 👋
        </Text>
      </View>

      <Pressable style={({ pressed }) => [s.dateChip, pressed && s.pressed]} onPress={onOpenCalendar}>
        <View style={s.dateChipIcon}>
          <Ionicons name="calendar" size={14} color={Brand.greenDeeper} />
        </View>
        <Text numberOfLines={1} style={s.dateChipText}>
          {dashboardDateText}
        </Text>
        <Ionicons name="chevron-down" size={14} color={Brand.greenDeeper} />
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    paddingBottom: 2,
    gap: 14,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatarButton: {
    position: 'relative',
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    padding: 2,
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
  greetingBlock: {
    gap: 2,
  },
  greetingLabel: {
    ...Typography.helper,
    color: Brand.textSecondary,
    fontWeight: '600',
    fontSize: 14,
  },
  username: {
    fontSize: 30,
    lineHeight: 34,
    color: Brand.text,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  actionsShell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
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
