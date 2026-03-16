import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Brand, Radii, Typography } from '@/constants/theme';
import { formatCompactSelectedDate, greeting } from '@/features/home/home-utils';
import type { AuthUser } from '@/types/nutrition';

type Props = {
  user: AuthUser | null;
  dashboardDateLabel: string;
  dashboardSupportText: string;
  selectedDate: string;
  canAdvanceDate: boolean;
  unreadNotificationsCount: number;
  onOpenProfile: () => void;
  onOpenHistory: () => void;
  onOpenNotifications: () => void;
  onOpenCalendar: () => void;
  onPreviousDate: () => void;
  onNextDate: () => void;
};

export function HomeHeader({
  user,
  dashboardDateLabel,
  dashboardSupportText,
  selectedDate,
  canAdvanceDate,
  unreadNotificationsCount,
  onOpenProfile,
  onOpenHistory,
  onOpenNotifications,
  onOpenCalendar,
  onPreviousDate,
  onNextDate,
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
            <Text style={s.greeting}>
              {greeting()}
              {user ? `, ${user.username}` : ''}
            </Text>
            <Text style={s.date}>{dashboardSupportText}</Text>
          </View>
        </View>

        <View style={s.actions}>
          <Pressable style={({ pressed }) => [s.iconBtn, pressed && s.pressed]} onPress={onOpenHistory}>
            <Ionicons name="stats-chart-outline" size={18} color={Brand.text} />
          </Pressable>

          <Pressable style={({ pressed }) => [s.iconBtn, pressed && s.pressed]} onPress={onOpenNotifications}>
            <Ionicons
              name={unreadNotificationsCount > 0 ? 'notifications' : 'notifications-outline'}
              size={18}
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

      <View style={s.dateRail}>
        <Pressable style={({ pressed }) => [s.dateArrow, pressed && s.pressed]} onPress={onPreviousDate}>
          <Ionicons name="chevron-back" size={18} color={Brand.greenDark} />
        </Pressable>

        <Pressable style={({ pressed }) => [s.dateCenter, pressed && s.pressed]} onPress={onOpenCalendar}>
          <View style={s.dateCenterHeader}>
            <Ionicons name="calendar-outline" size={14} color={Brand.greenDark} />
            <Text style={s.dateCenterLabel}>{dashboardDateLabel}</Text>
          </View>
          <Text style={s.dateCenterValue}>{formatCompactSelectedDate(selectedDate)}</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [s.dateArrow, !canAdvanceDate && s.disabled, pressed && canAdvanceDate && s.pressed]}
          onPress={onNextDate}
          disabled={!canAdvanceDate}>
          <Ionicons name="chevron-forward" size={18} color={Brand.greenDark} />
        </Pressable>
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
    alignItems: 'center',
    gap: 12,
  },
  profile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileCopy: {
    flex: 1,
  },
  avatarButton: {
    borderRadius: 22,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    ...Typography.subtitle,
    color: Brand.text,
    fontWeight: '800',
  },
  date: {
    ...Typography.body,
    color: Brand.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: Brand.card,
    borderWidth: 1,
    borderColor: Brand.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    backgroundColor: Brand.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadgeText: {
    ...Typography.caption,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  dateRail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dateArrow: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: Brand.card,
    borderWidth: 1,
    borderColor: Brand.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateCenter: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: Brand.card,
    borderWidth: 1,
    borderColor: Brand.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  dateCenterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateCenterLabel: {
    ...Typography.caption,
    color: Brand.greenDark,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  dateCenterValue: {
    ...Typography.subtitle,
    color: Brand.text,
    fontWeight: '800',
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.9,
  },
});
