import { StyleSheet } from 'react-native';

import { Brand, Radii, Shadows, Typography } from '@/constants/theme';

export const s = StyleSheet.create({
  section: {
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 20,
    lineHeight: 24,
    color: Brand.text,
    fontWeight: '800',
  },
  counterBadge: {
    borderRadius: Radii.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(20,108,56,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  counter: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '700',
  },
  emptyCard: {
    borderRadius: 24,
    backgroundColor: '#FCFDFC',
    borderWidth: 1,
    borderColor: 'rgba(20,108,56,0.08)',
    padding: 18,
    gap: 6,
    ...Shadows.soft,
  },
  emptyTitle: {
    ...Typography.body,
    color: Brand.text,
    fontWeight: '800',
  },
  emptyText: {
    ...Typography.helper,
    color: Brand.textSecondary,
  },
  list: {
    gap: 12,
  },
  card: {
    borderRadius: 22,
    backgroundColor: '#FCFDFC',
    borderWidth: 1,
    borderColor: 'rgba(20,108,56,0.08)',
    padding: 14,
    gap: 10,
    ...Shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  label: {
    ...Typography.body,
    color: Brand.text,
    fontWeight: '800',
  },
  count: {
    ...Typography.caption,
    color: Brand.textSecondary,
  },
  caloriesBadge: {
    borderRadius: Radii.pill,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  calories: {
    ...Typography.caption,
    color: Brand.greenDark,
    fontWeight: '800',
  },
  macros: {
    flexDirection: 'row',
    gap: 14,
  },
  macroStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  macroDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
  },
  macroLabel: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  macroValue: {
    ...Typography.caption,
    fontWeight: '800',
  },
});
