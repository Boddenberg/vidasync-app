import { StyleSheet } from 'react-native';

import { Brand, Radii, Shadows, Typography } from '@/constants/theme';

export const s = StyleSheet.create({
  section: {
    gap: 0,
  },
  grid: {
    flexDirection: 'row',
    gap: 10,
  },
  card: {
    flex: 1,
    minWidth: 0,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(20,108,56,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
    ...Shadows.card,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    minHeight: 24,
  },
  badge: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeLetter: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  label: {
    ...Typography.caption,
    fontSize: 11,
    color: Brand.textSecondary,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    flex: 1,
    minWidth: 0,
  },
  value: {
    fontSize: 20,
    lineHeight: 22,
    color: Brand.text,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  track: {
    height: 5,
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
  goalRow: {
    fontSize: 10,
    lineHeight: 13,
  },
  goalValue: {
    ...Typography.caption,
    fontSize: 10,
    color: Brand.textMuted,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  goalPct: {
    ...Typography.caption,
    fontSize: 10,
    color: Brand.textSecondary,
    fontWeight: '700',
  },
});
