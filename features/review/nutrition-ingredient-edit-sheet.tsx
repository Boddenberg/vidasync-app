import Ionicons from '@expo/vector-icons/Ionicons';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { AppInput } from '@/components/app-input';
import { DraggableSheetModal } from '@/components/ui/draggable-sheet-modal';
import { Brand, Radii, Spacing, Typography } from '@/constants/theme';
import type { NutritionData } from '@/types/nutrition';
import type {
  NutritionReviewDraftItem,
  NutritionReviewItemStatus,
  NutritionReviewQuantityUnit,
} from '@/types/review';

const UNITS: NutritionReviewQuantityUnit[] = ['g', 'ml', 'un'];

export type NutritionIngredientSheetDraft = Pick<
  NutritionReviewDraftItem,
  'name' | 'calories' | 'protein' | 'carbs' | 'fat' | 'quantityValue' | 'quantityUnit'
>;

type Props = {
  visible: boolean;
  draft: NutritionIngredientSheetDraft | null;
  itemStatus: NutritionReviewItemStatus | null;
  warnings: string[];
  manualSectionOpen: boolean;
  recalculationPreview: NutritionData | null;
  recalculationLookupLabel: string | null;
  recalculationLoading: boolean;
  recalculationError: string | null;
  onClose: () => void;
  onChangeDraft: (patch: Partial<NutritionIngredientSheetDraft>) => void;
  onToggleManualSection: () => void;
  onRecalculate: () => void;
  onApplyRecalculation: () => void;
  onApplyManual: () => void;
  onRemove: () => void;
};

export function NutritionIngredientEditSheet({
  visible,
  draft,
  itemStatus,
  warnings,
  manualSectionOpen,
  recalculationPreview,
  recalculationLookupLabel,
  recalculationLoading,
  recalculationError,
  onClose,
  onChangeDraft,
  onToggleManualSection,
  onRecalculate,
  onApplyRecalculation,
  onApplyManual,
  onRemove,
}: Props) {
  if (!draft) return null;

  return (
    <DraggableSheetModal visible={visible} onClose={onClose} sheetStyle={s.sheet}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <View style={s.header}>
            <Text style={s.title}>Editar ingrediente</Text>
            <Text style={s.subtitle}>
              Revise nome, quantidade e unidade antes de seguir.
            </Text>
          </View>

          <View style={s.metaRow}>
            <StatusBadge status={itemStatus} />
            {warnings.length > 0 ? (
              <View style={s.warningCountBadge}>
                <Ionicons name="alert-circle-outline" size={14} color={Brand.warning} />
                <Text style={s.warningCountText}>
                  {warnings.length} {warnings.length === 1 ? 'alerta' : 'alertas'}
                </Text>
              </View>
            ) : null}
          </View>

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
                  onChangeText={(value) =>
                    onChangeDraft({ quantityValue: value.replace(/[^0-9.,]/g, '') })
                  }
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
                    <Text style={[s.unitText, draft.quantityUnit === unit && s.unitTextActive]}>
                      {unit}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          {warnings.length > 0 ? (
            <View style={s.warningCard}>
              {warnings.map((warning, index) => (
                <Text key={`${warning}-${index}`} style={s.warningText}>
                  {warning}
                </Text>
              ))}
            </View>
          ) : null}

          <View style={s.primaryActionCard}>
            <AppButton
              title="Recalcular ingrediente"
              onPress={onRecalculate}
              loading={recalculationLoading}
              variant={recalculationPreview ? 'secondary' : 'primary'}
            />
            <Text style={s.primaryActionHint}>
              Consulte os macros atualizados deste ingrediente antes de aplicar na refeicao.
            </Text>
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
                <Text style={s.previewStateText}>Recalculando macros do ingrediente...</Text>
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

                <AppButton title="Aplicar ajuste" onPress={onApplyRecalculation} />
              </View>
            ) : (
              <View style={s.previewState}>
                <Text style={s.previewStateText}>
                  Recalcule para visualizar calorias, proteina, carboidratos e gorduras antes de aplicar.
                </Text>
              </View>
            )}
          </View>

          <View style={s.formCard}>
            <Pressable style={s.manualToggleRow} onPress={onToggleManualSection}>
              <View style={s.manualToggleCopy}>
                <Text style={s.manualToggleTitle}>Ajuste manual</Text>
                <Text style={s.manualToggleSubtitle}>
                  Use so se quiser substituir os macros deste item.
                </Text>
              </View>
              <Ionicons
                name={manualSectionOpen ? 'chevron-up-outline' : 'chevron-down-outline'}
                size={18}
                color={Brand.textSecondary}
              />
            </Pressable>

            {manualSectionOpen ? (
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

                <AppButton title="Aplicar ajuste manual" variant="secondary" onPress={onApplyManual} />
              </View>
            ) : null}
          </View>

          <Pressable style={s.removeButton} onPress={onRemove}>
            <Ionicons name="trash-outline" size={16} color={Brand.danger} />
            <Text style={s.removeButtonText}>Remover ingrediente</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </DraggableSheetModal>
  );
}

function StatusBadge({ status }: { status: NutritionReviewItemStatus | null }) {
  const palette = resolveStatusPalette(status);

  return (
    <View style={[s.statusBadge, { backgroundColor: palette.bg }]}>
      <Text style={[s.statusBadgeText, { color: palette.text }]}>{palette.label}</Text>
    </View>
  );
}

function resolveStatusPalette(status: NutritionReviewItemStatus | null) {
  if (status === 'manual') {
    return { label: 'Manual', bg: Brand.hydrationBg, text: Brand.hydration };
  }

  if (status === 'added') {
    return { label: 'Adicionado', bg: Brand.positiveBg, text: Brand.greenDark };
  }

  if (status === 'recalculated') {
    return { label: 'Recalculado', bg: Brand.warningBg, text: Brand.warning };
  }

  return { label: 'Automatico', bg: Brand.surfaceSoft, text: Brand.greenDark };
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
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  statusBadge: {
    borderRadius: Radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusBadgeText: {
    ...Typography.caption,
    fontWeight: '800',
  },
  warningCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: Radii.pill,
    backgroundColor: Brand.warningBg,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  warningCountText: {
    ...Typography.caption,
    color: Brand.warning,
    fontWeight: '800',
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
  warningCard: {
    borderRadius: Radii.xl,
    backgroundColor: Brand.warningBg,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  warningText: {
    ...Typography.helper,
    color: Brand.warning,
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
  manualToggleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  manualToggleCopy: {
    flex: 1,
    gap: 4,
  },
  manualToggleTitle: {
    ...Typography.body,
    color: Brand.text,
    fontWeight: '800',
  },
  manualToggleSubtitle: {
    ...Typography.caption,
    color: Brand.textSecondary,
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
