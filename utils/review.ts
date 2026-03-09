import type { NutritionData } from '@/types/nutrition';
import type {
  NutritionReviewDraft,
  PlanReviewDraft,
  PlanReviewDraftSection,
  ReviewDraft,
  ReviewSession,
  ReviewSubmitPayload,
} from '@/types/review';

function trimOrFallback(value: string, fallback: string): string {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : fallback;
}

function nutritionClone(data: NutritionData): NutritionData {
  return {
    calories: `${data.calories}`.trim(),
    protein: `${data.protein}`.trim(),
    carbs: `${data.carbs}`.trim(),
    fat: `${data.fat}`.trim(),
  };
}

function buildNutritionDraft(session: Extract<ReviewSession, { kind: 'nutrition' }>): NutritionReviewDraft {
  const summary = nutritionClone(session.result.nutrition);

  const items = session.result.ingredients.map((item, index) => ({
    id: `nutrition-item-${index}`,
    name: item.name,
    calories: item.nutrition.calories,
    protein: item.nutrition.protein,
    carbs: item.nutrition.carbs,
    fat: item.nutrition.fat,
    precisaRevisao: item.precisaRevisao,
    warnings: item.warnings,
  }));

  return {
    kind: 'nutrition',
    source: session.source,
    warnings: session.result.warnings,
    observation: '',
    summary,
    items,
  };
}

function buildPlanFallbackSection(resultText: string): PlanReviewDraftSection {
  return {
    id: 'plan-section-0',
    title: 'Texto extraido',
    text: resultText.trim(),
  };
}

function buildPlanDraft(session: Extract<ReviewSession, { kind: 'plan' }>): PlanReviewDraft {
  const extractedText = session.result.extractedText ?? '';
  const hasSections = session.result.sections.length > 0;

  const sections = hasSections
    ? session.result.sections.map((section, index) => ({
        id: `plan-section-${index}`,
        title: section.title,
        text: section.text,
      }))
    : extractedText.trim().length > 0
      ? [buildPlanFallbackSection(extractedText)]
      : [];

  return {
    kind: 'plan',
    source: session.source,
    warnings: session.result.warnings,
    observation: '',
    extractedText,
    sections,
  };
}

/*
 * Converte a sessao bruta em estado editavel para a tela de revisao.
 */
export function buildReviewDraft(session: ReviewSession): ReviewDraft {
  if (session.kind === 'nutrition') {
    return buildNutritionDraft(session);
  }
  return buildPlanDraft(session);
}

/*
 * Monta payload final de reenvio de revisao para o BFF.
 */
export function buildReviewSubmitPayload(
  session: ReviewSession,
  draft: ReviewDraft,
): ReviewSubmitPayload {
  if (session.kind === 'nutrition' && draft.kind === 'nutrition') {
    const itemsForSubmit =
      draft.items.length > 0
        ? draft.items
        : [
            {
              id: 'nutrition-item-fallback',
              name: 'Item principal',
              calories: draft.summary.calories,
              protein: draft.summary.protein,
              carbs: draft.summary.carbs,
              fat: draft.summary.fat,
              precisaRevisao: true,
              warnings: ['Item sintetico gerado a partir do resumo da analise.'],
            },
          ];

    return {
      contexto: 'revisao_assistida',
      kind: 'nutrition',
      source: session.source,
      trace_id: session.result.traceId,
      created_at: session.createdAt,
      confirmed_at: new Date().toISOString(),
      warnings: draft.warnings,
      observation: draft.observation.trim() || null,
      adjustments: {
        summary: nutritionClone(draft.summary),
        items: itemsForSubmit.map((item) => ({
          name: trimOrFallback(item.name, 'Item sem nome'),
          nutrition: {
            calories: trimOrFallback(item.calories, '0 kcal'),
            protein: trimOrFallback(item.protein, '0 g'),
            carbs: trimOrFallback(item.carbs, '0 g'),
            fat: trimOrFallback(item.fat, '0 g'),
          },
          precisa_revisao: Boolean(item.precisaRevisao),
          warnings: item.warnings,
        })),
      },
    };
  }

  return {
    contexto: 'revisao_assistida',
    kind: 'plan',
    source: 'pdf',
    trace_id: session.kind === 'plan' ? session.result.traceId : null,
    created_at: session.createdAt,
    confirmed_at: new Date().toISOString(),
    warnings: draft.kind === 'plan' ? draft.warnings : [],
    observation: draft.kind === 'plan' ? draft.observation.trim() || null : null,
    adjustments: {
      extracted_text:
        draft.kind === 'plan' && draft.extractedText.trim().length > 0
          ? draft.extractedText.trim()
          : null,
      sections:
        draft.kind === 'plan'
          ? draft.sections
              .map((section) => ({
                title: section.title.trim(),
                text: section.text.trim(),
              }))
              .filter((section) => section.title.length > 0 && section.text.length > 0)
          : [],
    },
  };
}

export function mapReviewSubmitErrorMessage(rawMessage: string): string {
  const message = rawMessage.toLowerCase();

  if (message.includes('404') || message.includes('"status":404')) {
    return 'Endpoint de revisao nao encontrado no BFF atual. Confirme o contrato de revisao assistida.';
  }

  return rawMessage;
}

