import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { Brand, Radii, Shadows, Typography } from '@/constants/theme';
import { CalculatedDishActionsCard } from '@/features/nutrition/calculated-dish-actions-card';
import { NutritionReviewEditor } from '@/features/review/nutrition-review-editor';
import { PlanReviewEditor } from '@/features/review/plan-review-editor';
import {
  buildQuantityLabel,
  resolveNutritionTitle,
  screenCopy,
} from '@/features/review/review-utils';
import { useAsync } from '@/hooks/use-async';
import { submitReviewAdjustments } from '@/services/review-feedback';
import { clearReviewSession, getReviewSession } from '@/services/review-session';
import type { NutritionCorrection, NutritionData } from '@/types/nutrition';
import type {
  NutritionReviewDraft,
  NutritionReviewDraftItemInput,
  NutritionReviewDraftItemPatch,
  PlanReviewDraft,
  ReviewDraft,
} from '@/types/review';
import { formatIngredient } from '@/utils/helpers';
import { sumNutritionData } from '@/utils/nutrition-math';
import { buildReviewDraft, buildReviewSubmitPayload } from '@/utils/review';

const EMPTY_NUTRITION_DATA: NutritionData = {
  calories: '0 kcal',
  protein: '0g',
  carbs: '0g',
  fat: '0g',
};

