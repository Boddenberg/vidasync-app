import { StyleSheet } from 'react-native';

import { Brand, Radii, Shadows, Typography } from '@/constants/theme';

export const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Brand.bg,
  },
  scroll: {
    paddingHorizontal: 18,
    gap: 14,
  },
  actionCard: {
    backgroundColor: Brand.card,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: 18,
    gap: 12,
    ...Shadows.card,
  },
  sectionTitle: {
    ...Typography.subtitle,
    color: Brand.text,
    fontWeight: '800',
  },
  sectionSub: {
    ...Typography.body,
    color: Brand.textSecondary,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 10,
  },
  shortcut: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
    backgroundColor: '#E7F6EC',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  shortcutText: {
    ...Typography.body,
    color: Brand.greenDark,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.9,
  },
});
