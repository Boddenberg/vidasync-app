import { StyleSheet } from 'react-native';

import { Brand, Radii, Shadows, Typography } from '@/constants/theme';

export const s = StyleSheet.create({
  hero: {
    backgroundColor: '#F4FBF6',
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: '#DDEFE3',
    padding: 18,
    gap: 14,
    overflow: 'hidden',
    ...Shadows.card,
  },
  heroGlowTop: {
    position: 'absolute',
    top: -74,
    right: -48,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(123,196,127,0.18)',
  },
  heroGlowBottom: {
    position: 'absolute',
    left: -36,
    bottom: -56,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(11,107,148,0.08)',
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 14,
  },
  heroCopy: {
    flex: 1,
    gap: 4,
  },
  heroLabel: {
    ...Typography.caption,
    color: Brand.greenDark,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  heroTitle: {
    ...Typography.title,
    color: Brand.text,
    fontWeight: '800',
  },
  heroSubtitle: {
    ...Typography.body,
    color: Brand.textSecondary,
  },
  heroBadge: {
    minWidth: 84,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 2,
  },
  heroBadgeValue: {
    fontSize: 24,
    fontWeight: '800',
    color: Brand.greenDark,
  },
  heroBadgeLabel: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '700',
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
  calorieSpotlight: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  calorieSpotlightCopy: {
    gap: 6,
  },
  calorieSpotlightLabel: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  calorieSpotlightRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },
  calorieSpotlightValue: {
    fontSize: 34,
    lineHeight: 36,
    fontWeight: '800',
    color: Brand.text,
  },
  calorieSpotlightUnit: {
    ...Typography.body,
    color: Brand.textSecondary,
    fontWeight: '700',
  },
  calorieBadge: {
    borderRadius: 18,
    backgroundColor: '#E7F6EC',
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  calorieBadgeValue: {
    ...Typography.subtitle,
    color: Brand.greenDark,
    fontWeight: '800',
  },
  calorieBadgeLabel: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '700',
  },
  track: {
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#DCEFE3',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: Brand.greenDark,
  },
  heroMetaRow: {
    gap: 8,
  },
  heroMetaChip: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  heroMetaChipPrimary: {
    backgroundColor: '#E7F6EC',
  },
  heroMetaChipText: {
    ...Typography.body,
    color: Brand.text,
  },
  heroMetaChipTextPrimary: {
    color: Brand.greenDark,
    fontWeight: '700',
  },
  macroSection: {
    gap: 10,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  sectionMiniTitle: {
    ...Typography.subtitle,
    color: Brand.text,
    fontWeight: '800',
  },
  counter: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '700',
  },
  macroCard: {
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    padding: 14,
    gap: 8,
  },
  macroLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  macroDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  macroLabel: {
    ...Typography.body,
    color: Brand.text,
    fontWeight: '700',
  },
  macroTarget: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '700',
  },
  trackShell: {
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    borderRadius: 999,
  },
  macroRemaining: {
    ...Typography.caption,
    color: Brand.textSecondary,
  },
  emptyGoalState: {
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    padding: 16,
    gap: 10,
  },
  emptyGoalTitle: {
    ...Typography.subtitle,
    color: Brand.text,
    fontWeight: '700',
  },
  emptyGoalText: {
    ...Typography.body,
    color: Brand.textSecondary,
  },
  mealSummarySection: {
    gap: 10,
  },
  mealSummaryGrid: {
    gap: 10,
  },
  mealSummaryCard: {
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    padding: 14,
    gap: 8,
  },
  mealSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mealSummaryIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealSummaryCopy: {
    flex: 1,
  },
  mealSummaryLabel: {
    ...Typography.body,
    color: Brand.text,
    fontWeight: '700',
  },
  mealSummaryCount: {
    ...Typography.caption,
    color: Brand.textSecondary,
  },
  mealSummaryCalories: {
    ...Typography.caption,
    color: Brand.greenDark,
    fontWeight: '800',
  },
  mealSummaryMacros: {
    ...Typography.caption,
    color: Brand.textSecondary,
  },
  sectionSub: {
    ...Typography.body,
    color: Brand.textSecondary,
  },
  heroActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  secondaryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  secondaryChipText: {
    ...Typography.body,
    color: Brand.greenDark,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.9,
  },
  error: {
    ...Typography.body,
    color: Brand.danger,
  },
});
