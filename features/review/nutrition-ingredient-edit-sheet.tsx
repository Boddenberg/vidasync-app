import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { AppInput } from '@/components/app-input';
import { DraggableSheetModal } from '@/components/ui/draggable-sheet-modal';
import { Brand, Radii, Shadows, Typography } from '@/constants/theme';
import { ExploreMacroChip } from '@/features/explore/explore-macro-chip';
import type { NutritionData } from '@/types/nutrition';
import type {
  NutritionReviewDraftItem,
  NutritionReviewQuantityUnit,
} from '@/types/review';

const UNITS: NutritionReviewQuantityUnit[] = ['g', 'ml', 'un'];

export type NutritionIngredientSheetMode = 'edit' | 'add';
export type NutritionIngredientAdjustmentMode = 'recalculate' | 'manual';

export type NutritionIngredientSheetDraft = Pick<
  NutritionReviewDraftItem,
  'name' | 'calories' | 'protein' | 'carbs' | 'fat' | 'quantityValue' | 'quantityUnit'
>;

type Props = {
  visible: boolean;
  mode: NutritionIngredientSheetMode;
  currentItem: NutritionReviewDraftItem | null;
  draft: NutritionIngredientSheetDraft | null;
  activeAdjustmentMode: NutritionIngredientAdjustmentMode;
  recalculationPreview: NutritionData | null;
  recalculationLookupLabel: string | null;
  recalculationLoading: boolean;
  recalculationError: string | null;
  onClose: () => void;
  onChangeDraft: (patch: Partial<NutritionIngredientSheetDraft>) => void;
  onChangeAdjustmentMode: (mode: NutritionIngredientAdjustmentMode) => void;
  onRecalculate: () => void;
  onApplyRecalculation: () => void;
  onApplyManual: () => void;
  onRemove?: () => void;
};

