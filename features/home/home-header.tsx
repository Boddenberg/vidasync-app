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
          <Pressable style={({ pressed }) => [s.iconBtn, s.iconBtnPrimary, pressed && s.pressed]} onPress={onOpenHistory}>
            <Ionicons name="stats-chart" size={20} color={Brand.greenDark} />
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              s.iconBtn,
              unreadNotificationsCount > 0 && s.iconBtnAlert,
              pressed && s.pressed,
            ]}
            onPress={onOpenNotifications}>
            <Ionicons
              name={unreadNotificationsCount > 0 ? 'notifications' : 'notifications-outline'}
              size={20}
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
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    gap: 18,
    paddingBottom: 6,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 14,
  },
  profile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  profileCopy: {
    flex: 1,
    gap: 8,
    paddingTop: 2,
  },
  avatarButton: {
    borderRadius: 24,
    backgroundColor: Brand.card,
    borderWidth: 1,
    borderColor: 'rgba(20,108,56,0.08)',
    padding: 4,
    overflow: 'hidden',
    ...Shadows.card,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 20,
  },
  avatarFallback: {
    width: 56,
    height: 56,
    borderRadius: 20,
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
    fontSize: 28,
    lineHeight: 32,
    color: Brand.text,
    fontWeight: '800',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: Brand.card,
    borderWidth: 1,
    borderColor: 'rgba(21,32,24,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...Shadows.card,
  },
  iconBtnPrimary: {
    backgroundColor: Brand.surfaceSoft,
    borderColor: 'rgba(20,108,56,0.08)',
  },
  iconBtnAlert: {
    backgroundColor: '#FFF4EF',
    borderColor: '#FFDCCD',
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: Brand.coral,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
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
    backgroundColor: '#FBFDFC',
    borderWidth: 1,
    borderColor: 'rgba(21,32,24,0.08)',
    paddingHorizontal: 14,
    paddingVertical: 9,
    ...Shadows.soft,
  },
  dateChipText: {
    ...Typography.helper,
    color: Brand.greenDark,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
});
