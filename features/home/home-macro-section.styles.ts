import { StyleSheet } from 'react-native';

import { Brand, Radii, Shadows, Typography } from '@/constants/theme';

export const s = StyleSheet.create({
  section: {
    gap: 12,
  },
  title: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  grid: {
    flexDirection: 'row',
    gap: 12,
  },
  card: {
    flex: 1,
    minWidth: 0,
    borderRadius: 22,
    backgroundColor: Brand.card,
    borderWidth: 1,
    borderColor: 'rgba(21,32,24,0.08)',
    paddingHorizontal: 15,
    paddingVertical: 16,
    gap: 12,
    ...Shadows.soft,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 999,
  },
  label: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '800',
  },
  value: {
    fontSize: 17,
    lineHeight: 22,
  },
  valuePrimary: {
    color: Brand.text,
    fontWeight: '800',
  },
  valueDivider: {
    color: Brand.textSecondary,
    fontWeight: '700',
  },
  valueGoal: {
    color: Brand.textMuted,
    fontWeight: '700',
  },
  track: {
    height: 6,
    borderRadius: Radii.pill,
    overflow: 'hidden',
    position: 'relative',
  },
  trackBase: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: Radii.pill,
  },
  fill: {
    height: '100%',
    borderRadius: Radii.pill,
  },
});
