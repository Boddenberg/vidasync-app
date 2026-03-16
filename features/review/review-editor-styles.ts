import { StyleSheet } from 'react-native';

import { Brand } from '@/constants/theme';

export const s = StyleSheet.create({
  heroCard: {
    backgroundColor: '#F2FAF3',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DCECDC',
    padding: 16,
    gap: 10,
    overflow: 'hidden',
  },
  heroGlowMain: {
    position: 'absolute',
    top: -92,
    right: -78,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(123,196,127,0.24)',
  },
  heroGlowSecondary: {
    position: 'absolute',
    bottom: -54,
    left: -36,
    width: 122,
    height: 122,
    borderRadius: 61,
    backgroundColor: 'rgba(93,173,226,0.14)',
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Brand.greenDark,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  heroPhoto: {
    width: '100%',
    height: 180,
    borderRadius: 16,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Brand.text,
    lineHeight: 32,
  },
  heroCalories: {
    fontSize: 18,
    fontWeight: '700',
    color: Brand.textSecondary,
  },
  heroSubtitle: {
    fontSize: 13,
    color: Brand.textSecondary,
    lineHeight: 19,
  },
  heroMacroRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  card: {
    backgroundColor: Brand.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Brand.text,
  },
  correctionRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  correctionFrom: {
    fontSize: 14,
    color: Brand.textSecondary,
  },
  correctionArrow: {
    fontSize: 14,
    color: Brand.textSecondary,
  },
  correctionTo: {
    fontSize: 14,
    fontWeight: '700',
    color: Brand.text,
  },
  detectedList: {
    gap: 12,
  },
  detectedItem: {
    gap: 8,
    borderRadius: 16,
    backgroundColor: Brand.bg,
    padding: 14,
  },
  detectedItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detectedName: {
    fontSize: 15,
    fontWeight: '700',
    color: Brand.text,
  },
  detectedMacroRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emptyInlineText: {
    fontSize: 13,
    color: Brand.textSecondary,
    lineHeight: 19,
  },
  manualToggleButton: {
    borderRadius: 14,
    backgroundColor: Brand.bg,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  manualToggleText: {
    fontSize: 14,
    fontWeight: '700',
    color: Brand.greenDark,
  },
  manualEditorBody: {
    gap: 12,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Brand.text,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  gridCell: {
    flex: 1,
    gap: 6,
  },
  itemCard: {
    borderRadius: 16,
    backgroundColor: Brand.bg,
    padding: 14,
    gap: 10,
  },
  removeButton: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: '#FFF0F0',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  removeButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: Brand.danger,
  },
  addButton: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: '#E7F6EC',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: Brand.greenDark,
  },
  manualHint: {
    fontSize: 13,
    color: Brand.textSecondary,
    lineHeight: 19,
  },
  multiInput: {
    minHeight: 130,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Brand.border,
    backgroundColor: Brand.bg,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: Brand.text,
    textAlignVertical: 'top',
  },
  readonlyInput: {
    opacity: 0.8,
  },
  macroChip: {
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 4,
  },
  macroChipCompact: {
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  macroChipLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  macroChipValue: {
    fontSize: 12,
    fontWeight: '700',
  },
});
