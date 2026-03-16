import { Platform, StyleSheet } from 'react-native';

import { Brand } from '@/constants/theme';

export const s = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    backgroundColor: Brand.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 32 : 20,
    maxHeight: '90%',
  },
  handleWrap: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Brand.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Brand.text,
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  bodyContent: {
    paddingBottom: 16,
  },
  form: {
    gap: 10,
  },
  stepLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Brand.green,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Brand.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  divider: {
    width: 32,
    height: 2,
    borderRadius: 1,
    backgroundColor: Brand.border,
    alignSelf: 'center',
    marginVertical: 8,
  },
  chipList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Brand.card,
    borderRadius: 10,
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: Brand.border,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: Brand.text,
  },
  chipRemove: {
    fontSize: 11,
    fontWeight: '700',
    color: Brand.textSecondary,
    paddingHorizontal: 4,
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flexOne: {
    flex: 1,
  },
  unitRow: {
    flexDirection: 'row',
    gap: 0,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: Brand.border,
  },
  unitBtn: {
    paddingVertical: 12,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.card,
  },
  unitBtnActive: {
    backgroundColor: Brand.green,
  },
  unitText: {
    fontSize: 13,
    fontWeight: '600',
    color: Brand.textSecondary,
  },
  unitTextActive: {
    color: '#FFFFFF',
  },
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Brand.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnDisabled: {
    backgroundColor: Brand.border,
  },
  addBtnText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: -2,
  },
  preview: {
    backgroundColor: Brand.card,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    gap: 12,
  },
  previewCal: {
    fontSize: 22,
    fontWeight: '700',
    color: Brand.greenDark,
  },
  previewMacros: {
    flexDirection: 'row',
    gap: 8,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  cancelOnlyWrap: {
    marginTop: 8,
  },
  primaryActionWrap: {
    flex: 2,
  },
  secondaryActionWrap: {
    flex: 1,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pillLabel: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  pillValue: {
    fontSize: 12,
    fontWeight: '600',
  },
});
