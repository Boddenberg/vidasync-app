import { StyleSheet } from 'react-native';

import { Brand, Radii, Shadows, Typography } from '@/constants/theme';

export const s = StyleSheet.create({
  section: {
    gap: 0,
  },
  grid: {
    flexDirection: 'row',
    gap: 12,
  },
  card: {
    flex: 1,
    minWidth: 0,
    borderRadius: 22,
    backgroundColor: '#FCFDFC',
    borderWidth: 1,
    borderColor: 'rgba(20,108,56,0.07)',
    paddingHorizontal: 15,
    paddingVertical: 15,
    gap: 10,
    ...Shadows.card,
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