export default function AssistedReviewScreen() {
  const router = useRouter();
  const session = getReviewSession();

  const [draft, setDraft] = useState<ReviewDraft | null>(session ? buildReviewDraft(session) : null);
  const resend = useAsync(submitReviewAdjustments);

  function closeReview() {
    clearReviewSession();
    router.back();
  }

  async function handleResend() {
    if (!session || !draft) return;
    const payload = buildReviewSubmitPayload(session, draft);
    await resend.execute(payload);
  }

  function updateObservation(value: string) {
    setDraft((prev) => (prev ? { ...prev, observation: value } : prev));
  }

  function updateNutritionSummary(
    field: 'calories' | 'protein' | 'carbs' | 'fat',
    value: string,
  ) {
    setDraft((prev) => {
      if (!prev || prev.kind !== 'nutrition') return prev;
      return {
        ...prev,
        summary: {
          ...prev.summary,
          [field]: value,
        },
      };
    });
  }

  function commitNutritionItem(itemId: string, patch: NutritionReviewDraftItemPatch) {
    setDraft((prev) => {
      if (!prev || prev.kind !== 'nutrition') return prev;
      const nextItems = prev.items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              ...patch,
              quantityLabel: buildQuantityLabel(
                patch.quantityValue ?? item.quantityValue,
                patch.quantityUnit ?? item.quantityUnit,
              ),
            }
          : item,
      );

      return {
        ...prev,
        summary: buildNutritionSummaryFromItems(nextItems),
        items: nextItems,
      };
    });
  }

  function removeNutritionItem(itemId: string) {
    setDraft((prev) => {
      if (!prev || prev.kind !== 'nutrition') return prev;
      const nextItems = prev.items.filter((item) => item.id !== itemId);

      return {
        ...prev,
        summary: buildNutritionSummaryFromItems(nextItems),
        items: nextItems,
      };
    });
  }

  function addNutritionItem(item: NutritionReviewDraftItemInput) {
    setDraft((prev) => {
      if (!prev || prev.kind !== 'nutrition') return prev;
      const nextItems = [
        ...prev.items,
        {
          ...item,
          id: buildNutritionItemId(prev.items.length),
          quantityLabel: buildQuantityLabel(item.quantityValue, item.quantityUnit),
        },
      ];

      return {
        ...prev,
        summary: buildNutritionSummaryFromItems(nextItems),
        items: nextItems,
      };
    });
  }

  function updatePlanSection(itemId: string, field: 'title' | 'text', value: string) {
    setDraft((prev) => {
      if (!prev || prev.kind !== 'plan') return prev;
      return {
        ...prev,
        sections: prev.sections.map((section) => (section.id === itemId ? { ...section, [field]: value } : section)),
      };
    });
  }

  function addPlanSection() {
    setDraft((prev) => {
      if (!prev || prev.kind !== 'plan') return prev;
      const nextId = `plan-section-${prev.sections.length + 1}`;
      return {
        ...prev,
        sections: [...prev.sections, { id: nextId, title: '', text: '' }],
      };
    });
  }

  function removePlanSection(itemId: string) {
    setDraft((prev) => {
      if (!prev || prev.kind !== 'plan') return prev;
      return {
        ...prev,
        sections: prev.sections.filter((section) => section.id !== itemId),
      };
    });
  }

  if (!session || !draft) {
    return (
      <View style={s.root}>
        <View style={s.emptyWrap}>
          <View style={s.emptyIcon}>
            <Ionicons name="search" size={24} color={Brand.greenDeeper} />
          </View>
          <Text style={s.emptyTitle}>Sem revisão disponível</Text>
          <Text style={s.emptyText}>Nenhum dado encontrado para esta sessão.</Text>
          <AppButton title="Voltar" onPress={closeReview} />
        </View>
      </View>
    );
  }

  const copy = screenCopy(session.kind);
  const nutritionPhotoPreviewUri =
    session.kind === 'nutrition' && session.source === 'photo'
      ? session.photoPreviewUri ?? session.photoPayload ?? null
      : null;
  const nutritionPhotoPayload =
    session.kind === 'nutrition' && session.source === 'photo' ? session.photoPayload ?? null : null;
  const nutritionContext =
    session.kind === 'nutrition' && draft.kind === 'nutrition'
      ? (() => {
          const corrections = session.result.corrections.filter(
            (entry) => entry.original.trim().length > 0 && entry.corrected.trim().length > 0,
          );
          return {
            corrections,
            title: resolveNutritionTitle(session.result.detectedDishName, draft.items, corrections),
            source: session.source,
          };
        })()
      : null;
  const nutritionFoodsLabel =
    draft.kind === 'nutrition'
      ? draft.items
          .map((item) =>
            item.quantityValue.trim()
              ? formatIngredient({
                  name: item.name.trim(),
                  weight: item.quantityValue.trim(),
                  unit: item.quantityUnit,
                })
              : item.name.trim(),
          )
          .filter((item) => item.length > 0)
          .join(', ')
      : '';

  return (
    <View style={s.root}>
      <View style={s.topBar}>
        <Pressable
          style={({ pressed }) => [s.backBtn, pressed && s.backBtnPressed]}
          onPress={closeReview}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Voltar">
          <Ionicons name="chevron-back" size={20} color={Brand.text} />
        </Pressable>
        <Text style={s.topTitle}>Revisão</Text>
        <View style={s.topSpacer} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.heroBlock}>
          <View style={s.heroEyebrow}>
            <Ionicons name="sparkles" size={11} color={Brand.greenDeeper} />
            <Text style={s.heroEyebrowText}>REVISÃO ASSISTIDA</Text>
          </View>
          <Text style={s.title}>{copy.title}</Text>
          <Text style={s.subtitle}>{copy.subtitle}</Text>
        </View>

        {draft.kind === 'nutrition' && nutritionContext ? (
          <NutritionReviewEditor
            draft={draft as NutritionReviewDraft}
            source={nutritionContext.source}
            title={nutritionContext.title}
            photoUri={nutritionPhotoPreviewUri}
            corrections={nutritionContext.corrections as NutritionCorrection[]}
            onChangeSummary={updateNutritionSummary}
            onCommitItem={commitNutritionItem}
            onAddItem={addNutritionItem}
            onRemoveItem={removeNutritionItem}
          />
        ) : null}

        {draft.kind === 'plan' ? (
          <PlanReviewEditor
            draft={draft as PlanReviewDraft}
            onChangeSection={updatePlanSection}
            onAddSection={addPlanSection}
            onRemoveSection={removePlanSection}
          />
        ) : null}

        <View style={s.observationCard}>
          <View style={s.observationHeader}>
            <View style={s.observationIconWrap}>
              <Ionicons name="create" size={16} color={Brand.indigo} />
            </View>
            <View style={s.observationCopy}>
              <Text style={s.observationTitle}>Observação opcional</Text>
              <Text style={s.observationHint}>
                Conte sobre um molho, bebida ou item ao fundo que não apareceu na análise.
              </Text>
            </View>
          </View>
          <TextInput
            value={draft.observation}
            onChangeText={updateObservation}
            placeholder="Algum detalhe que faltou..."
            placeholderTextColor={Brand.textMuted}
            multiline
            style={s.multiInput}
          />
        </View>

        {resend.error ? (
          <View style={s.feedbackCard}>
            <View style={[s.feedbackIcon, s.errorIcon]}>
              <Ionicons name="alert-circle" size={16} color={Brand.danger} />
            </View>
            <View style={s.feedbackCopy}>
              <Text style={[s.feedbackTitle, s.errorTitle]}>Não foi possível enviar</Text>
              <Text style={s.feedbackText}>{resolveReviewFeedbackErrorMessage()}</Text>
              <Pressable onPress={handleResend}>
                <Text style={s.retryText}>Tentar novamente</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {resend.data ? (
          <View style={s.feedbackCard}>
            <View style={[s.feedbackIcon, s.successIcon]}>
              <Ionicons name="checkmark-circle" size={16} color={Brand.greenDeeper} />
            </View>
            <View style={s.feedbackCopy}>
              <Text style={[s.feedbackTitle, s.successTitleText]}>Ajustes enviados</Text>
              <Text style={s.feedbackText}>
                Recebemos sua revisão. Obrigado por ajudar a melhorar seus registros.
              </Text>
            </View>
          </View>
        ) : null}

        {draft.kind === 'nutrition' && nutritionContext ? (
          <CalculatedDishActionsCard
            nutritionData={{
              calories: `${draft.summary.calories}`.trim(),
              protein: `${draft.summary.protein}`.trim(),
              carbs: `${draft.summary.carbs}`.trim(),
              fat: `${draft.summary.fat}`.trim(),
            }}
            baseFoods={nutritionFoodsLabel}
            initialDishName={nutritionContext.title}
            initialDate={session.kind === 'nutrition' ? session.targetDate ?? undefined : undefined}
            imagePayload={nutritionPhotoPayload}
            title="Quer guardar essa refeição?"
            subtitle="Depois da revisão, você pode registrar em um período do dia ou salvar em Meus pratos."
          />
        ) : null}
      </ScrollView>

      <View style={s.footer}>
        <View style={s.footerRow}>
          <View style={s.footerButton}>
            <AppButton title="Enviar revisão" onPress={handleResend} loading={resend.loading} variant="secondary" />
          </View>
          <View style={s.footerButton}>
            <AppButton title="Confirmar refeição" onPress={closeReview} />
          </View>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Brand.bg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(20,108,56,0.08)',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Brand.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnPressed: {
    backgroundColor: Brand.border,
    opacity: 0.9,
  },
  topTitle: {
    ...Typography.subtitle,
    fontSize: 16,
    fontWeight: '900',
    color: Brand.text,
    letterSpacing: -0.2,
  },
  topSpacer: {
    width: 40,
  },
  scroll: {
    padding: 18,
    gap: 14,
    paddingBottom: 120,
  },
  heroBlock: {
    gap: 6,
    marginBottom: 4,
  },
  heroEyebrow: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: Radii.pill,
    backgroundColor: Brand.surfaceSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  heroEyebrowText: {
    ...Typography.caption,
    fontSize: 10,
    color: Brand.greenDeeper,
    fontWeight: '900',
    letterSpacing: 1.1,
  },
  title: {
    ...Typography.title,
    fontSize: 24,
    lineHeight: 28,
    color: Brand.text,
    fontWeight: '900',
    letterSpacing: -0.6,
    marginTop: 2,
  },
  subtitle: {
    ...Typography.body,
    fontSize: 14,
    lineHeight: 20,
    color: Brand.textSecondary,
    fontWeight: '500',
  },
  observationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: 'rgba(20,108,56,0.08)',
    padding: 16,
    gap: 12,
    ...Shadows.card,
  },
  observationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  observationIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#EEF0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  observationCopy: {
    flex: 1,
    gap: 3,
  },
  observationTitle: {
    ...Typography.body,
    fontSize: 15,
    color: Brand.text,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  observationHint: {
    ...Typography.caption,
    fontSize: 12,
    color: Brand.textSecondary,
    fontWeight: '500',
    lineHeight: 17,
  },
  multiInput: {
    minHeight: 110,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Brand.border,
    backgroundColor: Brand.surfaceAlt,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Brand.text,
    fontSize: 14,
    lineHeight: 20,
    textAlignVertical: 'top',
  },
  feedbackCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: 'rgba(20,108,56,0.08)',
    padding: 14,
    ...Shadows.card,
  },
  feedbackIcon: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorIcon: {
    backgroundColor: '#FFF0F0',
  },
  successIcon: {
    backgroundColor: Brand.surfaceSoft,
  },
  feedbackCopy: {
    flex: 1,
    gap: 4,
  },
  feedbackTitle: {
    ...Typography.body,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.1,
  },
  errorTitle: {
    color: Brand.danger,
  },
  successTitleText: {
    color: Brand.greenDeeper,
  },
  feedbackText: {
    ...Typography.caption,
    fontSize: 12,
    color: Brand.textSecondary,
    lineHeight: 17,
    fontWeight: '500',
  },
  retryText: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: '800',
    color: Brand.danger,
    letterSpacing: 0.3,
    marginTop: 4,
  },
  footer: {
    paddingHorizontal: 18,
    paddingBottom: 18,
    paddingTop: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: 'rgba(20,108,56,0.08)',
  },
  footerRow: {
    flexDirection: 'row',
    gap: 10,
  },
  footerButton: {
    flex: 1,
  },
  emptyWrap: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Brand.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    ...Typography.subtitle,
    fontSize: 18,
    color: Brand.text,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  emptyText: {
    ...Typography.body,
    fontSize: 13,
    color: Brand.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
});

function buildNutritionSummaryFromItems(items: NutritionReviewDraft['items']): NutritionData {
  return items.reduce(
    (acc, item) =>
      sumNutritionData(acc, {
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
      }),
    EMPTY_NUTRITION_DATA,
  );
}

function buildNutritionItemId(index: number): string {
  return `nutrition-item-${Date.now()}-${index + 1}`;
}

function resolveReviewFeedbackErrorMessage() {
  return 'Não conseguimos enviar sua revisão agora. Tente novamente em instantes.';
}
