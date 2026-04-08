import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { Brand } from '@/constants/theme';
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
          <Text style={s.title}>Resultado da analise</Text>
          <Text style={s.emptyText}>Nenhum dado disponivel para revisao.</Text>
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
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.title}>{copy.title}</Text>
        <Text style={s.subtitle}>{copy.subtitle}</Text>

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

        <View style={s.card}>
          <Text style={s.sectionTitle}>Observacao opcional</Text>
          <Text style={s.sectionHint}>
            Conte, por exemplo, se havia um molho, bebida ou item ao fundo que nao apareceu na analise.
          </Text>
          <TextInput
            value={draft.observation}
            onChangeText={updateObservation}
            placeholder="Conte aqui algum detalhe que faltou, como molho, bebida ou um item ao fundo."
            placeholderTextColor={Brand.textSecondary}
            multiline
            style={s.multiInput}
          />
        </View>

        {resend.error ? (
          <View style={s.errorCard}>
            <Text style={s.errorText}>{resolveReviewFeedbackErrorMessage()}</Text>
            <Pressable onPress={handleResend}>
              <Text style={s.retryText}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : null}

        {resend.data ? (
          <View style={s.successCard}>
            <Text style={s.successTitle}>Ajustes enviados</Text>
            <Text style={s.successText}>
              Recebemos sua revisao. Obrigado por ajudar a melhorar seus registros.
            </Text>
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
            title="Quer guardar essa refeicao?"
            subtitle="Depois da revisao, voce pode registrar essa refeicao em um periodo do dia ou salvar em Meus pratos."
          />
        ) : null}
      </ScrollView>

      <View style={s.footer}>
        <View style={s.footerRow}>
          <View style={s.footerButton}>
            <AppButton title="Enviar revisao" onPress={handleResend} loading={resend.loading} variant="secondary" />
          </View>
          <View style={s.footerButton}>
            <AppButton title="Confirmar refeicao" onPress={closeReview} />
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
  scroll: {
    padding: 20,
    gap: 12,
    paddingBottom: 120,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Brand.text,
  },
  subtitle: {
    fontSize: 13,
    color: Brand.textSecondary,
    lineHeight: 19,
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
  sectionHint: {
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
  errorCard: {
    backgroundColor: '#FFF0F0',
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  errorText: {
    fontSize: 13,
    color: Brand.danger,
    lineHeight: 19,
  },
  retryText: {
    fontSize: 13,
    fontWeight: '700',
    color: Brand.danger,
  },
  successCard: {
    backgroundColor: '#F0FFF4',
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  successTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Brand.greenDark,
  },
  successText: {
    fontSize: 13,
    color: Brand.greenDark,
    lineHeight: 19,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 10,
    backgroundColor: Brand.bg,
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
    padding: 20,
    justifyContent: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: Brand.textSecondary,
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
  return 'Nao conseguimos enviar sua revisao agora. Tente novamente em instantes.';
}
