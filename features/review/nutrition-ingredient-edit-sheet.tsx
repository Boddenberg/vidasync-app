import Ionicons from '@expo/vector-icons/Ionicons';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { AppInput } from '@/components/app-input';
import { DraggableSheetModal } from '@/components/ui/draggable-sheet-modal';
import { Brand, Radii, Spacing, Typography } from '@/constants/theme';
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
          <View style={s.header}>
            <Text style={s.title}>{copy.title}</Text>
            <Text style={s.subtitle}>{copy.subtitle}</Text>
          </View>

          {currentItem ? <CurrentIngredientOverview item={currentItem} /> : null}

          <View style={s.modeSwitchRow}>
            <ModeSwitchButton
              label="Recalcular"
              active={activeAdjustmentMode === 'recalculate'}
              onPress={() => onChangeAdjustmentMode('recalculate')}
            />
            <ModeSwitchButton
              label="Manual"
              active={activeAdjustmentMode === 'manual'}
              onPress={() => onChangeAdjustmentMode('manual')}
            />
          </View>

          {activeAdjustmentMode === 'recalculate' ? (
            <>
              <ModeContentHeader
                title={copy.recalculateSectionTitle}
                subtitle={copy.recalculateSectionSubtitle}
              />

              <IngredientBasicsForm draft={draft} onChangeDraft={onChangeDraft} />

              <View style={s.primaryActionCard}>
                <AppButton
                  title={copy.recalculateActionTitle}
                  onPress={onRecalculate}
                  loading={recalculationLoading}
                  disabled={!canRecalculate}
                  variant={recalculationPreview ? 'secondary' : 'primary'}
                />
                <Text style={s.primaryActionHint}>{copy.recalculateHint}</Text>
              </View>

              <View style={s.previewCard}>
                <View style={s.previewHeader}>
                  <Text style={s.previewTitle}>Previa do novo resultado</Text>
                  {recalculationLookupLabel ? (
                    <Text style={s.previewLookupText}>{recalculationLookupLabel}</Text>
                  ) : (
                    <Text style={s.previewLookupText}>
                      Revise o nome, a quantidade e a unidade para gerar a previa.
                    </Text>
                  )}
                </View>

                {recalculationLoading ? (
                  <View style={s.previewState}>
                    <Text style={s.previewStateText}>Buscando uma nova estimativa para esse ingrediente...</Text>
                  </View>
                ) : recalculationError ? (
                  <View style={s.previewFeedbackCard}>
                    <Text style={s.previewErrorText}>{recalculationError}</Text>
                  </View>
                ) : recalculationPreview ? (
                  <View style={s.previewBody}>
                    <View style={s.previewGrid}>
                      <PreviewMetric
                        label="Calorias"
                        value={recalculationPreview.calories}
                        backgroundColor={Brand.positiveBg}
                        textColor={Brand.greenDark}
                      />
                      <PreviewMetric
                        label="Proteina"
                        value={recalculationPreview.protein}
                        backgroundColor={Brand.hydrationBg}
                        textColor={Brand.hydration}
                      />
                      <PreviewMetric
                        label="Carboidratos"
                        value={recalculationPreview.carbs}
                        backgroundColor={Brand.warningBg}
                        textColor={Brand.warning}
                      />
                      <PreviewMetric
                        label="Gorduras"
                        value={recalculationPreview.fat}
                        backgroundColor={Brand.fatBg}
                        textColor={Brand.fat}
                      />
                    </View>

                    <AppButton title={copy.applyPreviewTitle} onPress={onApplyRecalculation} />
                  </View>
                ) : (
                  <View style={s.previewState}>
                    <Text style={s.previewStateText}>{copy.emptyPreviewHint}</Text>
                  </View>
                )}
              </View>
            </>
          ) : null}

          {activeAdjustmentMode === 'manual' ? (
            <>
              <ModeContentHeader title={copy.manualSectionTitle} subtitle={copy.manualSectionSubtitle} />

              <IngredientBasicsForm draft={draft} onChangeDraft={onChangeDraft} />

              <View style={s.formCard}>
                <View style={s.manualBody}>
                  <View style={s.gridRow}>
                    <View style={s.gridCell}>
                      <Text style={s.label}>Calorias</Text>
                      <AppInput
                        placeholder="0 kcal"
                        value={draft.calories}
                        onChangeText={(value) =>
                          onChangeDraft({ calories: value.replace(/[^0-9a-zA-Z.,\s]/g, '') })
                        }
                      />
                    </View>
                    <View style={s.gridCell}>
                      <Text style={s.label}>Proteina</Text>
                      <AppInput
                        placeholder="0 g"
                        value={draft.protein}
                        onChangeText={(value) =>
                          onChangeDraft({ protein: value.replace(/[^0-9a-zA-Z.,\s]/g, '') })
                        }
                      />
                    </View>
                  </View>

                  <View style={s.gridRow}>
                    <View style={s.gridCell}>
                      <Text style={s.label}>Carboidratos</Text>
                      <AppInput
                        placeholder="0 g"
                        value={draft.carbs}
                        onChangeText={(value) =>
                          onChangeDraft({ carbs: value.replace(/[^0-9a-zA-Z.,\s]/g, '') })
                        }
                      />
                    </View>
                    <View style={s.gridCell}>
                      <Text style={s.label}>Gorduras</Text>
                      <AppInput
                        placeholder="0 g"
                        value={draft.fat}
                        onChangeText={(value) =>
                          onChangeDraft({ fat: value.replace(/[^0-9a-zA-Z.,\s]/g, '') })
                        }
                      />
                    </View>
                  </View>

                  <AppButton
                    title={copy.manualActionTitle}
                    onPress={onApplyManual}
                    disabled={!canApplyManual}
                  />
                </View>
              </View>
            </>
          ) : null}

          {onRemove ? (
            <Pressable style={s.removeButton} onPress={onRemove}>
              <Ionicons name="trash-outline" size={16} color={Brand.danger} />
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
      title: 'Adicionar alimento faltando',
      subtitle: 'Inclua um item que nao apareceu na analise e revise os macros antes de adicionar.',
      recalculateSectionTitle: 'Buscar macros para o novo alimento',
      recalculateSectionSubtitle:
        'Preencha o nome, a quantidade e a unidade para gerar uma estimativa antes de adicionar.',
      recalculateActionTitle: 'Calcular macros do alimento',
      recalculateHint: 'Use a busca nutricional do app para preencher os macros deste novo item.',
      applyPreviewTitle: 'Adicionar alimento',
      emptyPreviewHint:
        'Toque em "Calcular macros do alimento" para visualizar a estimativa antes de adicionar.',
      manualSectionTitle: 'Preencher manualmente',
      manualSectionSubtitle:
        'Informe calorias, proteina, carboidratos e gorduras para adicionar esse alimento manualmente.',
      manualActionTitle: 'Adicionar manualmente',
    };
  }

  return {
    title: 'Editar ingrediente',
    subtitle: 'Revise nome, quantidade e unidade antes de seguir.',
    recalculateSectionTitle: 'Buscar um novo resultado',
    recalculateSectionSubtitle:
      'Ajuste nome, quantidade e unidade para comparar uma nova estimativa antes de salvar.',
    recalculateActionTitle: 'Recalcular ingrediente',
    recalculateHint: 'Geramos uma nova estimativa para voce revisar antes de aplicar na refeicao.',
    applyPreviewTitle: 'Aplicar ajuste',
    emptyPreviewHint:
      'Toque em "Recalcular ingrediente" para comparar uma nova estimativa deste item.',
    manualSectionTitle: 'Substituir com ajuste manual',
    manualSectionSubtitle:
      'Preencha os macros abaixo para salvar esse ingrediente com os valores informados por voce.',
    manualActionTitle: 'Aplicar ajuste manual',
  };
}

function ModeSwitchButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[s.modeSwitchButton, active && s.modeSwitchButtonActive]} onPress={onPress}>
      <Text style={[s.modeSwitchText, active && s.modeSwitchTextActive]}>{label}</Text>
    </Pressable>
  );
}

function ModeContentHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <View style={s.modeContentHeader}>
      <Text style={s.modeContentTitle}>{title}</Text>
      <Text style={s.modeContentSubtitle}>{subtitle}</Text>
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
      <Text style={s.label}>Nome do alimento</Text>
      <AppInput
        placeholder="Ex.: arroz branco"
        value={draft.name}
        onChangeText={(value) => onChangeDraft({ name: value })}
        maxLength={60}
      />

      <Text style={s.label}>Quantidade</Text>
      <View style={s.quantityRow}>
        <View style={s.quantityInputWrap}>
          <AppInput
            placeholder="Qtd."
            value={draft.quantityValue}
            onChangeText={(value) => onChangeDraft({ quantityValue: value.replace(/[^0-9.,]/g, '') })}
            keyboardType="numeric"
            maxLength={7}
          />
        </View>

        <View style={s.unitRow}>
          {UNITS.map((unit) => (
            <Pressable
              key={unit}
              style={[s.unitBtn, draft.quantityUnit === unit && s.unitBtnActive]}
              onPress={() => onChangeDraft({ quantityUnit: unit })}>
              <Text style={[s.unitText, draft.quantityUnit === unit && s.unitTextActive]}>{unit}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

function CurrentIngredientOverview({ item }: { item: NutritionReviewDraftItem }) {
  return (
    <View style={s.currentCard}>
      <View style={s.currentCopy}>
        <Text style={s.currentEyebrow}>Como esta agora</Text>
        <Text style={s.currentName}>{item.name || 'Ingrediente sem nome'}</Text>
        {item.quantityLabel ? (
          <Text style={s.currentMeta}>{item.quantityLabel}</Text>
        ) : (
          <Text style={s.currentMeta}>Quantidade nao informada</Text>
        )}
      </View>

      <View style={s.currentMacroRow}>
        <ExploreMacroChip label="kcal" value={item.calories} color={Brand.greenDark} bg={Brand.positiveBg} />
        <ExploreMacroChip label="prot" value={item.protein} color={Brand.hydration} bg={Brand.hydrationBg} />
        <ExploreMacroChip label="carb" value={item.carbs} color={Brand.warning} bg={Brand.warningBg} />
        <ExploreMacroChip label="gord" value={item.fat} color={Brand.fat} bg={Brand.fatBg} />
      </View>
    </View>
  );
}

function PreviewMetric({
  label,
  value,
  backgroundColor,
  textColor,
}: {
  label: string;
  value: string;
  backgroundColor: string;
  textColor: string;
}) {
  return (
    <View style={[s.previewMetricCard, { backgroundColor }]}>
      <Text style={[s.previewMetricLabel, { color: textColor }]}>{label}</Text>
      <Text style={s.previewMetricValue}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  sheet: {
    maxHeight: '88%',
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  header: {
    gap: Spacing.xs,
  },
  title: {
    ...Typography.subtitle,
    color: Brand.text,
    fontWeight: '800',
  },
  subtitle: {
    ...Typography.body,
    color: Brand.textSecondary,
  },
  modeSwitchRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  modeSwitchButton: {
    flex: 1,
    borderRadius: Radii.pill,
    backgroundColor: Brand.bg,
    borderWidth: 1,
    borderColor: Brand.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeSwitchButtonActive: {
    backgroundColor: Brand.surfaceSoft,
    borderColor: '#B7DCC2',
  },
  modeSwitchText: {
    ...Typography.body,
    color: Brand.textSecondary,
    fontWeight: '700',
  },
  modeSwitchTextActive: {
    color: Brand.greenDark,
  },
  modeContentHeader: {
    gap: 4,
  },
  modeContentTitle: {
    ...Typography.body,
    color: Brand.text,
    fontWeight: '800',
  },
  modeContentSubtitle: {
    ...Typography.caption,
    color: Brand.textSecondary,
  },
  currentCard: {
    borderRadius: Radii.xl,
    backgroundColor: Brand.surfaceSoft,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  currentCopy: {
    gap: 4,
  },
  currentEyebrow: {
    ...Typography.caption,
    color: Brand.greenDark,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  currentName: {
    ...Typography.body,
    color: Brand.text,
    fontWeight: '800',
  },
  currentMeta: {
    ...Typography.caption,
    color: Brand.textSecondary,
  },
  currentMacroRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  formCard: {
    borderRadius: Radii.xl,
    backgroundColor: Brand.card,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  label: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  quantityInputWrap: {
    flex: 1,
  },
  unitRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  unitBtn: {
    minWidth: 46,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: Brand.bg,
    borderWidth: 1,
    borderColor: Brand.border,
  },
  unitBtnActive: {
    backgroundColor: '#E7F6EC',
    borderColor: '#B7DCC2',
  },
  unitText: {
    ...Typography.body,
    color: Brand.textSecondary,
    fontWeight: '700',
  },
  unitTextActive: {
    color: Brand.greenDark,
  },
  primaryActionCard: {
    gap: Spacing.sm,
  },
  primaryActionHint: {
    ...Typography.caption,
    color: Brand.textSecondary,
    lineHeight: 18,
  },
  previewCard: {
    borderRadius: Radii.xl,
    backgroundColor: Brand.surfaceSoft,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  previewHeader: {
    gap: 4,
  },
  previewTitle: {
    ...Typography.body,
    color: Brand.text,
    fontWeight: '800',
  },
  previewLookupText: {
    ...Typography.caption,
    color: Brand.textSecondary,
  },
  previewBody: {
    gap: Spacing.sm,
  },
  previewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  previewMetricCard: {
    flexGrow: 1,
    flexBasis: '47%',
    minWidth: 128,
    borderRadius: Radii.lg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    gap: 4,
  },
  previewMetricLabel: {
    ...Typography.caption,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  previewMetricValue: {
    ...Typography.body,
    color: Brand.text,
    fontWeight: '800',
  },
  previewState: {
    borderRadius: Radii.lg,
    backgroundColor: Brand.card,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: Spacing.sm,
  },
  previewStateText: {
    ...Typography.helper,
    color: Brand.textSecondary,
  },
  previewFeedbackCard: {
    borderRadius: Radii.lg,
    backgroundColor: '#FFF0F0',
    padding: Spacing.sm,
  },
  previewErrorText: {
    ...Typography.helper,
    color: Brand.danger,
  },
  manualBody: {
    gap: Spacing.sm,
  },
  gridRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  gridCell: {
    flex: 1,
    gap: Spacing.xs,
  },
  removeButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  removeButtonText: {
    ...Typography.body,
    color: Brand.danger,
    fontWeight: '700',
  },
});
