import { StyleSheet } from 'react-native';

import { Brand, Radii, Shadows, Typography } from '@/constants/theme';

export const s = StyleSheet.create({
  hydrationCard: {
    backgroundColor: '#FCFEFF',
    borderRadius: Radii.xxl,
    borderWidth: 1,
    borderColor: '#D5EAF7',
    padding: 18,
    gap: 14,
    overflow: 'hidden',
    ...Shadows.soft,
  },
  hydrationGlow: {
    position: 'absolute',
    top: -62,
    right: -38,
    width: 136,
    height: 136,
    borderRadius: 68,
    backgroundColor: 'rgba(45,156,219,0.09)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerCopy: {
    flex: 1,
    gap: 4,
  },
  title: {
    ...Typography.caption,
    color: Brand.hydration,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  subtitle: {
    ...Typography.helper,
    color: Brand.textSecondary,
  },
  settingsButton: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9ECF9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  snapshotRow: {
    flexDirection: 'row',
    gap: 8,
  },
  snapshotCard: {
    flex: 1,
    minWidth: 0,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9ECF9',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 4,
  },
  snapshotLabel: {
    ...Typography.caption,
    color: Brand.textSecondary,
    textTransform: 'uppercase',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  snapshotValue: {
    ...Typography.helper,
    color: Brand.text,
    fontWeight: '800',
  },
  snapshotValueHydration: {
    color: Brand.hydration,
  },
  snapshotValueSuccess: {
    color: Brand.greenDark,
  },
  statusCard: {
    borderRadius: 18,
    backgroundColor: '#F3FAFF',
    borderWidth: 1,
    borderColor: '#D8ECF8',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  statusText: {
    ...Typography.body,
    color: Brand.text,
    fontWeight: '600',
  },
  group: {
    gap: 8,
  },
  groupLabel: {
    ...Typography.caption,
    color: Brand.textSecondary,
    textTransform: 'uppercase',
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  waterBtn: {
    borderRadius: 18,
    borderWidth: 1,
  },
  waterBtnPrimary: {
    flex: 1,
    minWidth: 0,
    minHeight: 56,
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  waterBtnSecondary: {
    flex: 1,
    minWidth: 0,
    minHeight: 38,
    paddingHorizontal: 9,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  waterBtnPrimaryPositive: {
    backgroundColor: '#F2FAFF',
    borderColor: '#CFE8F6',
  },
  waterBtnPrimaryNegative: {
    backgroundColor: '#FFF4F6',
    borderColor: '#F7D6DC',
  },
  waterBtnSecondaryPositive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D9ECF9',
  },
  waterBtnSecondaryNegative: {
    backgroundColor: '#FFFFFF',
    borderColor: '#F7D6DC',
  },
  waterBtnPrimaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  waterBtnSecondaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  waterBtnIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waterBtnIconWrapPositive: {
    backgroundColor: '#2D9CDB',
  },
  waterBtnIconWrapNegative: {
    backgroundColor: '#FDE2E7',
  },
  waterBtnTextBlock: {
    flex: 1,
    gap: 0,
  },
  waterBtnText: {
    fontWeight: '800',
    textAlign: 'left',
  },
  waterBtnTextPrimary: {
    ...Typography.body,
    color: '#2D9CDB',
  },
  waterBtnTextPositive: {
    ...Typography.caption,
    color: '#2D9CDB',
    fontWeight: '800',
  },
  waterBtnTextNegative: {
    ...Typography.body,
    color: '#BE123C',
  },
  waterBtnTextSecondary: {
    ...Typography.caption,
    color: '#BE123C',
    fontWeight: '800',
  },
  hydrationGoalModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  hydrationGoalModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(16, 35, 26, 0.30)',
  },
  hydrationGoalMenu: {
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9ECF9',
    padding: 18,
    gap: 14,
    ...Shadows.floating,
  },
  hydrationGoalMenuTitle: {
    ...Typography.subtitle,
    color: Brand.text,
    fontWeight: '800',
  },
  hydrationGoalMenuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  hydrationGoalMenuCopy: {
    flex: 1,
    gap: 4,
  },
  hydrationGoalMenuHint: {
    ...Typography.body,
    color: Brand.textSecondary,
  },
  hydrationGoalValueBadge: {
    borderRadius: 18,
    backgroundColor: '#EAF6FD',
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 96,
  },
  hydrationGoalValue: {
    ...Typography.subtitle,
    color: '#2D9CDB',
    fontWeight: '800',
  },
  hydrationGoalValueLabel: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '700',
  },
  sliderWrap: {
    paddingVertical: 8,
    paddingHorizontal: 2,
  },
  sliderTrack: {
    height: 32,
    borderRadius: Radii.pill,
    backgroundColor: '#D8EDF9',
    borderWidth: 1,
    borderColor: '#CFE8F6',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  sliderFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: Radii.pill,
    backgroundColor: '#2D9CDB',
  },
  sliderThumb: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#2D9CDB',
    top: 1,
    ...Shadows.card,
  },
  hydrationGoalScale: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hydrationGoalScaleLabel: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '700',
  },
  hydrationGoalScaleHint: {
    ...Typography.caption,
    color: Brand.textSecondary,
  },
  error: {
    ...Typography.body,
    color: Brand.danger,
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
});
