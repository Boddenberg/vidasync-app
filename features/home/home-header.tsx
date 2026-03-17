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
      <View style={s.headerRow}>
        <View style={s.profile}>
          <Pressable style={({ pressed }) => [s.avatarButton, pressed && s.pressed]} onPress={onOpenProfile}>
            {user?.profileImageUrl ? (
              <Image source={{ uri: user.profileImageUrl }} style={s.avatar} />
            ) : (
              <View style={s.avatarFallback}>
                <Text style={s.avatarText}>{(user?.username ?? 'V').charAt(0).toUpperCase()}</Text>
              </View>
            )}
          </Pressable>

          <View style={s.profileCopy}>
            <Pressable style={({ pressed }) => [s.dateChip, pressed && s.pressed]} onPress={onOpenCalendar}>
              <Ionicons name="calendar-outline" size={15} color={Brand.greenDark} />
              <Text style={s.dateChipText}>{dashboardDateText}</Text>
            </Pressable>

            <Text style={s.greeting}>
              {greeting()}
              {user ? `, ${user.username}` : ''}
            </Text>
          </View>
        </View>

        <View style={s.actions}>
          <Pressable style={({ pressed }) => [s.iconBtn, pressed && s.pressed]} onPress={onOpenHistory}>
            <Ionicons name="stats-chart" size={20} color={Brand.greenDark} />
          </Pressable>

          <Pressable style={({ pressed }) => [s.iconBtn, pressed && s.pressed]} onPress={onOpenNotifications}>
            <Ionicons
              name={unreadNotificationsCount > 0 ? 'notifications' : 'notifications-outline'}
              size={20}
              color={Brand.text}
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
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 14,
  },
  profile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  profileCopy: {
    flex: 1,
    gap: 8,
    paddingTop: 2,
  },
  avatarButton: {
    borderRadius: Radii.xl,
    ...Shadows.card,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  avatarFallback: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Brand.greenDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...Typography.subtitle,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  greeting: {
    ...Typography.title,
    color: Brand.text,
    fontWeight: '800',
    lineHeight: 34,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 2,
  },
  iconBtn: {
    width: 54,
    height: 54,
    borderRadius: 22,
    backgroundColor: Brand.card,
    borderWidth: 1,
    borderColor: Brand.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...Shadows.card,
  },
  notificationBadge: {
    position: 'absolute',
    top: 7,
    right: 7,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: Brand.danger,
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: Brand.surfaceSoft,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  dateChipText: {
    ...Typography.body,
    color: Brand.greenDark,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
});