export function NutritionIngredientEditSheet({
  visible,
  mode,
  currentItem,
  draft,
  activeAdjustmentMode,
  recalculationPreview,
  recalculationLookupLabel,
  recalculationLoading,
  recalculationError,
  onClose,
  onChangeDraft,
  onChangeAdjustmentMode,
  onRecalculate,
  onApplyRecalculation,
  onApplyManual,
  onRemove,
}: Props) {
  if (!draft) return null;

  const canRecalculate = draft.name.trim().length > 0;
  const canApplyManual =
    draft.name.trim().length > 0 &&
    [draft.calories, draft.protein, draft.carbs, draft.fat].every((value) => value.trim().length > 0);

  const copy = resolveSheetCopy(mode);

  return (
    <DraggableSheetModal visible={visible} onClose={onClose} sheetStyle={s.sheet}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <View style={s.headerRow}>
            <View style={s.headerIconWrap}>
              <Ionicons name={mode === 'add' ? 'add-circle' : 'create'} size={18} color={Brand.greenDeeper} />
            </View>
            <View style={s.headerCopy}>
              <Text style={s.title}>{copy.title}</Text>
              <Text style={s.subtitle}>{copy.subtitle}</Text>
            </View>
            <Pressable
              style={({ pressed }) => [s.closeBtn, pressed && s.closeBtnPressed]}
              onPress={onClose}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Fechar">
              <Ionicons name="close" size={18} color={Brand.textSecondary} />
            </Pressable>
          </View>

          {currentItem ? <CurrentIngredientOverview item={currentItem} /> : null}

          <ModeSwitcher activeMode={activeAdjustmentMode} onChange={onChangeAdjustmentMode} />

          <IngredientBasicsForm draft={draft} onChangeDraft={onChangeDraft} />

          {activeAdjustmentMode === 'recalculate' ? (
            <>
              <GradientPrimaryButton
                label={copy.recalculateActionTitle}
                icon="sparkles"
                onPress={onRecalculate}
                disabled={!canRecalculate}
                loading={recalculationLoading}
              />

              <PreviewPanel
                loading={recalculationLoading}
                error={recalculationError}
                preview={recalculationPreview}
                lookupLabel={recalculationLookupLabel}
                emptyHint={copy.emptyPreviewHint}
                applyLabel={copy.applyPreviewTitle}
                onApply={onApplyRecalculation}
              />
            </>
          ) : null}

          {activeAdjustmentMode === 'manual' ? (
            <>
              <View style={s.manualCard}>
                <View style={s.macroGrid}>
                  <ManualMacroField
                    label="Calorias"
                    unit="kcal"
                    letter="K"
                    color={Brand.greenDeeper}
                    bg={Brand.surfaceSoft}
                    value={draft.calories}
                    onChange={(value) => onChangeDraft({ calories: value })}
                    placeholder="0"
                  />
                  <ManualMacroField
                    label="Proteína"
                    unit="g"
                    letter="P"
                    color={Brand.macroProtein}
                    bg={Brand.macroProteinBg}
                    value={draft.protein}
                    onChange={(value) => onChangeDraft({ protein: value })}
                    placeholder="0"
                  />
                  <ManualMacroField
                    label="Carboidratos"
                    unit="g"
                    letter="C"
                    color={Brand.macroCarb}
                    bg={Brand.macroCarbBg}
                    value={draft.carbs}
                    onChange={(value) => onChangeDraft({ carbs: value })}
                    placeholder="0"
                  />
                  <ManualMacroField
                    label="Gorduras"
                    unit="g"
                    letter="G"
                    color={Brand.macroFat}
                    bg={Brand.macroFatBg}
                    value={draft.fat}
                    onChange={(value) => onChangeDraft({ fat: value })}
                    placeholder="0"
                  />
                </View>
              </View>

              <GradientPrimaryButton
                label={copy.manualActionTitle}
                icon="checkmark-circle"
                onPress={onApplyManual}
                disabled={!canApplyManual}
              />
            </>
          ) : null}

          {onRemove ? (
            <Pressable
              style={({ pressed }) => [s.removeButton, pressed && s.removeButtonPressed]}
              onPress={onRemove}>
              <Ionicons name="trash-outline" size={14} color={Brand.danger} />
              <Text style={s.removeButtonText}>Remover ingrediente</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </DraggableSheetModal>
  );
}

function resolveSheetCopy(mode: NutritionIngredientSheetMode) {
  if (mode === 'add') {
    return {
      title: 'Adicionar alimento',
      subtitle: 'Inclua um item que não apareceu na análise.',
      recalculateActionTitle: 'Calcular macros',
      applyPreviewTitle: 'Adicionar alimento',
      emptyPreviewHint: 'Toque em "Calcular macros" para ver a estimativa.',
      manualActionTitle: 'Adicionar manualmente',
    };
  }

  return {
    title: 'Editar ingrediente',
    subtitle: 'Revise nome, quantidade e macros.',
    recalculateActionTitle: 'Recalcular ingrediente',
    applyPreviewTitle: 'Aplicar ajuste',
    emptyPreviewHint: 'Toque em "Recalcular" para comparar uma nova estimativa.',
    manualActionTitle: 'Aplicar ajuste manual',
  };
}

type ModeSwitcherProps = {
  activeMode: NutritionIngredientAdjustmentMode;
  onChange: (mode: NutritionIngredientAdjustmentMode) => void;
};

function ModeSwitcher({ activeMode, onChange }: ModeSwitcherProps) {
  return (
    <View style={s.modeRow}>
      <ModeButton
        icon="sparkles"
        label="Recalcular"
        active={activeMode === 'recalculate'}
        onPress={() => onChange('recalculate')}
      />
      <ModeButton
        icon="pencil"
        label="Manual"
        active={activeMode === 'manual'}
        onPress={() => onChange('manual')}
      />
    </View>
  );
}

type ModeButtonProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active: boolean;
  onPress: () => void;
};

function ModeButton({ icon, label, active, onPress }: ModeButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [s.modeBtn, active && s.modeBtnActive, pressed && s.modeBtnPressed]}
      onPress={onPress}>
      <Ionicons name={icon} size={14} color={active ? Brand.greenDeeper : Brand.textSecondary} />
      <Text style={[s.modeBtnText, active && s.modeBtnTextActive]}>{label}</Text>
    </Pressable>
  );
}

type GradientPrimaryButtonProps = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
};

