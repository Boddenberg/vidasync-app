import { StyleSheet } from 'react-native';

import { Brand, Radii, Shadows, Typography } from '@/constants/theme';

export const s = StyleSheet.create({
  hydrationCard: {
    backgroundColor: '#F2FAFD',
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: '#D8EEF6',
    padding: 18,
    gap: 14,
    overflow: 'hidden',
    ...Shadows.card,
  },
  hydrationGlowLarge: {
    position: 'absolute',
    top: -78,
    right: -36,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(11,107,148,0.12)',
  },
  hydrationGlowSmall: {
    position: 'absolute',
    left: -30,
    bottom: -42,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(123,196,127,0.10)',
  },
  hydrationHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  hydrationHeaderCopy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  hydrationHeaderText: {
    flex: 1,
  },
  hydrationIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: '#DDF1F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hydrationTitle: {
    ...Typography.subtitle,
    color: Brand.text,
    fontWeight: '800',
  },
  hydrationHeaderHint: {
    ...Typography.body,
    color: Brand.textSecondary,
  },
  hydrationSettingsButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingBox: {
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  loadingText: {
    ...Typography.body,
    color: Brand.textSecondary,
  },
  hydrationTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
  },
  hydrationMetricGroup: {
    gap: 4,
  },
  hydrationHeroValue: {
    fontSize: 40,
    lineHeight: 42,
    fontWeight: '800',
    color: Brand.text,
  },
  hydrationMetricHint: {
    ...Typography.body,
    color: Brand.textSecondary,
  },
  hydrationProgressBadge: {
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  hydrationProgressBadgeDone: {
    backgroundColor: '#E7F6EC',
  },
  hydrationProgressValue: {
    ...Typography.subtitle,
    color: '#0B6B94',
    fontWeight: '800',
  },
  hydrationProgressValueDone: {
    color: Brand.greenDark,
  },
  hydrationProgressLabel: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '700',
  },
  hydrationProgressLabelDone: {
    color: Brand.greenDark,
  },
  hydrationTrackShell: {
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#D7EFF7',
  },
  hydrationTrackFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#0B6B94',
  },
  hydrationStatus: {
    ...Typography.body,
    color: Brand.textSecondary,
  },
  hydrationActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  waterBtn: {
    flex: 1,
    minWidth: 120,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waterBtnPositive: {
    backgroundColor: '#DDF1F8',
  },
  waterBtnNegative: {
    backgroundColor: '#FFF0F0',
  },
  waterBtnText: {
    ...Typography.body,
    fontWeight: '700',
  },
  waterBtnTextPositive: {
    color: '#0B6B94',
  },
  waterBtnTextNegative: {
    color: Brand.danger,
  },
  hydrationGoalMenu: {
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    padding: 16,
    gap: 12,
  },
  hydrationGoalMenuTitle: {
    ...Typography.subtitle,
    color: Brand.text,
    fontWeight: '800',
  },
  hydrationGoalMenuHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  hydrationGoalMenuCopy: {
    flex: 1,
  },
  hydrationGoalMenuHint: {
    ...Typography.body,
    color: Brand.textSecondary,
  },
  hydrationGoalValueBadge: {
    borderRadius: 16,
    backgroundColor: '#E9F7FB',
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hydrationGoalValue: {
    ...Typography.subtitle,
    color: '#0B6B94',
    fontWeight: '800',
  },
  hydrationGoalValueLabel: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '700',
  },
  sliderWrap: {
    paddingVertical: 4,
  },
  sliderTrack: {
    height: 24,
    borderRadius: 999,
    backgroundColor: '#D7EFF7',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  sliderFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 999,
    backgroundColor: '#0B6B94',
  },
  sliderThumb: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#0B6B94',
    top: -2,
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
  hydrationFootnote: {
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
  },
});
