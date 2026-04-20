import { StyleSheet } from 'react-native';

import { Brand, Radii, Shadows, Typography } from '@/constants/theme';

export const s = StyleSheet.create({
  // Hero card (anel de calorias + macros)
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.xxl,
    borderWidth: 1,
    borderColor: 'rgba(20,108,56,0.08)',
    padding: 22,
    gap: 18,
    overflow: 'hidden',
    ...Shadows.floating,
  },
  glowTop: {
    position: 'absolute',
    top: -110,
    right: -70,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(31,167,80,0.10)',
  },
  glowBottom: {
    position: 'absolute',
    left: -70,
    bottom: -80,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(244,166,42,0.08)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  headerLeft: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 22,
    lineHeight: 26,
    color: Brand.text,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  subtitle: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '600',
    fontSize: 12,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: Radii.pill,
    backgroundColor: Brand.mintSoft,
    borderWidth: 1,
    borderColor: 'rgba(20,108,56,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionText: {
    ...Typography.caption,
    color: Brand.greenDeeper,
    fontWeight: '800',
    fontSize: 12,
  },

  // Ring row
  ringRow: {
    alignItems: 'center',
    paddingVertical: 4,
  },

  // Badges com contagem
  badgesRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  badge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  badgeGoal: {
    backgroundColor: Brand.mintSoft,
  },
  badgeMeals: {
    backgroundColor: Brand.coralSoft,
  },
  badgeIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  badgeContent: {
    flex: 1,
    gap: 2,
  },
  badgeValue: {
    fontSize: 18,
    lineHeight: 22,
    color: Brand.text,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  badgeLabel: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '700',
    fontSize: 11,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: 'rgba(21,32,24,0.06)',
    marginVertical: 2,
  },

  // Macros section
  macroSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  macroTitle: {
    fontSize: 15,
    lineHeight: 19,
    color: Brand.text,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  macroStrip: {
    flexDirection: 'row',
    gap: 10,
  },
  macroItem: {
    flex: 1,
    minWidth: 0,
    borderRadius: 18,
    padding: 14,
    gap: 10,
    borderWidth: 1,
  },
  macroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  macroIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  macroLabel: {
    ...Typography.caption,
    color: Brand.text,
    fontWeight: '800',
    fontSize: 12,
    flex: 1,
  },
  macroValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  macroValue: {
    fontSize: 20,
    lineHeight: 22,
    color: Brand.text,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  macroUnit: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '700',
    fontSize: 11,
  },
  macroTrack: {
    height: 5,
    borderRadius: Radii.pill,
    overflow: 'hidden',
  },
  macroFill: {
    height: '100%',
    borderRadius: Radii.pill,
  },
  macroGoalText: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '600',
    fontSize: 10,
  },

  // === Hydration Card (separate) ===
  hydrationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.xxl,
    borderWidth: 1,
    borderColor: 'rgba(45,156,219,0.12)',
    padding: 22,
    gap: 16,
    overflow: 'hidden',
    ...Shadows.floating,
  },
  hydrationGlow: {
    position: 'absolute',
    top: -90,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(45,156,219,0.12)',
  },
  hydrationGlowDone: {
    backgroundColor: 'rgba(31,167,80,0.12)',
  },
  hydrationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  hydrationHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  hydrationIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Brand.hydrationBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hydrationIconWrapDone: {
    backgroundColor: Brand.mintSoft,
  },
  hydrationTitleCol: {
    flex: 1,
    gap: 2,
  },
  hydrationTitle: {
    fontSize: 17,
    lineHeight: 20,
    color: Brand.text,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  hydrationSubtitle: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '600',
    fontSize: 12,
  },
  hydrationSettingsBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Brand.hydrationBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hydrationValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  hydrationValue: {
    fontSize: 40,
    lineHeight: 44,
    color: Brand.hydration,
    fontWeight: '800',
    letterSpacing: -1.2,
  },
  hydrationValueDone: {
    color: Brand.greenDark,
  },
  hydrationGoalLabel: {
    ...Typography.helper,
    color: Brand.textSecondary,
    fontWeight: '700',
    fontSize: 14,
  },
  hydrationTrack: {
    height: 10,
    borderRadius: Radii.pill,
    overflow: 'hidden',
    backgroundColor: Brand.hydrationBg,
  },
  hydrationFill: {
    height: '100%',
    borderRadius: Radii.pill,
    backgroundColor: Brand.hydration,
  },
  hydrationFillDone: {
    backgroundColor: Brand.fresh,
  },
  hydrationActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  hydrationQuickAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  hydrationQuickActionPositive: {
    backgroundColor: Brand.hydrationBg,
    borderColor: 'rgba(45,156,219,0.20)',
  },
  hydrationQuickActionNegative: {
    backgroundColor: '#FFF3F5',
    borderColor: 'rgba(228,88,88,0.18)',
  },
  hydrationQuickActionText: {
    ...Typography.caption,
    fontWeight: '800',
    fontSize: 13,
  },
  hydrationQuickActionTextPositive: {
    color: '#1E6B93',
  },
  hydrationQuickActionTextNegative: {
    color: '#9F1D39',
  },

  // Modal
  hydrationGoalModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  hydrationGoalModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(16, 35, 26, 0.38)',
  },
  hydrationGoalMenu: {
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9ECF9',
    padding: 20,
    gap: 16,
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
    fontSize: 14,
  },
  hydrationGoalValueBadge: {
    borderRadius: 18,
    backgroundColor: Brand.hydrationBg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 96,
  },
  hydrationGoalValue: {
    ...Typography.subtitle,
    color: Brand.hydration,
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

  // Util
  error: {
    ...Typography.caption,
    color: Brand.danger,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
});
