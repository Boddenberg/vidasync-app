import { StyleSheet } from 'react-native';

import { Brand, Radii, Shadows, Typography } from '@/constants/theme';

export const s = StyleSheet.create({
  section: {
    gap: 14,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionTitleCol: {
    flex: 1,
    gap: 2,
  },
  sectionTitle: {
    fontSize: 22,
    lineHeight: 26,
    color: Brand.text,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  sectionSubtitle: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
  counterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: Radii.pill,
    backgroundColor: Brand.mintSoft,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  counter: {
    ...Typography.caption,
    color: Brand.greenDeeper,
    fontWeight: '800',
    fontSize: 12,
  },

  emptyCard: {
    borderRadius: Radii.xxl,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(20,108,56,0.08)',
    borderStyle: 'dashed',
    padding: 22,
    gap: 10,
    alignItems: 'center',
    ...Shadows.soft,
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Brand.mintSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    ...Typography.body,
    color: Brand.text,
    fontWeight: '800',
    fontSize: 16,
    textAlign: 'center',
  },
  emptyText: {
    ...Typography.helper,
    color: Brand.textSecondary,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 12,
  },

  list: {
    gap: 12,
  },
  card: {
    borderRadius: Radii.xxl,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(20,108,56,0.08)',
    padding: 16,
    gap: 12,
    ...Shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 16,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: 16,
    lineHeight: 20,
    color: Brand.text,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  count: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '600',
    fontSize: 12,
  },
  caloriesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: Radii.pill,
    backgroundColor: Brand.mintSoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  calories: {
    ...Typography.caption,
    color: Brand.greenDeeper,
    fontWeight: '800',
    fontSize: 13,
  },

  macros: {
    flexDirection: 'row',
    gap: 8,
  },
  macroStat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  macroDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  macroLabel: {
    ...Typography.caption,
    color: Brand.text,
    fontWeight: '800',
    fontSize: 11,
  },
  macroValue: {
    ...Typography.caption,
    fontWeight: '800',
    fontSize: 13,
  },

  mealsSection: {
    gap: 12,
    marginTop: 4,
  },
  mealsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mealsTitleIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Brand.mintSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealsTitle: {
    ...Typography.body,
    color: Brand.text,
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: -0.2,
  },
  mealsList: {
    gap: 10,
  },
});
