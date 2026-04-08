import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Easing, Image, Pressable, Text, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { AppInput } from '@/components/app-input';
import { Brand } from '@/constants/theme';
import {
  type NutritionIngredientAdjustmentMode,
  NutritionIngredientEditSheet,
  type NutritionIngredientSheetDraft,
  type NutritionIngredientSheetMode,
} from '@/features/review/nutrition-ingredient-edit-sheet';
import { s } from '@/features/review/review-editor-styles';
import { buildQuantityLabel, buildRevealStyle, sourceLabel } from '@/features/review/review-utils';
import { getNutrition } from '@/services/nutrition';
import type { NutritionCorrection, NutritionData } from '@/types/nutrition';
import type {
  NutritionReviewDraft,
  NutritionReviewDraftItem,
  NutritionReviewDraftItemInput,
  NutritionReviewDraftItemPatch,
  NutritionReviewItemStatus,
} from '@/types/review';
import { formatIngredient } from '@/utils/helpers';

type Props = {
  draft: NutritionReviewDraft;
  source: 'photo' | 'audio';
  title: string;
  photoUri: string | null;
  corrections: NutritionCorrection[];
  onChangeSummary: (
    field: 'calories' | 'protein' | 'carbs' | 'fat',
    value: string,
  ) => void;
  onCommitItem: (itemId: string, patch: NutritionReviewDraftItemPatch) => void;
  onAddItem: (item: NutritionReviewDraftItemInput) => void;
  onRemoveItem: (itemId: string) => void;
};

type IngredientSheetState = {
  mode: NutritionIngredientSheetMode | null;
  itemId: string | null;
  draft: NutritionIngredientSheetDraft | null;
  activeAdjustmentMode: NutritionIngredientAdjustmentMode;
};

type IngredientRecalculationState = {
  loading: boolean;
  preview: NutritionData | null;
  error: string | null;
  lookupLabel: string | null;
};

const INITIAL_SHEET_STATE: IngredientSheetState = {
  mode: null,
  itemId: null,
  draft: null,
  activeAdjustmentMode: 'recalculate',
};

const INITIAL_RECALCULATION_STATE: IngredientRecalculationState = {
  loading: false,
  preview: null,
  error: null,
  lookupLabel: null,
};