function GradientPrimaryButton({ label, icon, onPress, disabled, loading }: GradientPrimaryButtonProps) {
  const isInactive = disabled && !loading;
  return (
    <Pressable
      style={({ pressed }) => [
        s.primaryBtn,
        pressed && !disabled && s.primaryBtnPressed,
        isInactive && s.primaryBtnDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}>
      {!isInactive ? (
        <View style={StyleSheet.absoluteFill}>
          <Svg width="100%" height="100%">
            <Defs>
              <LinearGradient id={`ingGrad-${label}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={Brand.fresh} stopOpacity="1" />
                <Stop offset="100%" stopColor={Brand.forest} stopOpacity="1" />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" rx="22" ry="22" fill={`url(#ingGrad-${label})`} />
          </Svg>
        </View>
      ) : null}

      <View style={s.primaryBtnInner}>
        {loading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <View style={[s.primaryBtnIcon, isInactive && s.primaryBtnIconDisabled]}>
            <Ionicons name={icon} size={14} color={isInactive ? Brand.textMuted : '#FFFFFF'} />
          </View>
        )}
        <Text style={[s.primaryBtnText, isInactive && s.primaryBtnTextDisabled]}>{label}</Text>
      </View>
    </Pressable>
  );
}

type PreviewPanelProps = {
  loading: boolean;
  error: string | null;
  preview: NutritionData | null;
  lookupLabel: string | null;
  emptyHint: string;
  applyLabel: string;
  onApply: () => void;
};

function PreviewPanel({
  loading,
  error,
  preview,
  lookupLabel,
  emptyHint,
  applyLabel,
  onApply,
}: PreviewPanelProps) {
  return (
    <View style={s.previewCard}>
      <View style={s.previewHeaderRow}>
        <View style={s.previewBadge}>
          <Ionicons name="analytics" size={11} color={Brand.indigo} />
          <Text style={s.previewBadgeText}>PRÉVIA</Text>
        </View>
        {lookupLabel ? (
          <Text style={s.previewLookupText} numberOfLines={1}>
            {lookupLabel}
          </Text>
        ) : null}
      </View>

      {loading ? (
        <View style={s.previewPlaceholder}>
          <ActivityIndicator size="small" color={Brand.greenDeeper} />
          <Text style={s.previewPlaceholderText}>Buscando estimativa...</Text>
        </View>
      ) : error ? (
        <View style={s.previewErrorRow}>
          <Ionicons name="alert-circle" size={14} color={Brand.danger} />
          <Text style={s.previewErrorText}>{error}</Text>
        </View>
      ) : preview ? (
        <>
          <View style={s.previewCalRow}>
            <Text style={s.previewCalValue}>{preview.calories}</Text>
            <Text style={s.previewCalLabel}>calorias</Text>
          </View>
          <View style={s.previewMacros}>
            <ExploreMacroChip
              label="prot"
              value={preview.protein}
              color={Brand.macroProtein}
              bg={Brand.macroProteinBg}
              compact
            />
            <ExploreMacroChip
              label="carb"
              value={preview.carbs}
              color={Brand.macroCarb}
              bg={Brand.macroCarbBg}
              compact
            />
            <ExploreMacroChip
              label="gord"
              value={preview.fat}
              color={Brand.macroFat}
              bg={Brand.macroFatBg}
              compact
            />
          </View>
          <Pressable
            style={({ pressed }) => [s.applyBtn, pressed && s.applyBtnPressed]}
            onPress={onApply}>
            <Ionicons name="checkmark-circle" size={14} color={Brand.greenDeeper} />
            <Text style={s.applyBtnText}>{applyLabel}</Text>
          </Pressable>
        </>
      ) : (
        <View style={s.previewPlaceholder}>
          <Ionicons name="information-circle-outline" size={14} color={Brand.textMuted} />
          <Text style={s.previewPlaceholderText}>{emptyHint}</Text>
        </View>
      )}
    </View>
  );
}

type ManualMacroFieldProps = {
  label: string;
  unit: 'kcal' | 'g';
  letter: string;
  color: string;
  bg: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
};

function ManualMacroField({ label, unit, letter, color, bg, value, onChange, placeholder }: ManualMacroFieldProps) {
  return (
    <View style={s.manualFieldWrap}>
      <View style={s.manualFieldHeader}>
        <View style={[s.manualLetter, { backgroundColor: color }]}>
          <Text style={s.manualLetterText}>{letter}</Text>
        </View>
        <Text style={[s.manualFieldLabel, { color }]}>{label}</Text>
      </View>
      <View style={[s.manualInputWrap, { backgroundColor: bg, borderColor: color }]}>
        <AppInput
          placeholder={placeholder}
          value={value}
          onChangeText={(raw) => onChange(raw.replace(/[^0-9a-zA-Z.,\s]/g, ''))}
          keyboardType="decimal-pad"
          style={s.manualInput}
        />
        <Text style={[s.manualUnit, { color }]}>{unit}</Text>
      </View>
    </View>
  );
}

function IngredientBasicsForm({
  draft,
  onChangeDraft,
}: {
  draft: NutritionIngredientSheetDraft;
  onChangeDraft: (patch: Partial<NutritionIngredientSheetDraft>) => void;
}) {
  return (
    <View style={s.formCard}>
      <View style={s.fieldGroup}>
        <Text style={s.fieldLabel}>Nome do alimento</Text>
        <AppInput
          placeholder="Ex.: arroz branco"
          value={draft.name}
          onChangeText={(value) => onChangeDraft({ name: value })}
          maxLength={60}
        />
      </View>

      <View style={s.fieldGroup}>
        <Text style={s.fieldLabel}>Quantidade</Text>
        <View style={s.quantityRow}>
          <View style={s.quantityInputWrap}>
            <AppInput
              placeholder="0"
              value={draft.quantityValue}
              onChangeText={(value) => onChangeDraft({ quantityValue: value.replace(/[^0-9.,]/g, '') })}
              keyboardType="decimal-pad"
              maxLength={7}
            />
          </View>

          <View style={s.unitRow}>
            {UNITS.map((unit) => (
              <Pressable
                key={unit}
                style={({ pressed }) => [
                  s.unitBtn,
                  draft.quantityUnit === unit && s.unitBtnActive,
                  pressed && s.unitBtnPressed,
                ]}
                onPress={() => onChangeDraft({ quantityUnit: unit })}>
                <Text style={[s.unitText, draft.quantityUnit === unit && s.unitTextActive]}>{unit}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

function CurrentIngredientOverview({ item }: { item: NutritionReviewDraftItem }) {
  return (
    <View style={s.currentCard}>
      <View style={s.currentHeaderRow}>
        <View style={s.currentEyebrowPill}>
          <Ionicons name="time-outline" size={10} color={Brand.greenDeeper} />
          <Text style={s.currentEyebrow}>COMO ESTÁ AGORA</Text>
        </View>
      </View>

      <View style={s.currentCopy}>
        <Text style={s.currentName} numberOfLines={2}>
          {item.name || 'Ingrediente sem nome'}
        </Text>
        {item.quantityLabel ? (
          <Text style={s.currentMeta}>{item.quantityLabel}</Text>
        ) : (
          <Text style={s.currentMeta}>Quantidade não informada</Text>
        )}
      </View>

      <View style={s.currentCalRow}>
        <Text style={s.currentCalValue}>{item.calories}</Text>
      </View>

      <View style={s.currentMacroRow}>
        <ExploreMacroChip label="prot" value={item.protein} color={Brand.macroProtein} bg={Brand.macroProteinBg} compact />
        <ExploreMacroChip label="carb" value={item.carbs} color={Brand.macroCarb} bg={Brand.macroCarbBg} compact />
        <ExploreMacroChip label="gord" value={item.fat} color={Brand.macroFat} bg={Brand.macroFatBg} compact />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  sheet: {
    maxHeight: '90%',
  },
  content: {
    paddingHorizontal: 18,
    paddingBottom: 32,
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: Brand.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...Typography.subtitle,
    fontSize: 18,
    color: Brand.text,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  subtitle: {
    ...Typography.caption,
    fontSize: 12,
    color: Brand.textSecondary,
    fontWeight: '500',
    lineHeight: 16,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Brand.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnPressed: {
    backgroundColor: Brand.border,
  },
  currentCard: {
    borderRadius: Radii.xl,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(20,108,56,0.08)',
    padding: 14,
    gap: 10,
    ...Shadows.card,
  },
  currentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentEyebrowPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: Radii.pill,
    backgroundColor: Brand.surfaceSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  currentEyebrow: {
    ...Typography.caption,
    fontSize: 9,
    color: Brand.greenDeeper,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  currentCopy: {
    gap: 3,
  },
  currentName: {
    ...Typography.body,
    fontSize: 16,
    color: Brand.text,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  currentMeta: {
    ...Typography.caption,
    fontSize: 12,
    color: Brand.textSecondary,
    fontWeight: '600',
  },
  currentCalRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currentCalValue: {
    ...Typography.subtitle,
    fontSize: 20,
    color: Brand.greenDeeper,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  currentMacroRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  modeRow: {
    flexDirection: 'row',
    backgroundColor: Brand.surfaceAlt,
    borderRadius: Radii.pill,
    padding: 4,
    gap: 4,
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: Radii.pill,
  },
  modeBtnActive: {
    backgroundColor: '#FFFFFF',
    ...Shadows.card,
  },
  modeBtnPressed: {
    opacity: 0.85,
  },
  modeBtnText: {
    ...Typography.caption,
    fontSize: 12,
    color: Brand.textSecondary,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  modeBtnTextActive: {
    color: Brand.greenDeeper,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: 'rgba(20,108,56,0.08)',
    padding: 14,
    gap: 12,
    ...Shadows.card,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '800',
    color: Brand.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginLeft: 4,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityInputWrap: {
    flex: 1,
  },
  unitRow: {
    flexDirection: 'row',
    gap: 4,
  },
  unitBtn: {
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 11,
    borderRadius: 14,
    backgroundColor: Brand.surfaceAlt,
    borderWidth: 1,
    borderColor: Brand.border,
  },
  unitBtnActive: {
    backgroundColor: Brand.surfaceSoft,
    borderColor: Brand.greenDeeper,
  },
  unitBtnPressed: {
    opacity: 0.85,
  },
  unitText: {
    ...Typography.body,
    fontSize: 13,
    color: Brand.textSecondary,
    fontWeight: '800',
  },
  unitTextActive: {
    color: Brand.greenDeeper,
  },
  primaryBtn: {
    borderRadius: 22,
    minHeight: 50,
    overflow: 'hidden',
    justifyContent: 'center',
    ...Shadows.card,
  },
  primaryBtnPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  primaryBtnDisabled: {
    backgroundColor: Brand.surfaceAlt,
    borderWidth: 1,
    borderColor: Brand.border,
  },
  primaryBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  primaryBtnIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnIconDisabled: {
    backgroundColor: 'transparent',
  },
  primaryBtnText: {
    ...Typography.body,
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  primaryBtnTextDisabled: {
    color: Brand.textMuted,
  },
  previewCard: {
    borderRadius: Radii.xl,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(20,108,56,0.08)',
    padding: 14,
    gap: 10,
    ...Shadows.card,
  },
  previewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: Radii.pill,
    backgroundColor: '#EEF0FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  previewBadgeText: {
    ...Typography.caption,
    fontSize: 9,
    color: Brand.indigo,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  previewLookupText: {
    ...Typography.caption,
    fontSize: 11,
    color: Brand.textSecondary,
    fontWeight: '600',
    flex: 1,
  },
  previewCalRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  previewCalValue: {
    ...Typography.title,
    fontSize: 26,
    lineHeight: 30,
    color: Brand.greenDeeper,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  previewCalLabel: {
    ...Typography.caption,
    fontSize: 11,
    color: Brand.greenDark,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  previewMacros: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: Radii.pill,
    backgroundColor: Brand.surfaceSoft,
    paddingVertical: 11,
    paddingHorizontal: 14,
    marginTop: 2,
  },
  applyBtnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  applyBtnText: {
    ...Typography.body,
    fontSize: 13,
    color: Brand.greenDeeper,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  previewPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: Radii.lg,
    backgroundColor: Brand.surfaceAlt,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  previewPlaceholderText: {
    ...Typography.caption,
    fontSize: 12,
    color: Brand.textSecondary,
    fontWeight: '500',
    flex: 1,
  },
  previewErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: Radii.lg,
    backgroundColor: '#FFF0F0',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  previewErrorText: {
    ...Typography.caption,
    fontSize: 12,
    color: Brand.danger,
    fontWeight: '600',
    flex: 1,
    lineHeight: 17,
  },
  manualCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: 'rgba(20,108,56,0.08)',
    padding: 14,
    ...Shadows.card,
  },
  macroGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  manualFieldWrap: {
    flexBasis: '48%',
    flexGrow: 1,
    gap: 6,
  },
  manualFieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  manualLetter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualLetterText: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  manualFieldLabel: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  manualInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingRight: 12,
  },
  manualInput: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 0,
    minHeight: 46,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    fontWeight: '700',
  },
  manualUnit: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.3,
    marginLeft: 4,
  },
  removeButton: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radii.pill,
    backgroundColor: '#FFF4F5',
    borderWidth: 1,
    borderColor: '#FCD5DB',
    marginTop: 4,
  },
  removeButtonPressed: {
    opacity: 0.9,
  },
  removeButtonText: {
    ...Typography.caption,
    fontSize: 12,
    color: Brand.danger,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
