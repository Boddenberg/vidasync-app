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
      <View style={s.headerSurface}>
        <View style={s.topRow}>
          <Pressable style={({ pressed }) => [s.dateChip, pressed && s.pressed]} onPress={onOpenCalendar}>
            <Ionicons name="calendar-outline" size={15} color={Brand.greenDark} />
            <Text numberOfLines={1} style={s.dateChipText}>
              {dashboardDateText}
            </Text>
          </Pressable>

          <View style={s.actionsShell}>
            <Pressable style={({ pressed }) => [s.iconBtn, s.iconBtnPrimary, pressed && s.pressed]} onPress={onOpenHistory}>
              <Ionicons name="stats-chart" size={19} color={Brand.greenDark} />
            </Pressable>

            <View style={s.actionDivider} />

            <Pressable
              style={({ pressed }) => [
                s.iconBtn,
                unreadNotificationsCount > 0 && s.iconBtnAlert,
                pressed && s.pressed,
              ]}
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

        <View style={s.identityRow}>
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
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    paddingBottom: 4,
  },
  headerSurface: {
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(20,108,56,0.08)',
    padding: 16,
    gap: 14,
    ...Shadows.card,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  profileCopy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  avatarButton: {
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(20,108,56,0.08)',
    padding: 4,
    overflow: 'hidden',
    ...Shadows.card,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 21,
  },
  avatarFallback: {
    width: 58,
    height: 58,
    borderRadius: 21,
    backgroundColor: Brand.greenDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...Typography.subtitle,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  greetingLabel: {
    ...Typography.caption,
    color: Brand.greenDark,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  username: {
    fontSize: 24,
    lineHeight: 28,
    color: Brand.text,
    fontWeight: '800',
    flexShrink: 1,
  },
  actionsShell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(21,32,24,0.08)',
    paddingHorizontal: 6,
    paddingVertical: 6,
    ...Shadows.soft,
  },
  actionDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(21,32,24,0.08)',
    marginVertical: 4,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconBtnPrimary: {
    backgroundColor: '#EEF8F1',
  },
  iconBtnAlert: {
    backgroundColor: '#FFF4EF',
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 1,
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
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: Radii.pill,
    backgroundColor: '#EEF8F1',
    borderWidth: 1,
    borderColor: '#D8EAD9',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  dateChipText: {
    ...Typography.helper,
    color: Brand.greenDark,
    fontWeight: '700',
    flexShrink: 1,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
});