export function NutritionReviewEditor({
  draft,
  source,
  title,
  photoUri,
  corrections,
  onChangeSummary,
  onCommitItem,
  onAddItem,
  onRemoveItem,
}: Props) {
  const [showManualEditor, setShowManualEditor] = useState(false);
  const [ingredientSheet, setIngredientSheet] = useState<IngredientSheetState>(INITIAL_SHEET_STATE);
  const [ingredientRecalculation, setIngredientRecalculation] = useState<IngredientRecalculationState>(
    INITIAL_RECALCULATION_STATE,
  );

  const heroAnim = useRef(new Animated.Value(0)).current;
  const correctionAnim = useRef(new Animated.Value(0)).current;
  const itemsAnim = useRef(new Animated.Value(0)).current;
  const editorAnim = useRef(new Animated.Value(0)).current;
  const ingredientRecalculationRequestRef = useRef(0);
  const resetIngredientRecalculation = useCallback(() => {
    ingredientRecalculationRequestRef.current += 1;
    setIngredientRecalculation(INITIAL_RECALCULATION_STATE);
  }, []);

  const activeItem = useMemo(
    () =>
      ingredientSheet.mode === 'edit' && ingredientSheet.itemId
        ? draft.items.find((item) => item.id === ingredientSheet.itemId) ?? null
        : null,
    [draft.items, ingredientSheet.itemId, ingredientSheet.mode],
  );
  const isIngredientSheetVisible = ingredientSheet.mode != null && ingredientSheet.draft != null;

  useEffect(() => {
    const sequence = [heroAnim, correctionAnim, itemsAnim, editorAnim];
    sequence.forEach((value) => value.setValue(0));

    Animated.stagger(
      100,
      sequence.map((value) =>
        Animated.timing(value, {
          toValue: 1,
          duration: 360,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ),
    ).start();
  }, [
    correctionAnim,
    draft.items.length,
    draft.summary.calories,
    draft.summary.carbs,
    draft.summary.fat,
    draft.summary.protein,
    editorAnim,
    heroAnim,
    itemsAnim,
    title,
  ]);

  useEffect(() => {
    if (ingredientSheet.mode === 'edit' && ingredientSheet.itemId && !activeItem) {
      resetIngredientRecalculation();
      setIngredientSheet(INITIAL_SHEET_STATE);
    }
  }, [activeItem, ingredientSheet.itemId, ingredientSheet.mode, resetIngredientRecalculation]);

  function openIngredientEditor(item: NutritionReviewDraftItem) {
    resetIngredientRecalculation();
    setIngredientSheet({
      mode: 'edit',
      itemId: item.id,
      draft: buildIngredientSheetDraft(item),
      activeAdjustmentMode: 'recalculate',
    });
  }

  function openAddIngredientSheet() {
    resetIngredientRecalculation();
    setIngredientSheet({
      mode: 'add',
      itemId: null,
      draft: buildEmptyIngredientSheetDraft(),
      activeAdjustmentMode: 'recalculate',
    });
  }

  function closeIngredientSheet() {
    resetIngredientRecalculation();
    setIngredientSheet(INITIAL_SHEET_STATE);
  }

  function updateIngredientSheetDraft(patch: Partial<NutritionIngredientSheetDraft>) {
    resetIngredientRecalculation();
    setIngredientSheet((current) =>
      current.draft
        ? {
            ...current,
            draft: {
              ...current.draft,
              ...patch,
            },
          }
        : current,
    );
  }

  async function handleRecalculateIngredient() {
    if (!ingredientSheet.draft) return;

    const lookupLabel = buildIngredientLookupLabel(ingredientSheet.draft);
    if (!lookupLabel) {
      setIngredientRecalculation({
        loading: false,
        preview: null,
        error: 'Informe o nome do ingrediente para recalcular.',
        lookupLabel: null,
      });
      return;
    }

    const requestId = ingredientRecalculationRequestRef.current + 1;
    ingredientRecalculationRequestRef.current = requestId;
    setIngredientRecalculation({
      loading: true,
      preview: null,
      error: null,
      lookupLabel,
    });

    try {
      const preview = await getNutrition(lookupLabel);
      if (ingredientRecalculationRequestRef.current !== requestId) return;

      setIngredientRecalculation({
        loading: false,
        preview,
        error: null,
        lookupLabel,
      });
    } catch (error: any) {
      if (ingredientRecalculationRequestRef.current !== requestId) return;

      setIngredientRecalculation({
        loading: false,
        preview: null,
        error: resolveIngredientRecalculationErrorMessage(),
        lookupLabel,
      });
    }
  }

  function handleApplyRecalculatedIngredient() {
    if (!ingredientSheet.mode || !ingredientSheet.draft || !ingredientRecalculation.preview) return;

    if (ingredientSheet.mode === 'add') {
      onAddItem(buildIngredientInput(ingredientSheet.draft, ingredientRecalculation.preview, 'added'));
      closeIngredientSheet();
      return;
    }

    if (!ingredientSheet.itemId) return;

    onCommitItem(ingredientSheet.itemId, {
      ...buildIngredientPatch(ingredientSheet.draft),
      calories: ingredientRecalculation.preview.calories,
      protein: ingredientRecalculation.preview.protein,
      carbs: ingredientRecalculation.preview.carbs,
      fat: ingredientRecalculation.preview.fat,
      status: 'recalculated',
    });
    closeIngredientSheet();
  }

  function handleApplyManualAdjustment() {
    if (!ingredientSheet.mode || !ingredientSheet.draft || !ingredientSheet.draft.name.trim()) return;

    const manualNutrition = buildManualNutritionDataFromDraft(ingredientSheet.draft);

    if (ingredientSheet.mode === 'add') {
      onAddItem(buildIngredientInput(ingredientSheet.draft, manualNutrition, 'added'));
      closeIngredientSheet();
      return;
    }

    if (!ingredientSheet.itemId) return;

    onCommitItem(ingredientSheet.itemId, {
      ...buildIngredientPatch(ingredientSheet.draft),
      calories: manualNutrition.calories,
      protein: manualNutrition.protein,
      carbs: manualNutrition.carbs,
      fat: manualNutrition.fat,
      status: 'manual',
    });
    closeIngredientSheet();
  }

  function handleRemoveIngredient() {
    if (ingredientSheet.mode !== 'edit' || !ingredientSheet.itemId) return;

    const itemId = ingredientSheet.itemId;
    Alert.alert('Remover ingrediente?', 'Esse item sera removido da refeicao revisada.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: () => {
          closeIngredientSheet();
          onRemoveItem(itemId);
        },
      },
    ]);
  }

  return (
    <>
      <Animated.View style={[s.nutritionHeroCard, buildRevealStyle(heroAnim)]}>
        <View style={s.nutritionHeroGlowTop} />
        <View style={s.nutritionHeroGlowBottom} />

        <View style={s.nutritionHeroHeader}>
          <View style={s.nutritionHeroCopy}>
            <View style={s.nutritionHeroBadgeRow}>
              <View style={s.heroEyebrowPill}>
                <Text style={s.heroEyebrowText}>Revisao guiada</Text>
              </View>
              <View style={s.heroSourcePill}>
                <Ionicons
                  name={source === 'photo' ? 'camera-outline' : 'mic-outline'}
                  size={13}
                  color={Brand.greenDark}
                />
                <Text style={s.heroSourceText}>{sourceLabel(source)}</Text>
              </View>
            </View>

            <Text style={s.nutritionHeroTitle}>{title}</Text>
            <Text style={s.nutritionHeroSubtitle}>
              Revise os itens identificados antes de salvar a refeicao.
            </Text>
          </View>

          {photoUri ? (
            <Image source={{ uri: photoUri }} style={s.nutritionHeroPhoto} />
          ) : (
            <View style={s.nutritionHeroPhotoFallback}>
              <Ionicons name="restaurant-outline" size={22} color={Brand.textSecondary} />
            </View>
          )}
        </View>

        <View style={s.nutritionHeroMetaRow}>
          <InfoBadge
            label={`${draft.items.length}`}
            text={draft.items.length === 1 ? 'ingrediente' : 'ingredientes'}
          />
          {corrections.length > 0 ? (
            <InfoBadge label={`${corrections.length}`} text="ajustes auto" warm />
          ) : null}
        </View>

        <View style={s.summaryGrid}>
          <SummaryMetricCard
            label="Calorias"
            value={draft.summary.calories}
            color={Brand.greenDark}
            accentBg="#ECF8ED"
          />
          <SummaryMetricCard
            label="Proteina"
            value={draft.summary.protein}
            color="#2D89C6"
            accentBg="#E8F4FC"
          />
          <SummaryMetricCard
            label="Carboidratos"
            value={draft.summary.carbs}
            color="#D98A32"
            accentBg="#FFF2E4"
          />
          <SummaryMetricCard
            label="Gorduras"
            value={draft.summary.fat}
            color="#D24E40"
            accentBg="#FEEDEA"
          />
        </View>
      </Animated.View>

      {corrections.length > 0 ? (
        <Animated.View style={[s.reviewCard, buildRevealStyle(correctionAnim)]}>
          <View style={s.sectionHeaderRow}>
            <View style={s.sectionCopy}>
              <Text style={s.sectionTitle}>Ajustes automaticos</Text>
              <Text style={s.sectionHint}>Itens recalculados pela IA antes desta revisao.</Text>
            </View>
            <View style={s.sectionCountBadge}>
              <Text style={s.sectionCountText}>{corrections.length}</Text>
            </View>
          </View>

          <View style={s.correctionsWrap}>
            {corrections.map((entry, index) => (
              <View key={`${entry.original}-${entry.corrected}-${index}`} style={s.correctionBadge}>
                <Text style={s.correctionFrom}>{entry.original}</Text>
                <Ionicons name="arrow-forward" size={12} color={Brand.textSecondary} />
                <Text style={s.correctionTo}>{entry.corrected}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      ) : null}

      <Animated.View style={[s.reviewCard, buildRevealStyle(itemsAnim)]}>
        <View style={s.sectionHeaderRow}>
          <View style={s.sectionCopy}>
            <Text style={s.sectionTitle}>Ingredientes identificados</Text>
            <Text style={s.sectionHint}>Toque em um card para revisar um ingrediente por vez.</Text>
          </View>
          {draft.items.length > 0 ? (
            <View style={s.sectionCountBadge}>
              <Text style={s.sectionCountText}>{draft.items.length}</Text>
            </View>
          ) : null}
        </View>

        {draft.items.length > 0 ? (
          <View style={s.ingredientList}>
            {draft.items.map((item) => (
              <Pressable
                key={item.id}
                style={({ pressed }) => [s.ingredientCard, pressed && s.ingredientCardPressed]}
                onPress={() => openIngredientEditor(item)}>
                <View style={s.ingredientHeader}>
                  <View style={s.ingredientCopy}>
                    <Text style={s.ingredientName}>{item.name || 'Ingrediente sem nome'}</Text>
                    {item.quantityLabel ? (
                      <Text style={s.ingredientMetaText}>{item.quantityLabel}</Text>
                    ) : null}
                  </View>

                  <View style={s.ingredientHeaderRight}>
                    <StatusPill status={item.status} />
                    <Ionicons name="chevron-forward-outline" size={16} color={Brand.textSecondary} />
                  </View>
                </View>

                <View style={s.detectedMacroRow}>
                  <MacroChip label="kcal" value={item.calories} color={Brand.greenDark} bg="#ECF8ED" compact />
                  <MacroChip label="prot" value={item.protein} color="#2D89C6" bg="#E8F4FC" compact />
                  <MacroChip label="carb" value={item.carbs} color="#D98A32" bg="#FFF2E4" compact />
                  <MacroChip label="gord" value={item.fat} color="#D24E40" bg="#FEEDEA" compact />
                </View>

                {item.precisaRevisao ? (
                  <Text style={s.ingredientAttentionText}>Este item foi sinalizado para revisao.</Text>
                ) : null}
              </Pressable>
            ))}
          </View>
        ) : (
          <Text style={s.emptyInlineText}>
            Nesta leitura recebemos apenas o resumo geral, sem separacao por itens.
          </Text>
        )}

        <View style={s.manualEditorBody}>
          <Text style={s.manualHint}>
            Nao encontrou tudo? Adicione um alimento faltando sem sair desta revisao.
          </Text>
          <AppButton title="Adicionar alimento faltando" variant="secondary" onPress={openAddIngredientSheet} />
        </View>
      </Animated.View>

      {draft.items.length === 0 ? (
        <Animated.View style={[s.reviewCard, buildRevealStyle(editorAnim)]}>
          <View style={s.sectionHeaderRow}>
            <View style={s.sectionCopy}>
              <Text style={s.sectionTitle}>Ajustes rapidos</Text>
              <Text style={s.sectionHint}>
                Como nao recebemos os itens separados, ajuste o resumo manualmente se precisar.
              </Text>
            </View>

            <Pressable style={s.manualToggleButton} onPress={() => setShowManualEditor((current) => !current)}>
              <Text style={s.manualToggleText}>{showManualEditor ? 'Ocultar' : 'Ajustar totais'}</Text>
            </Pressable>
          </View>

          {showManualEditor ? (
            <View style={s.manualEditorBody}>
              <View style={s.gridRow}>
                <View style={s.gridCell}>
                  <Text style={s.inputLabel}>Calorias</Text>
                  <AppInput
                    value={draft.summary.calories}
                    onChangeText={(value) => onChangeSummary('calories', value)}
                    placeholder="0 kcal"
                  />
                </View>
                <View style={s.gridCell}>
                  <Text style={s.inputLabel}>Proteina</Text>
                  <AppInput
                    value={draft.summary.protein}
                    onChangeText={(value) => onChangeSummary('protein', value)}
                    placeholder="0 g"
                  />
                </View>
              </View>

              <View style={s.gridRow}>
                <View style={s.gridCell}>
                  <Text style={s.inputLabel}>Carboidratos</Text>
                  <AppInput
                    value={draft.summary.carbs}
                    onChangeText={(value) => onChangeSummary('carbs', value)}
                    placeholder="0 g"
                  />
                </View>
                <View style={s.gridCell}>
                  <Text style={s.inputLabel}>Gorduras</Text>
                  <AppInput
                    value={draft.summary.fat}
                    onChangeText={(value) => onChangeSummary('fat', value)}
                    placeholder="0 g"
                  />
                </View>
              </View>
            </View>
          ) : (
            <Text style={s.manualHint}>
              Use esta opcao apenas se quiser corrigir o resumo final sem ingredientes separados.
            </Text>
          )}
        </Animated.View>
      ) : null}

      <NutritionIngredientEditSheet
        visible={isIngredientSheetVisible}
        mode={ingredientSheet.mode ?? 'edit'}
        currentItem={activeItem}
        draft={ingredientSheet.draft}
        activeAdjustmentMode={ingredientSheet.activeAdjustmentMode}
        onClose={closeIngredientSheet}
        onChangeDraft={updateIngredientSheetDraft}
        onChangeAdjustmentMode={(activeAdjustmentMode) => {
          resetIngredientRecalculation();
          setIngredientSheet((current) => ({
            ...current,
            activeAdjustmentMode,
          }));
        }}
        recalculationPreview={ingredientRecalculation.preview}
        recalculationLookupLabel={ingredientRecalculation.lookupLabel}
        recalculationLoading={ingredientRecalculation.loading}
        recalculationError={ingredientRecalculation.error}
        onRecalculate={handleRecalculateIngredient}
        onApplyRecalculation={handleApplyRecalculatedIngredient}
        onApplyManual={handleApplyManualAdjustment}
        onRemove={ingredientSheet.mode === 'edit' ? handleRemoveIngredient : undefined}
      />
    </>
  );
}

function buildIngredientSheetDraft(item: NutritionReviewDraftItem): NutritionIngredientSheetDraft {
  return {
    name: item.name,
    quantityValue: item.quantityValue,
    quantityUnit: item.quantityUnit,
    calories: item.calories,
    protein: item.protein,
    carbs: item.carbs,
    fat: item.fat,
  };
}

function buildEmptyIngredientSheetDraft(): NutritionIngredientSheetDraft {
  return {
    name: '',
    quantityValue: '',
    quantityUnit: 'g',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
  };
}

function buildIngredientLookupLabel(draft: NutritionIngredientSheetDraft): string {
  const name = draft.name.trim();
  const quantityValue = draft.quantityValue.trim();

  if (!name) return '';
  if (!quantityValue) return name;

  return formatIngredient({
    name,
    weight: quantityValue,
    unit: draft.quantityUnit,
  });
}

function buildIngredientPatch(draft: NutritionIngredientSheetDraft): NutritionReviewDraftItemPatch {
  return {
    name: draft.name.trim(),
    quantityValue: draft.quantityValue.trim(),
    quantityUnit: draft.quantityUnit,
    quantityLabel: buildQuantityLabel(draft.quantityValue, draft.quantityUnit),
  };
}

function buildIngredientInput(
  draft: NutritionIngredientSheetDraft,
  nutrition: NutritionData,
  status: NutritionReviewItemStatus,
): NutritionReviewDraftItemInput {
  return {
    name: draft.name.trim(),
    quantityValue: draft.quantityValue.trim(),
    quantityUnit: draft.quantityUnit,
    quantityLabel: buildQuantityLabel(draft.quantityValue, draft.quantityUnit),
    calories: nutrition.calories,
    protein: nutrition.protein,
    carbs: nutrition.carbs,
    fat: nutrition.fat,
    status,
    precisaRevisao: false,
    warnings: [],
  };
}

function buildManualNutritionDataFromDraft(draft: NutritionIngredientSheetDraft): NutritionData {
  return {
    calories: normalizeNutritionValue(draft.calories, 'kcal'),
    protein: normalizeNutritionValue(draft.protein, 'g'),
    carbs: normalizeNutritionValue(draft.carbs, 'g'),
    fat: normalizeNutritionValue(draft.fat, 'g'),
  };
}

function normalizeNutritionValue(value: string, unit: 'kcal' | 'g'): string {
  const trimmed = value.trim();
  if (trimmed.length > 0) return trimmed;
  return unit === 'kcal' ? '0 kcal' : '0 g';
}

function resolveIngredientRecalculationErrorMessage() {
  return 'Nao conseguimos recalcular esse ingrediente agora. Revise os dados e tente novamente.';
}

function InfoBadge({
  label,
  text,
  warm,
}: {
  label: string;
  text: string;
  warm?: boolean;
}) {
  return (
    <View style={[s.infoBadge, warm && s.infoBadgeWarm]}>
      <Text style={[s.infoBadgeValue, warm && s.infoBadgeValueWarm]}>{label}</Text>
      <Text style={s.infoBadgeText}>{text}</Text>
    </View>
  );
}

function SummaryMetricCard({
  label,
  value,
  color,
  accentBg,
}: {
  label: string;
  value: string;
  color: string;
  accentBg: string;
}) {
  return (
    <View style={s.summaryMetricCard}>
      <View style={[s.summaryMetricAccent, { backgroundColor: accentBg }]}>
        <Text style={[s.summaryMetricAccentText, { color }]}>{label}</Text>
      </View>
      <Text style={s.summaryMetricValue}>{value}</Text>
    </View>
  );
}

function StatusPill({ status }: { status: NutritionReviewItemStatus }) {
  const palette = resolveStatusPalette(status);

  return (
    <View style={[s.statusPill, { backgroundColor: palette.bg }]}>
      <Text style={[s.statusPillText, { color: palette.text }]}>{palette.label}</Text>
    </View>
  );
}

function resolveStatusPalette(status: NutritionReviewItemStatus) {
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

function MacroChip({
  label,
  value,
  color,
  bg,
  compact = false,
}: {
  label: string;
  value: string;
  color: string;
  bg: string;
  compact?: boolean;
}) {
  return (
    <View style={[s.macroChip, compact && s.macroChipCompact, { backgroundColor: bg }]}>
      <Text style={[s.macroChipLabel, { color }]}>{label}</Text>
      <Text style={[s.macroChipValue, { color }]}>{value}</Text>
    </View>
  );
}
