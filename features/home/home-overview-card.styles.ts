import { StyleSheet } from 'react-native';

import { Brand, Radii, Shadows, Typography } from '@/constants/theme';

export const s = StyleSheet.create({
  card: {
    backgroundColor: '#FCFDFC',
    borderRadius: Radii.xxl,
    borderWidth: 1,
    borderColor: 'rgba(20,108,56,0.08)',
    padding: 16,
    gap: 12,
    overflow: 'hidden',
    ...Shadows.card,
  },
  glowTop: {
    position: 'absolute',
    top: -92,
    right: -56,
    width: 204,
    height: 204,
    borderRadius: 102,
    backgroundColor: 'rgba(31,167,80,0.08)',
  },
  glowBottom: {
    position: 'absolute',
    left: -48,
    bottom: -66,
    width: 148,
    height: 148,
    borderRadius: 74,
    backgroundColor: 'rgba(45,156,219,0.06)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 26,
    lineHeight: 30,
    color: Brand.text,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  action: {
    borderRadius: Radii.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(20,108,56,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  actionText: {
    ...Typography.caption,
    color: Brand.greenDark,
    fontWeight: '800',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  calorieBlock: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  overline: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  calorieValueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },
  calorieValue: {
    fontSize: 46,
    lineHeight: 48,
    color: Brand.text,
    fontWeight: '800',
    letterSpacing: -1,
  },
  calorieUnit: {
    ...Typography.helper,
    color: Brand.textSecondary,
    fontWeight: '700',
    marginBottom: 7,
  },
  badgesColumn: {
    alignItems: 'flex-end',
    gap: 8,
  },
  badge: {
    minWidth: 88,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 1,
    borderWidth: 1,
    alignItems: 'center',
  },
  badgeGoal: {
    backgroundColor: '#EEF8F1',
    borderColor: '#D6EBD9',
  },
  badgeMeals: {
    backgroundColor: '#FFF4ED',
    borderColor: '#FFDCCE',
  },
  badgeValue: {
    ...Typography.body,
    color: Brand.text,
    fontWeight: '800',
  },
  badgeLabel: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '700',
  },
  progressSection: {
    gap: 8,
  },
  progressTrack: {
    height: 8,
    borderRadius: Radii.pill,
    overflow: 'hidden',
    backgroundColor: '#E8F3EA',
  },
  progressFill: {
    height: '100%',
    borderRadius: Radii.pill,
    backgroundColor: Brand.greenDark,
  },
  remainingText: {
    ...Typography.helper,
    color: Brand.text,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(21,32,24,0.08)',
  },
  macroStrip: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
  },
  macroItem: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  macroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  macroDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  macroLabel: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '700',
  },
  macroValue: {
    ...Typography.body,
    color: Brand.text,
    fontWeight: '800',
  },
  macroTrack: {
    height: 4,
    borderRadius: Radii.pill,
    overflow: 'hidden',
  },
  macroFill: {
    height: '100%',
    borderRadius: Radii.pill,
  },
  waterSection: {
    gap: 8,
  },
  waterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  waterLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  waterAction: {
    width: 28,
    height: 28,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D8ECF8',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waterValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  waterValue: {
    fontSize: 22,
    lineHeight: 26,
    color: Brand.hydration,
    fontWeight: '800',
  },
  waterValueDone: {
    color: Brand.greenDark,
  },
  waterGoal: {
    ...Typography.helper,
    color: Brand.textSecondary,
    fontWeight: '700',
  },
  waterTrack: {
    height: 6,
    borderRadius: Radii.pill,
    overflow: 'hidden',
    backgroundColor: '#D8EDF9',
  },
  waterFill: {
    height: '100%',
    borderRadius: Radii.pill,
    backgroundColor: Brand.hydration,
  },
  waterFillDone: {
    backgroundColor: Brand.greenDark,
  },
  waterActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  waterQuickAction: {
    minWidth: 82,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  waterQuickActionPositive: {
    backgroundColor: '#EAF6FD',
    borderColor: '#D7EAF7',
  },
  waterQuickActionNegative: {
    backgroundColor: '#FFF3F5',
    borderColor: '#F6D7DE',
  },
  waterQuickActionIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waterQuickActionIconPositive: {
    backgroundColor: Brand.hydration,
  },
  waterQuickActionIconNegative: {
    backgroundColor: '#FFE3EA',
  },
  waterQuickActionText: {
    ...Typography.caption,
    fontWeight: '800',
  },
  waterQuickActionTextPositive: {
    color: '#1E6B93',
  },
  waterQuickActionTextNegative: {
    color: '#BE123C',
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
  hydrationGoalMenuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  hydrationGoalMenuCopy: {
    flex: 1,
    gap: 4,
  },
  hydrationGoalMenuTitle: {
    ...Typography.subtitle,
    color: Brand.text,
    fontWeight: '800',
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
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
});
