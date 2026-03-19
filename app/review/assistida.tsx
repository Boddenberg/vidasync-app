import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { Brand } from '@/constants/theme';
import { CalculatedDishActionsCard } from '@/features/nutrition/calculated-dish-actions-card';
import { NutritionReviewEditor } from '@/features/review/nutrition-review-editor';
import { PlanReviewEditor } from '@/features/review/plan-review-editor';
import {
  resolveNutritionTitle,
  screenCopy,
} from '@/features/review/review-utils';
import { useAsync } from '@/hooks/use-async';
import { submitReviewAdjustments } from '@/services/review-feedback';
import { clearReviewSession, getReviewSession } from '@/services/review-session';
import type { NutritionCorrection } from '@/types/nutrition';
import type { NutritionReviewDraft, PlanReviewDraft, ReviewDraft } from '@/types/review';
import { buildReviewDraft, buildReviewSubmitPayload } from '@/utils/review';

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

  function updateNutritionItem(
    itemId: string,
    field: 'name' | 'calories' | 'protein' | 'carbs' | 'fat',
    value: string,
  ) {
    setDraft((prev) => {
      if (!prev || prev.kind !== 'nutrition') return prev;
      return {
        ...prev,
        items: prev.items.map((item) => (item.id === itemId ? { ...item, [field]: value } : item)),
      };
    });
  }

  function addNutritionItem() {
    setDraft((prev) => {
      if (!prev || prev.kind !== 'nutrition') return prev;
      const nextId = `nutrition-item-${prev.items.length + 1}`;
      return {
        ...prev,
        items: [
          ...prev.items,
          {
            id: nextId,
            name: '',
            calories: '',
            protein: '',
            carbs: '',
            fat: '',
            precisaRevisao: false,
            warnings: [],
          },
        ],
      };
    });
  }

  function removeNutritionItem(itemId: string) {
    setDraft((prev) => {
      if (!prev || prev.kind !== 'nutrition') return prev;
      return {
        ...prev,
        items: prev.items.filter((item) => item.id !== itemId),
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
          <Text style={s.title}>Resultado da análise</Text>
          <Text style={s.emptyText}>Nenhum dado disponível para revisão.</Text>
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
          .map((item) => item.name.trim())
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
            onChangeItem={updateNutritionItem}
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
          <Text style={s.sectionTitle}>Quer acrescentar algo?</Text>
          <TextInput
            value={draft.observation}
            onChangeText={updateObservation}
            placeholder="Escreva observações opcionais sobre esta análise..."
            placeholderTextColor={Brand.textSecondary}
            multiline
            style={s.multiInput}
          />
        </View>

        {resend.error ? (
          <View style={s.errorCard}>
            <Text style={s.errorText}>{resend.error}</Text>
            <Pressable onPress={handleResend}>
              <Text style={s.retryText}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : null}

        {resend.data ? (
          <View style={s.successCard}>
            <Text style={s.successTitle}>Ajustes enviados</Text>
            <Text style={s.successText}>
              Recebemos suas observações. Obrigado por ajudar a melhorar seus registros.
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
            <AppButton title="Tudo certo" onPress={closeReview} />
          </View>
          <View style={s.footerButton}>
            <AppButton title="Enviar ajustes" onPress={handleResend} loading={resend.loading} />
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
