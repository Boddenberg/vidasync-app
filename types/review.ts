import type { NutritionAnalysisResult, NutritionData } from '@/types/nutrition';
import type { PlanPdfAnalysisResult } from '@/types/plan';

export type ReviewSource = 'photo' | 'audio' | 'pdf';

export type NutritionReviewItemStatus = 'automatic' | 'recalculated' | 'manual' | 'added';
export type NutritionReviewQuantityUnit = 'g' | 'ml' | 'un';

export type ReviewSession =
  | {
      kind: 'nutrition';
      source: 'photo' | 'audio';
      createdAt: string;
      result: NutritionAnalysisResult;
      photoPreviewUri?: string | null;
      photoPayload?: string | null;
      targetDate?: string | null;
    }
  | {
      kind: 'plan';
      source: 'pdf';
      createdAt: string;
      result: PlanPdfAnalysisResult;
    };

export type NutritionReviewDraftItem = {
  id: string;
  name: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  status: NutritionReviewItemStatus;
  quantityValue: string;
  quantityUnit: NutritionReviewQuantityUnit;
  quantityLabel?: string | null;
  precisaRevisao: boolean;
  warnings: string[];
};

export type NutritionReviewDraftItemPatch = Partial<
  Pick<
    NutritionReviewDraftItem,
    | 'name'
    | 'calories'
    | 'protein'
    | 'carbs'
    | 'fat'
    | 'status'
    | 'quantityValue'
    | 'quantityUnit'
    | 'quantityLabel'
  >
>;

export type PlanReviewDraftSection = {
  id: string;
  title: string;
  text: string;
};

export type NutritionReviewDraft = {
  kind: 'nutrition';
  source: 'photo' | 'audio';
  warnings: string[];
  observation: string;
  summary: NutritionData;
  items: NutritionReviewDraftItem[];
};

export type PlanReviewDraft = {
  kind: 'plan';
  source: 'pdf';
  warnings: string[];
  observation: string;
  extractedText: string;
  sections: PlanReviewDraftSection[];
};

export type ReviewDraft = NutritionReviewDraft | PlanReviewDraft;

export type ReviewSubmitPayload =
  | {
      contexto: 'revisao_assistida';
      kind: 'nutrition';
      source: 'photo' | 'audio';
      trace_id: string | null;
      created_at: string;
      confirmed_at: string;
      warnings: string[];
      observation: string | null;
      adjustments: {
        summary: NutritionData;
        items: {
          name: string;
          nutrition: NutritionData;
          precisa_revisao: boolean;
          warnings: string[];
        }[];
      };
    }
  | {
      contexto: 'revisao_assistida';
      kind: 'plan';
      source: 'pdf';
      trace_id: string | null;
      created_at: string;
      confirmed_at: string;
      warnings: string[];
      observation: string | null;
      adjustments: {
        extracted_text: string | null;
        sections: {
          title: string;
          text: string;
        }[];
      };
    };

export type ReviewSubmitResult = {
  status: string;
  warnings: string[];
  traceId: string | null;
  message: string | null;
};

